import { expect } from 'chai'
import { describe, it } from 'mocha'

import { InMemoryBatchUploadStore } from '../../../../../src/core/processor/batch-upload'
import { SequencedInteractionEvent } from '../../../../../src/core/collector'
import { FixedClock } from '../../../../../src/core/time'

describe('InMemoryBatchUploadStore', () => {
    it('counts active events and seals them in insertion order for its session', async () => {
        const clock = new FixedClock(10)
        const store = new InMemoryBatchUploadStore(clock, 'session-a')

        expect(await store.addEvent(createEvent(1))).to.deep.equal({ activeEventCount: 1 })
        expect(await store.addEvent(createEvent(2))).to.deep.equal({ activeEventCount: 2 })
        await store.sealBatch()

        const [batch] = await store.claimNextBatches({ ownerId: 'worker', leaseDurationMs: 10, maxBatchCount: 1 })
        expect(batch).to.include({ sessionId: 'session-a', attempts: 0, nextAttemptAt: 10 })
        expect(batch?.events.map((event) => event.eventId)).to.deep.equal(['event-1', 'event-2'])
    })

    it('returns no batches after sealing an empty active queue', async () => {
        const store = new InMemoryBatchUploadStore(new FixedClock(0), 'session-a')
        await store.sealBatch()

        expect(await store.claimNextBatches({ ownerId: 'worker', leaseDurationMs: 10, maxBatchCount: 1 })).to.be.empty
    })

    it('claims batches in creation order up to the requested limit', async () => {
        const clock = new FixedClock(10)
        const store = new InMemoryBatchUploadStore(clock, 'session-a')
        await addAndSeal(store, createEvent(1))
        clock.sleep(1)
        await addAndSeal(store, createEvent(2))
        clock.sleep(1)
        await addAndSeal(store, createEvent(3))

        const batches = await store.claimNextBatches({ ownerId: 'worker', leaseDurationMs: 10, maxBatchCount: 2 })
        expect(batches.map((batch) => batch.events[0]?.eventId)).to.deep.equal(['event-1', 'event-2'])
    })

    it('does not re-claim a batch until its lease expires', async () => {
        const clock = new FixedClock(10)
        const store = new InMemoryBatchUploadStore(clock, 'session-a')
        await addAndSeal(store, createEvent(1))
        clock.sleep(10)

        expect(await store.claimNextBatches({ ownerId: 'first', leaseDurationMs: 10, maxBatchCount: 1 })).to.have.lengthOf(1)
        clock.sleep(9)
        expect(await store.claimNextBatches({ ownerId: 'second', leaseDurationMs: 10, maxBatchCount: 1 })).to.be.empty
        clock.sleep(1)
        expect(await store.claimNextBatches({ ownerId: 'second', leaseDurationMs: 10, maxBatchCount: 1 })).to.have.lengthOf(1)
    })

    it('does not let an expired claim acknowledge a batch leased by another worker', async () => {
        const clock = new FixedClock(10)
        const store = new InMemoryBatchUploadStore(clock, 'session-a')
        await addAndSeal(store, createEvent(1))
        clock.sleep(10)

        const [firstClaim] = await store.claimNextBatches({ ownerId: 'first', leaseDurationMs: 10, maxBatchCount: 1 })
        if (!firstClaim) throw new Error('Expected a first claim.')

        clock.sleep(10)
        const [secondClaim] = await store.claimNextBatches({ ownerId: 'second', leaseDurationMs: 10, maxBatchCount: 1 })
        if (!secondClaim) throw new Error('Expected a second claim.')

        await store.acknowledgeBatch(firstClaim)
        await store.scheduleRetry(secondClaim, clock.now())

        expect(await store.claimNextBatches({ ownerId: 'third', leaseDurationMs: 10, maxBatchCount: 1 })).to.have.lengthOf(1)
    })

    it('retries only a claimed batch and releases its lease', async () => {
        const clock = new FixedClock(10)
        const store = new InMemoryBatchUploadStore(clock, 'session-a')
        await addAndSeal(store, createEvent(1))
        clock.sleep(10)
        const [batch] = await store.claimNextBatches({ ownerId: 'worker', leaseDurationMs: 10, maxBatchCount: 1 })
        if (!batch) throw new Error('Expected a claimed batch.')

        await store.scheduleRetry(batch, 100)
        clock.sleep(79)
        expect(await store.claimNextBatches({ ownerId: 'worker', leaseDurationMs: 10, maxBatchCount: 1 })).to.be.empty

        clock.sleep(1)
        const [retriedBatch] = await store.claimNextBatches({ ownerId: 'worker', leaseDurationMs: 10, maxBatchCount: 1 })
        expect(retriedBatch).to.include({ attempts: 1, nextAttemptAt: 100 })
    })

    it('does not modify an unclaimed or differently claimed batch', async () => {
        const clock = new FixedClock(10)
        const store = new InMemoryBatchUploadStore(clock, 'session-a')
        await addAndSeal(store, createEvent(1))
        clock.sleep(10)
        const [batch] = await store.claimNextBatches({ ownerId: 'worker', leaseDurationMs: 10, maxBatchCount: 1 })
        if (!batch) throw new Error('Expected a claimed batch.')

        await store.scheduleRetry({ ...batch, leaseId: 'wrong-lease' }, 100)
        await store.acknowledgeBatch({ ...batch, leaseId: null })

        clock.sleep(9)
        expect(await store.claimNextBatches({ ownerId: 'other', leaseDurationMs: 10, maxBatchCount: 1 })).to.be.empty
        clock.sleep(1)
        expect(await store.claimNextBatches({ ownerId: 'other', leaseDurationMs: 10, maxBatchCount: 1 })).to.have.lengthOf(1)
    })

    it('removes an acknowledged batch without affecting later batches', async () => {
        const clock = new FixedClock(10)
        const store = new InMemoryBatchUploadStore(clock, 'session-a')
        await addAndSeal(store, createEvent(1))
        clock.sleep(1)
        await addAndSeal(store, createEvent(2))
        clock.sleep(9)
        const [firstBatch] = await store.claimNextBatches({ ownerId: 'worker', leaseDurationMs: 10, maxBatchCount: 1 })
        if (!firstBatch) throw new Error('Expected a claimed batch.')

        await store.acknowledgeBatch(firstBatch)
        const [secondBatch] = await store.claimNextBatches({ ownerId: 'worker', leaseDurationMs: 10, maxBatchCount: 1 })
        expect(secondBatch?.events[0]?.eventId).to.equal('event-2')
    })

    it('starts a new active batch after sealing the previous one', async () => {
        const clock = new FixedClock(10)
        const store = new InMemoryBatchUploadStore(clock, 'session-a')

        await addAndSeal(store, createEvent(1))
        clock.sleep(1)
        expect(await store.addEvent(createEvent(2))).to.deep.equal({ activeEventCount: 1 })
        await store.sealBatch()

        const batches = await store.claimNextBatches({ ownerId: 'worker', leaseDurationMs: 10, maxBatchCount: 2 })
        expect(batches.map((batch) => batch.events.map((event) => event.eventId))).to.deep.equal([['event-1'], ['event-2']])
    })
})

async function addAndSeal(store: InMemoryBatchUploadStore, event: SequencedInteractionEvent): Promise<void> {
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
