/* eslint-disable import/no-extraneous-dependencies */

import { expect } from 'chai'
import { describe, it } from 'mocha'
import { IDBFactory } from 'fake-indexeddb'

import { startPendingBatchUploadLoop } from '../src'
import { SequencedInteractionEvent } from '../src/core/collector'
import { IndexedDbBatchUploadStore } from '../src/core/processor/batch-upload'
import { FixedClock } from '../src/core/time'

const collectorUrl = 'https://collector.example'

describe('startPendingBatchUploadLoop', () => {
    it('uploads a pending batch for its original session without registering a new session', async () => {
        globalThis.indexedDB = new IDBFactory()
        const event = createEvent(1, Date.now())
        await addAndSeal('last-session', event)

        const requests: Array<{ url: string; payload: BatchPayload }> = []
        await withFetchStub(
            async (url, init) => {
                const payload = JSON.parse(String(init?.body)) as BatchPayload
                requests.push({ url, payload })
                return acknowledgementResponse(payload)
            },
            async () => {
                const loop = await startPendingBatchUploadLoop({
                    apiBaseUrl: collectorUrl,
                    batchUpload: { flushIntervalMs: 60_000 },
                })
                let disposed = false

                try {
                    await waitUntil(() => expect(requests).to.have.lengthOf(1))
                    expect(requests[0]?.url).to.equal(`${collectorUrl}/api/batch`)
                    expect(requests[0]?.payload).to.include({ sessionId: 'last-session' })
                    expect(requests[0]?.payload.events).to.deep.equal([event])
                    await loop.dispose()
                    disposed = true
                    await expectNoPendingBatches()
                } finally {
                    if (!disposed) {
                        await loop.dispose()
                    }
                }
            }
        )
    })

    it('seals and uploads an abandoned active batch from a prior session', async () => {
        globalThis.indexedDB = new IDBFactory()
        const event = createEvent(1, Date.now() - 1_000)
        await addActiveEvent('last-session', event)

        const requests: BatchPayload[] = []
        await withFetchStub(
            async (_url, init) => {
                const payload = JSON.parse(String(init?.body)) as BatchPayload
                requests.push(payload)
                return acknowledgementResponse(payload)
            },
            async () => {
                const loop = await startPendingBatchUploadLoop({
                    apiBaseUrl: collectorUrl,
                    batchUpload: { flushIntervalMs: 10 },
                })
                let disposed = false

                try {
                    await waitUntil(() => expect(requests).to.have.lengthOf(1))
                    expect(requests[0]).to.include({ sessionId: 'last-session' })
                    expect(requests[0]?.events).to.deep.equal([event])
                    await loop.dispose()
                    disposed = true
                    await expectNoPendingBatches()
                } finally {
                    if (!disposed) {
                        await loop.dispose()
                    }
                }
            }
        )
    })
})

interface BatchPayload {
    batchId: string
    sessionId: string
    createdAt: number
    events: SequencedInteractionEvent[]
}

async function addAndSeal(sessionId: string, event: SequencedInteractionEvent): Promise<void> {
    const store = await IndexedDbBatchUploadStore.open(new FixedClock(Date.now()), sessionId, 1)
    await store.addEvent(event)
    await store.sealBatch()
}

async function addActiveEvent(sessionId: string, event: SequencedInteractionEvent): Promise<void> {
    const store = await IndexedDbBatchUploadStore.open(new FixedClock(Date.now()), sessionId, 1)
    await store.addEvent(event)
}

async function expectNoPendingBatches(): Promise<void> {
    const store = await IndexedDbBatchUploadStore.open(new FixedClock(Date.now()), 'observer', 1)
    const batches = await store.claimNextBatches({
        ownerId: 'observer',
        leaseDurationMs: 1,
        maxBatchCount: 1,
    })
    expect(batches).to.be.empty
}

function createEvent(sequence: number, occurredAt: number): SequencedInteractionEvent {
    return {
        schemaVersion: 1,
        eventId: `event-${sequence}`,
        type: 'test',
        occurredAt,
        data: {},
        sequence,
    }
}

function acknowledgementResponse(payload: BatchPayload): Response {
    return new Response(JSON.stringify({ batchId: payload.batchId, acceptedEvents: payload.events.length }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
    })
}

async function withFetchStub(
    fetchStub: (url: string, init?: RequestInit) => Promise<Response>,
    action: () => Promise<void>
): Promise<void> {
    const fetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch')
    Object.defineProperty(globalThis, 'fetch', { configurable: true, value: fetchStub })

    try {
        await action()
    } finally {
        if (fetchDescriptor) {
            Object.defineProperty(globalThis, 'fetch', fetchDescriptor)
        } else {
            delete (globalThis as { fetch?: typeof fetch }).fetch
        }
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
