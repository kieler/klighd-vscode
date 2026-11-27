import type { SequencedInteractionEvent } from '../../collector'
import { Processor } from '..'
import { BatchUploadStore, IndexedDbBatchUploadStore, InMemoryBatchUploadStore, PendingBatch } from './store'
import { BatchUploadConfiguration } from '../../config'
import { Clock } from '../../time'
import { HttpClient } from '../../http'

/**
 * This processor persists interaction events locally in a (robust) storage
 * and delivers them to the collection API in batches.
 *
 * An active batch is sealed when it reaches the configured event limit or when the periodic flush runs.
 * Sealed batches remain in the configured local store until the server acknowledges their receipt.
 */
export class BatchUploadProcessor implements Processor {
    /**
     * We are using a storage that can potentially be shared across multiple tabs / iframes / etc. per
     * browser session. Therefore, we need to identify individual sessions for doing leases etc.
     */
    private readonly ownerId = crypto.randomUUID()

    /**
     * We use this `operation` promise as a sort-of "chain" to ensure events and operations
     * are processed sequentially.
     */
    private operation = Promise.resolve()

    /**
     * We use this promise as a sort of "lock" to make sure we're only ever upload-processing once at a time.
     */
    private processing: Promise<void> | undefined

    /**
     * Keep track if we've been disposed.
     * Todo: maybe use AbortController for this in the future?
     */
    private disposed = false

    private readonly flushTimer: ReturnType<typeof setInterval>

    private constructor(
        private readonly clock: Clock,
        private readonly httpClient: HttpClient,
        private readonly store: BatchUploadStore,
        private readonly apiBaseUrl: string,
        private readonly config: BatchUploadConfiguration
    ) {
        // Create and start a flush timer for collected events.
        this.flushTimer = setInterval(() => {
            this.flushAndProcess().catch(() => undefined)
        }, this.config.flushIntervalMs)

        // If we're not in a browser contect (e.g. CLI / tests) make sure this
        // timer is not keeping the event loop running unnecessarily (a.k.a. mark it as "unimportant").
        if (typeof this.flushTimer === 'object' && 'unref' in this.flushTimer) {
            this.flushTimer.unref()
        }

        // Kick things off with an initial flush.
        this.flushAndProcess().catch(() => undefined)
    }

    /**
     * Static factory method to create an instace of a batch upload processor.
     */
    static async create(
        sessionId: string,
        apiBaseUrl: string,
        config: BatchUploadConfiguration,
        clock: Clock,
        httpClient: HttpClient
    ): Promise<BatchUploadProcessor> {
        // We start with an in-memory batch upload storage, which "always" works
        let store: BatchUploadStore = new InMemoryBatchUploadStore(clock, sessionId)

        try {
            // If we can, we want to create a store that uses IndexedDB for robustness
            store = await IndexedDbBatchUploadStore.open(clock, sessionId, config.flushIntervalMs * 2)
        } catch {
            // If that does not work, we simply keep using the in-memory implementation.
            // Todo: Use "Logger" service (yet to build) which logs problem to console.error() and potentially
            // a logging endpoint.
        }

        return new BatchUploadProcessor(clock, httpClient, store, apiBaseUrl, config)
    }

    /**
     * Processes a single event by enqueueing its storage to our Promise chain.
     */
    process(event: SequencedInteractionEvent): void {
        if (this.disposed) {
            return
        }

        this.queueOperation(async () => {
            // Store it in our robust storage
            const { activeEventCount } = await this.store.addEvent(event)

            // If we've stored more active events (i.e. events not yet sealed into a batch) than allowed
            // per batch, we seal one and kick off the processing of batches.
            if (activeEventCount >= this.config.maxEventsPerBatch) {
                await this.sealActiveBatch()
                this.processPendingBatches().catch(() => undefined)
            }
        })
    }

    /**
     * Stops accepting events, performs one final upload attempt, and releases the timer resources.
     */
    async dispose(): Promise<void> {
        if (this.disposed) {
            return
        }

        this.disposed = true
        clearInterval(this.flushTimer)

        await this.queueOperation(async () => {
            await this.sealActiveBatch()
        })

        await this.processPendingBatches()
    }

    /**
     * This function gets called on a regular schedule, as determined by the `flushIntervalMs` config option.
     */
    private flushAndProcess(): Promise<void> {
        if (this.disposed) {
            return Promise.resolve()
        }

        return this.queueOperation(async () => {
            await this.sealActiveBatch()
            await this.processPendingBatches()
        })
    }

    private async sealActiveBatch(): Promise<void> {
        // Attempt to seal the current batch
        await this.store.sealBatch()

        this.processPendingBatches().catch(() => undefined)
    }

    private async processPendingBatches(): Promise<void> {
        // We want to make sure that this never executes more than once at any given time,
        // so we lock the processing by keeping a reference to the processing promise.
        if (this.processing) {
            return this.processing
        }

        // Immediately execute this async processing of batches
        this.processing = this.runPendingBatches().finally(() => {
            this.processing = undefined
        })

        return this.processing
    }

    /**
     * Repeatedly claims and uploads `this.maxConcurrentUploads` batches until
     * no available batches remain.
     */
    private async runPendingBatches(): Promise<void> {
        let batches: PendingBatch[]
        do {
            // eslint-disable-next-line no-await-in-loop
            batches = await this.store.claimNextBatches({
                ownerId: this.ownerId,
                leaseDurationMs: this.config.leaseDurationMs,
                maxBatchCount: this.config.maxConcurrentUploads,
            })

            // eslint-disable-next-line no-await-in-loop
            await Promise.all(batches.map((batch) => this.uploadPendingBatch(batch)))
        } while (batches.length > 0)
    }

    private async uploadPendingBatch(batch: PendingBatch): Promise<void> {
        try {
            // Upload the batch as JSON to the backend service
            const response = await this.httpClient.postJson(`${this.apiBaseUrl}/api/batch`, {
                batchId: batch.batchId,
                sessionId: batch.sessionId,
                createdAt: batch.createdAt,
                events: batch.events,
            })

            if (!response.ok) {
                if (response.status === 410) {
                    await this.store.acknowledgeBatch(batch)
                }
                throw new Error('Batch upload could not be uploaded.')
            }

            const responseData: unknown = await response.json()

            if (!this.acknowledgementMatches(responseData, batch)) {
                // Todo: add logging and pass oninformation from `responseData`
                throw new Error('Batch upload was not acknowledged.')
            }

            await this.store.acknowledgeBatch(batch)
        } catch {
            const attempts = batch.attempts + 1
            await this.store.scheduleRetry(batch, this.clock.now() + this.retryDelayMs(attempts))
        }
    }

    private queueOperation(operation: () => Promise<void>): Promise<void> {
        const queuedOperation = this.operation.then(operation)

        this.operation = queuedOperation.catch(() => undefined)

        return queuedOperation.catch(() => undefined)
    }

    private retryDelayMs(attempts: number): number {
        const delay = Math.min(this.config.minimumRetryDelayMs * 2 ** (attempts - 1), this.config.maximumRetryDelayMs)

        return Math.round(delay * (0.75 + Math.random() * 0.5))
    }

    private acknowledgementMatches(responseData: unknown, batch: PendingBatch): boolean {
        try {
            if (!responseData || typeof responseData !== 'object') {
                return false
            }

            const { batchId, acceptedEvents } = responseData as Record<string, unknown>

            return batchId === batch.batchId && acceptedEvents === batch.events.length
        } catch {
            return false
        }
    }
}
