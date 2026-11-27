/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-undef */

import { expect } from 'chai'
import { describe, it } from 'mocha'
import { IDBFactory } from 'fake-indexeddb'

import { IndexedDbBatchUploadStore } from '../../../../../src/core/processor/batch-upload'
import { SequencedInteractionEvent } from '../../../../../src/core/collector'
import { FixedClock } from '../../../../../src/core/time'

const abandonedBatchAfterMs = 100

describe('IndexedDbBatchUploadStore', () => {
    it('keeps active batches isolated by session and preserves event insertion order', async () => {
        globalThis.indexedDB = new IDBFactory()
        const clock = new FixedClock(10)
        const firstStore = await IndexedDbBatchUploadStore.open(clock, 'session-a', abandonedBatchAfterMs)
        const secondStore = await IndexedDbBatchUploadStore.open(clock, 'session-b', abandonedBatchAfterMs)

        await firstStore.addEvent(createEvent(1))
        await firstStore.addEvent(createEvent(2))
        await firstStore.sealBatch()
        clock.sleep(1)
        await secondStore.addEvent(createEvent(3))
        await secondStore.sealBatch()
        clock.sleep(9)

        const batches = await firstStore.claimNextBatches({ ownerId: 'worker', leaseDurationMs: 10, maxBatchCount: 2 })
        expect(batches.map((batch) => batch.sessionId)).to.deep.equal(['session-a', 'session-b'])
        expect(batches[0]?.events.map((event) => event.eventId)).to.deep.equal(['event-1', 'event-2'])
    })

    it('seals an abandoned active batch under its original session', async () => {
        globalThis.indexedDB = new IDBFactory()
        const clock = new FixedClock(10)
        const abandonedStore = await IndexedDbBatchUploadStore.open(clock, 'old-session', abandonedBatchAfterMs)
        await abandonedStore.addEvent(createEvent(1))

        const currentStore = await IndexedDbBatchUploadStore.open(clock, 'current-session', abandonedBatchAfterMs)
        clock.sleep(200)
        await currentStore.sealBatch()

        const [batch] = await currentStore.claimNextBatches({
            ownerId: 'worker',
            leaseDurationMs: 10,
            maxBatchCount: 1,
        })
        expect(batch).to.include({ sessionId: 'old-session', createdAt: 210 })
        expect(batch?.events.map((event) => event.eventId)).to.deep.equal(['event-1'])
    })

    it('persists sealed batches across store instances', async () => {
        globalThis.indexedDB = new IDBFactory()
        const clock = new FixedClock(10)
        const firstStore = await IndexedDbBatchUploadStore.open(clock, 'session-a', abandonedBatchAfterMs)
        await firstStore.addEvent(createEvent(1))
        await firstStore.sealBatch()

        const reopenedStore = await IndexedDbBatchUploadStore.open(clock, 'session-b', abandonedBatchAfterMs)
        clock.sleep(10)
        const [batch] = await reopenedStore.claimNextBatches({
            ownerId: 'worker',
            leaseDurationMs: 10,
            maxBatchCount: 1,
        })
        expect(batch?.events.map((event) => event.eventId)).to.deep.equal(['event-1'])
    })

    it('enforces retry eligibility and lease ownership across store instances', async () => {
        globalThis.indexedDB = new IDBFactory()
        const clock = new FixedClock(10)
        const firstStore = await IndexedDbBatchUploadStore.open(clock, 'session-a', abandonedBatchAfterMs)
        await firstStore.addEvent(createEvent(1))
        await firstStore.sealBatch()
        clock.sleep(10)
        const [batch] = await firstStore.claimNextBatches({ ownerId: 'first', leaseDurationMs: 10, maxBatchCount: 1 })
        if (!batch) throw new Error('Expected a claimed batch.')

        const secondStore = await IndexedDbBatchUploadStore.open(clock, 'session-b', abandonedBatchAfterMs)
        clock.sleep(9)
        expect(await secondStore.claimNextBatches({ ownerId: 'second', leaseDurationMs: 10, maxBatchCount: 1 })).to.be
            .empty
        await secondStore.scheduleRetry(batch, 100)
        clock.sleep(70)
        expect(await secondStore.claimNextBatches({ ownerId: 'second', leaseDurationMs: 10, maxBatchCount: 1 })).to.be
            .empty
        clock.sleep(1)
        expect(
            (await secondStore.claimNextBatches({ ownerId: 'second', leaseDurationMs: 10, maxBatchCount: 1 }))[0]
        ).to.include({
            attempts: 1,
            nextAttemptAt: 100,
        })
    })

    it('does not acknowledge an unclaimed or differently claimed batch', async () => {
        globalThis.indexedDB = new IDBFactory()
        const clock = new FixedClock(10)
        const store = await IndexedDbBatchUploadStore.open(clock, 'session-a', abandonedBatchAfterMs)
        await store.addEvent(createEvent(1))
        await store.sealBatch()
        clock.sleep(10)
        const [batch] = await store.claimNextBatches({ ownerId: 'worker', leaseDurationMs: 10, maxBatchCount: 1 })
        if (!batch) throw new Error('Expected a claimed batch.')

        await store.acknowledgeBatch({ ...batch, leaseId: null })
        await store.scheduleRetry({ ...batch, leaseId: 'wrong-lease' }, 100)

        clock.sleep(9)
        expect(await store.claimNextBatches({ ownerId: 'other', leaseDurationMs: 10, maxBatchCount: 1 })).to.be.empty
        clock.sleep(1)
        expect(
            await store.claimNextBatches({ ownerId: 'other', leaseDurationMs: 10, maxBatchCount: 1 })
        ).to.have.lengthOf(1)
    })
})

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
