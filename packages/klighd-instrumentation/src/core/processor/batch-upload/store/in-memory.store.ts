import type { BatchUploadStore, PendingBatch } from '.'
import { SequencedInteractionEvent } from '../../../collector'
import { Clock } from '../../../time'

/**
 * Non-durable store for environments without IndexedDB.
 *
 * It follows the durable store's batching, lease, and retry contract, but its
 * data is lost when this JavaScript environment is destroyed.
 */
export class InMemoryBatchUploadStore implements BatchUploadStore {
    /**
     * Events for this store's session that have not been sealed yet.
     */
    private readonly activeEvents: SequencedInteractionEvent[] = []

    /**
     * Sealed batches, retained until the server acknowledges their upload.
     */
    private readonly pendingBatches = new Map<string, PendingBatch>()

    constructor(
        private readonly clock: Clock,
        private readonly sessionId: string
    ) {}

    async addEvent(event: SequencedInteractionEvent): Promise<{ activeEventCount: number }> {
        this.activeEvents.push(event)
        return { activeEventCount: this.activeEvents.length }
    }

    async sealBatch(): Promise<void> {
        if (this.activeEvents.length === 0) {
            return
        }

        const now = this.clock.now()

        const batch: PendingBatch = {
            batchId: crypto.randomUUID(),
            sessionId: this.sessionId,
            createdAt: now,
            events: this.activeEvents.splice(0),
            attempts: 0,
            nextAttemptAt: now,
            leaseId: null,
            leaseExpiresAt: null,
        }

        this.pendingBatches.set(batch.batchId, batch)
    }

    async claimNextBatches(input: {
        ownerId: string
        leaseDurationMs: number
        maxBatchCount: number
    }): Promise<PendingBatch[]> {
        const now = this.clock.now()
        const eligibleBatches = [...this.pendingBatches.values()]
            .sort((first, second) => first.createdAt - second.createdAt)
            .filter((batch) => batch.nextAttemptAt <= now)
            .filter((batch) => !batch.leaseExpiresAt || batch.leaseExpiresAt <= now)
            .slice(0, input.maxBatchCount)

        const leaseId = `${input.ownerId}:${crypto.randomUUID()}`
        for (const batch of eligibleBatches) {
            batch.leaseId = leaseId
            batch.leaseExpiresAt = now + input.leaseDurationMs
        }

        // Return snapshots: a later lease update must not alter the claim held
        // by an in-flight upload from an earlier worker.
        return eligibleBatches.map((batch) => ({ ...batch, events: [...batch.events] }))
    }

    async acknowledgeBatch(batch: PendingBatch): Promise<void> {
        const currentBatch = this.pendingBatches.get(batch.batchId)
        if (!batch.leaseId || batch.leaseId !== currentBatch?.leaseId) {
            return
        }
        this.pendingBatches.delete(batch.batchId)
    }

    async scheduleRetry(batch: PendingBatch, nextAttemptAt: number): Promise<void> {
        const currentBatch = this.pendingBatches.get(batch.batchId)
        if (!batch.leaseId || batch.leaseId !== currentBatch?.leaseId) {
            return
        }

        currentBatch.attempts += 1
        currentBatch.nextAttemptAt = nextAttemptAt
        currentBatch.leaseId = null
        currentBatch.leaseExpiresAt = null
    }
}
