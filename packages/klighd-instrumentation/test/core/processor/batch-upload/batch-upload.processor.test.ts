/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */

import { expect } from 'chai'
import { describe, it } from 'mocha'
import { IDBFactory } from 'fake-indexeddb'

import { BatchUploadProcessor, IndexedDbBatchUploadStore } from '../../../../src/core/processor/batch-upload'
import { SequencedInteractionEvent } from '../../../../src/core/collector'
import { BatchUploadConfiguration } from '../../../../src/core/config'
import { HttpClient } from '../../../../src/core/http'
import { FixedClock } from '../../../../src/core/time'

const sessionId = 'session-under-test'
const testConfiguration: BatchUploadConfiguration = {
    maxConcurrentUploads: 2,
    flushIntervalMs: 60_000,
    maxEventsPerBatch: 2,
    leaseDurationMs: 1_000,
    minimumRetryDelayMs: 1,
    maximumRetryDelayMs: 1,
}

describe('BatchUploadProcessor', () => {
    it('falls back to in-memory storage when IndexedDB is unavailable', async () => {
        const clock = new FixedClock(0)
        const httpClient = createHttpClient(async () => acknowledgementResponse({ batchId: 'unused', events: [] }))
        const indexedDbDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
        Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: undefined })

        try {
            const processor = await BatchUploadProcessor.create(
                sessionId,
                'https://collector.example',
                testConfiguration,
                clock,
                httpClient
            )
            expect(processor).to.be.instanceOf(BatchUploadProcessor)
            await processor.dispose()
        } finally {
            if (indexedDbDescriptor) {
                Object.defineProperty(globalThis, 'indexedDB', indexedDbDescriptor)
            } else {
                delete (globalThis as { indexedDB?: IDBFactory }).indexedDB
            }
        }
    })

    it('uploads a sealed batch with its session ID and removes it after acknowledgement', async () => {
        globalThis.indexedDB = new IDBFactory()
        const clock = new FixedClock(0)
        const uploadedPayloads: Array<{ batchId: string; sessionId: string; events: SequencedInteractionEvent[] }> = []
        const httpClient = createHttpClient(async (_url, data) => {
            const payload = data as (typeof uploadedPayloads)[number]
            uploadedPayloads.push(payload)
            return acknowledgementResponse(payload)
        })

        const processor = await BatchUploadProcessor.create(
            sessionId,
            'https://collector.example',
            testConfiguration,
            clock,
            httpClient
        )
        processor.process(createEvent(1))
        processor.process(createEvent(2))

        await waitUntil(() => expect(uploadedPayloads).to.have.lengthOf(1))
        expect(uploadedPayloads[0]).to.include({ sessionId })
        expect(uploadedPayloads[0]?.events.map((event) => event.sequence)).to.deep.equal([1, 2])
        await processor.dispose()
    })

    it('seals and uploads events remaining below the batch limit during disposal', async () => {
        globalThis.indexedDB = new IDBFactory()
        const clock = new FixedClock(0)
        const uploadedPayloads: Array<{ events: SequencedInteractionEvent[] }> = []
        const httpClient = createHttpClient(async (_url, data) => {
            const payload = data as { batchId: string; events: SequencedInteractionEvent[] }
            uploadedPayloads.push(payload)
            return acknowledgementResponse(payload)
        })

        const processor = await BatchUploadProcessor.create(
            sessionId,
            'https://collector.example',
            testConfiguration,
            clock,
            httpClient
        )
        processor.process(createEvent(1))
        await processor.dispose()

        expect(uploadedPayloads).to.have.lengthOf(1)
        expect(uploadedPayloads[0]?.events).to.have.lengthOf(1)
    })

    it('retains a failed batch with retry metadata', async () => {
        globalThis.indexedDB = new IDBFactory()
        const clock = new FixedClock(0)
        let fetchCallCount = 0
        const httpClient = createHttpClient(async () => {
            fetchCallCount += 1
            return new Response('unavailable', { status: 503 })
        })

        const processor = await BatchUploadProcessor.create(
            sessionId,
            'https://collector.example',
            {
                ...testConfiguration,
                minimumRetryDelayMs: 60_000,
                maximumRetryDelayMs: 60_000,
            },
            clock,
            httpClient
        )
        processor.process(createEvent(1))
        processor.process(createEvent(2))

        await processor.dispose()
        expect(fetchCallCount).to.equal(1)
        clock.sleep(120_000)
        await waitUntil(async () => {
            const store = await IndexedDbBatchUploadStore.open(clock, 'observer', testConfiguration.flushIntervalMs * 2)
            const batches = await store.claimNextBatches({ ownerId: 'observer', leaseDurationMs: 1, maxBatchCount: 1 })
            expect(batches[0]).to.include({ attempts: 1 })
        })
    })

    it('uploads pending batches up to the configured concurrency limit', async () => {
        globalThis.indexedDB = new IDBFactory()
        const clock = new FixedClock(10)
        const store = await IndexedDbBatchUploadStore.open(clock, 'seed-session', testConfiguration.flushIntervalMs * 2)
        await addAndSeal(store, createEvent(1))
        clock.sleep(1)
        await addAndSeal(store, createEvent(2))
        clock.sleep(1)
        await addAndSeal(store, createEvent(3))

        const responses: Array<() => void> = []
        const uploadedSequences: number[] = []
        const httpClient = createHttpClient(async (_url, data) => {
            const payload = data as { batchId: string; events: SequencedInteractionEvent[] }
            uploadedSequences.push(payload.events[0]?.sequence ?? -1)
            return new Promise<Response>((resolve) => {
                responses.push(() => resolve(acknowledgementResponse(payload)))
            })
        })

        const processor = await BatchUploadProcessor.create(
            sessionId,
            'https://collector.example',
            testConfiguration,
            clock,
            httpClient
        )
        await waitUntil(() => expect(uploadedSequences).to.deep.equal([1, 2]))
        responses.splice(0).forEach((respond) => respond())
        await waitUntil(() => expect(uploadedSequences).to.deep.equal([1, 2, 3]))
        responses.splice(0).forEach((respond) => respond())
        await processor.dispose()
    })

    it('does not accept events after disposal', async () => {
        globalThis.indexedDB = new IDBFactory()
        const clock = new FixedClock(0)
        const uploadedPayloads: unknown[] = []
        const httpClient = createHttpClient(async (_url, data) => {
            uploadedPayloads.push(data)
            return acknowledgementResponse({ batchId: 'unused', events: [] })
        })

        const processor = await BatchUploadProcessor.create(
            sessionId,
            'https://collector.example',
            testConfiguration,
            clock,
            httpClient
        )
        await processor.dispose()
        processor.process(createEvent(1))

        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(uploadedPayloads).to.be.empty
    })
})

function acknowledgementResponse(payload: { batchId: string; events: SequencedInteractionEvent[] }): Response {
    return new Response(JSON.stringify({ batchId: payload.batchId, acceptedEvents: payload.events.length }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
    })
}

function createHttpClient(postJson: HttpClient['postJson']): HttpClient {
    return { postJson }
}

async function addAndSeal(store: IndexedDbBatchUploadStore, event: SequencedInteractionEvent): Promise<void> {
    await store.addEvent(event)
    await store.sealBatch()
}

function createEvent(sequence: number): SequencedInteractionEvent {
    return {
        schemaVersion: 1,
        eventId: `event-${sequence}`,
        type: 'test',
        occurredAt: sequence,
        data: {},
        sequence,
    }
}

async function waitUntil(assertion: () => unknown | Promise<unknown>, timeoutMs = 1_000): Promise<void> {
    const startedAt = performance.now()
    while (true) {
        try {
            await assertion()
            return
        } catch (error) {
            if (performance.now() - startedAt >= timeoutMs) {
                throw error
            }
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise<void>((resolve) => setTimeout(resolve, 5))
    }
}
