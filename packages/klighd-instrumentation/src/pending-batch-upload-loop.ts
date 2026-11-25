import { resolveInstrumentationConfiguration, type BatchUploadConfiguration } from './core/config'
import { FetchHttpClient } from './core/http'
import { BatchUploadProcessor } from './core/processor/batch-upload'
import { RealClock } from './core/time'

/**
 * Configuration for an upload worker that drains batches persisted by prior
 * instrumentation sessions without registering or recording a new session.
 */
export interface PendingBatchUploadLoopOptions {
    /** Base URL of the Exeter collection API. */
    apiBaseUrl: string

    /** Timeout applied to batch-upload requests. */
    requestTimeoutMs?: number

    /** Controls batching, retries, and the upload-loop interval. */
    batchUpload?: Partial<BatchUploadConfiguration>
}

/** Controls the lifecycle of a pending-batch upload worker. */
export interface PendingBatchUploadLoopHandle {
    /** Stops the loop after one final attempt to drain eligible persisted batches. */
    dispose(): Promise<void>
}

/**
 * Starts a background worker that drains eligible batches from this origin's
 * IndexedDB queue. Batches keep their original session IDs, so this function
 * neither registers nor records an interaction session itself.
 */
export async function startPendingBatchUploadLoop(
    options: PendingBatchUploadLoopOptions
): Promise<PendingBatchUploadLoopHandle> {
    // Reuse the existing configuration defaults and validation. The synthetic
    // ID is only used to construct a store instance; this worker never writes
    // events under it, and uploads retain each batch's stored session ID.
    const config = resolveInstrumentationConfiguration({
        apiBaseUrl: options.apiBaseUrl,
        stimulusId: '__pending_batch_upload_loop__',
        requestTimeoutMs: options.requestTimeoutMs,
        batchUpload: options.batchUpload,
    })

    const processor = await BatchUploadProcessor.create(
        crypto.randomUUID(),
        config.apiBaseUrl,
        config.batchUpload,
        new RealClock(),
        new FetchHttpClient(config.requestTimeoutMs)
    )

    return {
        dispose: () => processor.dispose(),
    }
}
