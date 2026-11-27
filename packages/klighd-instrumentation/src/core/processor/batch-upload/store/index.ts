import type { SequencedInteractionEvent } from '../../../collector'

/**
 * Represents a batch of unique events
 */
export interface EventBatch {
    batchId: string
    createdAt: number
    events: SequencedInteractionEvent[]
}

/**
 * Represents an EventBatch that is pending uploading
 */
export interface PendingBatch extends EventBatch {
    sessionId: string
    attempts: number
    nextAttemptAt: number
    leaseId: string | null
    leaseExpiresAt: number | null
}

/**
 * Persists queued interaction events and their immutable upload batches.
 *
 * Implementations must make sealing, claiming, acknowledgement, and retry updates atomic so that a batch is
 * never lost or processed concurrently by multiple upload workers (e.g. different tabs / iframes).
 */
export interface BatchUploadStore {
    /**
     * Adds an event to the active batch and returns the number of active events after the write completes.
     */
    addEvent(event: SequencedInteractionEvent): Promise<{ activeEventCount: number }>

    /**
     * Seals the currently active batch, thus marking it to be uploaded. This function should also seal
     * any existing batches from other sessions that have been inactive for too long.
     */
    sealBatch(): Promise<void>

    /**
     * Atomically leases the oldest `maxBatchCount` batches that are eligible for upload.
     *
     * Expired leases are eligible again, allowing another worker to recover batches left behind by a crashed one.
     */
    claimNextBatches(input: {
        ownerId: string
        leaseDurationMs: number
        maxBatchCount: number
    }): Promise<PendingBatch[]>

    /**
     * Deletes a batch only when the supplied claim still owns its lease after the server acknowledged receipt.
     */
    acknowledgeBatch(batch: PendingBatch): Promise<void>

    /**
     * Retains a claimed batch after an unsuccessful upload, records its next retry time, and releases its lease.
     */
    scheduleRetry(batch: PendingBatch, nextAttemptAt: number): Promise<void>

    /** Releases the store connection when it owns persistent storage. */
    close?(): void
}

export { InMemoryBatchUploadStore } from './in-memory.store'
export { IndexedDbBatchUploadStore } from './indexeddb.store'
