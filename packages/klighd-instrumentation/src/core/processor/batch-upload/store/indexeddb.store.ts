import type { BatchUploadStore, PendingBatch } from '.'
import { SequencedInteractionEvent } from '../../../collector'
import { Clock } from '../../../time'

/* global IDBDatabase, IDBRequest, IDBTransaction, globalThis */

const DATABASE_NAME = 'klighd-instrumentation-batch-upload'
const DATABASE_VERSION = 1

/**
 * This store contains the active batch for each session ID. The mapping
 * is one-to-one: Each diagram interaction session has exactly one *active*
 * batch at any given time. We also store the last-updated time for these
 * active batches to allow for sealing abandoned batches. The layout of
 * the store is roughly:
 *
 * ```
 * [
 *   {
 *     "sessionId": "34902bcb-69f5-45cb-b582-190d6a3dff34",
 *     "lastUpdatedAt": "...",
 *     "batch": {
 *       "batchId": "eb3124eb-e6a2-4d88-a26a-a194f6db8b21",
 *       "createdAt": "...",
 *       "events": [ ... ]
 *     }
 *   },
 *   ...
 * ]
 * ```
 */
const STORE_ACTIVE_EVENTS = 'active-events'
const INDEX_ACTIVE_EVENTS_SESSION_ID = 'sessionIdIndex'

interface ActiveEventRow {
    sessionId: string
    eventId: string
    event: SequencedInteractionEvent
}

/**
 * This store contains an indexed list of batches that are pending to be uploaded
 * to the backend. For simplicity, the batches are indexed by their ID. The layout
 * is roughly:
 *
 * ```
 * [
 *   {
 *     "batchId": "eb3124eb-e6a2-4d88-a26a-a194f6db8b21",
 *     "sessionId": "ea54dbd6-e79e-4285-ba86-f09f53ff8816",
 *     "createdAt": "...",
 *     "events": [ ... ]
 *   },
 *   ...
 * ]
 * ```
 */
const STORE_PENDING_BATCHES = 'pending-batches'

export class IndexedDbBatchUploadStore implements BatchUploadStore {
    private constructor(
        private readonly clock: Clock,
        private readonly database: IDBDatabase,
        private readonly sessionId: string,
        private readonly abandonedBatchAfterMs: number
    ) {}

    static async open(
        clock: Clock,
        sessionId: string,
        abandonedBatchAfterMs: number,
        databaseName = DATABASE_NAME
    ): Promise<IndexedDbBatchUploadStore> {
        if (!globalThis.indexedDB) {
            throw new Error('IndexedDB is not available.')
        }

        const database = await openDatabase(databaseName)
        return new IndexedDbBatchUploadStore(clock, database, sessionId, abandonedBatchAfterMs)
    }

    close(): void {
        this.database.close()
    }

    async addEvent(event: SequencedInteractionEvent): Promise<{ activeEventCount: number }> {
        const transaction = this.database.transaction(STORE_ACTIVE_EVENTS, 'readwrite')
        const store = transaction.objectStore(STORE_ACTIVE_EVENTS)

        store.add({
            sessionId: this.sessionId,
            eventId: event.eventId,
            event,
        } satisfies ActiveEventRow)

        const sessionIdIndex = store.index(INDEX_ACTIVE_EVENTS_SESSION_ID)
        const activeEventCount = await requestToPromise(sessionIdIndex.count(this.sessionId))

        await transactionToPromise(transaction)

        return { activeEventCount }
    }

    async sealBatch(): Promise<void> {
        const transaction = this.database.transaction([STORE_ACTIVE_EVENTS, STORE_PENDING_BATCHES], 'readwrite')
        const activeEventsStore = transaction.objectStore(STORE_ACTIVE_EVENTS)
        const pendingBatchesStore = transaction.objectStore(STORE_PENDING_BATCHES)

        const now = this.clock.now()

        const activeEventRows = (await requestToPromise(activeEventsStore.getAll())) as ActiveEventRow[]

        Array.from(this.groupActiveEventRowsBySessionId(activeEventRows))
            .filter(([sessionId, rows]) => {
                // We always seal events for our own session
                if (sessionId === this.sessionId) {
                    return true
                }

                // We may also seal events from other, abandoned sessions
                const latestEventTimestamp = Math.max(...rows.map((r) => r.event.occurredAt))
                if (now >= latestEventTimestamp + this.abandonedBatchAfterMs) {
                    return true
                }

                return false
            })
            // We "seal" the batch by transforming it to a `PendingBatch`
            .map(
                ([sessionId, rows]): PendingBatch => ({
                    batchId: crypto.randomUUID(),
                    sessionId,
                    createdAt: now,
                    events: rows
                        .sort((first, second) => first.event.sequence - second.event.sequence)
                        .map((row) => row.event),
                    attempts: 0,
                    nextAttemptAt: now,
                    leaseId: null,
                    leaseExpiresAt: null,
                })
            )
            // We then update the database stores
            .forEach((pendingBatch) => {
                pendingBatchesStore.put(pendingBatch)
                pendingBatch.events.forEach((e) => activeEventsStore.delete(e.eventId))
            })

        await transactionToPromise(transaction)
    }

    async claimNextBatches(input: {
        ownerId: string
        leaseDurationMs: number
        maxBatchCount: number
    }): Promise<PendingBatch[]> {
        const now = this.clock.now()
        // Start a transaction and access the "Batch" store
        const transaction = this.database.transaction(STORE_PENDING_BATCHES, 'readwrite')
        const pendingBatchesStore = transaction.objectStore(STORE_PENDING_BATCHES)

        // Prepare a lease to use with the batches
        const leaseId = `${input.ownerId}:${crypto.randomUUID()}`

        // Fetch all batches from the DB
        const batches = ((await requestToPromise(pendingBatchesStore.getAll())) as PendingBatch[])
            // Sort them from oldest to newest
            .sort((a, b) => a.createdAt - b.createdAt)
            // Filter for batches eligible for a retry
            .filter((candidate) => candidate.nextAttemptAt <= now)
            // Filter for batches with either no lease or an expired lease
            .filter((candidate) => !candidate.leaseExpiresAt || candidate.leaseExpiresAt <= now)
            // Only take the first N such batches
            .slice(0, input.maxBatchCount)

        // Then take out a lease on these batches
        batches.forEach((batch) => {
            batch.leaseId = leaseId
            batch.leaseExpiresAt = now + input.leaseDurationMs
            pendingBatchesStore.put(batch)
        })

        // Commit the transaction
        await transactionToPromise(transaction)

        return batches
    }

    async acknowledgeBatch(batch: PendingBatch): Promise<void> {
        // Start a transaction and access the "Batch" store
        const transaction = this.database.transaction(STORE_PENDING_BATCHES, 'readwrite')
        const store = transaction.objectStore(STORE_PENDING_BATCHES)

        const currentBatch = (await requestToPromise(store.get(batch.batchId))) as PendingBatch | undefined
        if (!currentBatch) {
            await transactionToPromise(transaction)
            return
        }

        // We may only acknowledge receipt for a batch that we still hold a lease for
        if (!batch.leaseId || batch.leaseId !== currentBatch.leaseId) {
            await transactionToPromise(transaction)
            return
        }

        // Then delete the pending batch from the database
        store.delete(batch.batchId)
        await transactionToPromise(transaction)
    }

    async scheduleRetry(batch: PendingBatch, nextAttemptAt: number): Promise<void> {
        // Start a transaction and access the "Batch" store
        const transaction = this.database.transaction(STORE_PENDING_BATCHES, 'readwrite')
        const store = transaction.objectStore(STORE_PENDING_BATCHES)

        const currentBatch = (await requestToPromise(store.get(batch.batchId))) as PendingBatch | undefined
        if (!currentBatch) {
            await transactionToPromise(transaction)
            return
        }

        // We may only schedule a retry for a batch that we still hold a lease for
        if (!batch.leaseId || batch.leaseId !== currentBatch.leaseId) {
            await transactionToPromise(transaction)
            return
        }

        // Update retry-related parameters and reset lease
        currentBatch.attempts += 1
        currentBatch.nextAttemptAt = nextAttemptAt
        currentBatch.leaseId = null
        currentBatch.leaseExpiresAt = null

        // Update batch in database
        store.put(currentBatch)
        await transactionToPromise(transaction)
    }

    private groupActiveEventRowsBySessionId(rows: ActiveEventRow[]): Map<string, ActiveEventRow[]> {
        const ret = new Map<string, ActiveEventRow[]>()
        rows.forEach((row) => {
            let batch = ret.get(row.sessionId)
            if (!batch) {
                batch = []
                ret.set(row.sessionId, batch)
            }

            batch.push(row)
        })

        return ret
    }
}

/**
 * Open a connection to an IndexedDB database and initialise the object store for the batches.
 */
function openDatabase(databaseName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = globalThis.indexedDB.open(databaseName, DATABASE_VERSION)
        request.onupgradeneeded = () => {
            const database = request.result
            // Create the object store for the active events
            if (!database.objectStoreNames.contains(STORE_ACTIVE_EVENTS)) {
                const store = database.createObjectStore(STORE_ACTIVE_EVENTS, { keyPath: 'eventId' })
                store.createIndex(INDEX_ACTIVE_EVENTS_SESSION_ID, 'sessionId', { unique: false })
            }

            // Create the object store for the pending batches.
            if (!database.objectStoreNames.contains(STORE_PENDING_BATCHES)) {
                database.createObjectStore(STORE_PENDING_BATCHES, { keyPath: 'batchId' })
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'))
    })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'))
    })
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'))
        transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'))
    })
}
