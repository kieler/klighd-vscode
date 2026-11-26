import { record } from '@rrweb/record'
import { eventWithTime } from '@rrweb/types'

/**
 * These options can be used by the integrating application to configure the instrumentation.
 */
export interface InstrumentationConfiguration {
    /**
     * Full API URL to the backend that is collecting the recorded events. It should contain the
     * protocol, hostname, port, and any static path prefix, but _not_ the API batch endpoint or similar.
     *
     * Example: "https://exeter.local:3000/some-path/"
     */
    apiBaseUrl: string

    /**
     * When set to `true`, all collected events are also logged to the browser console.
     */
    consoleLogEvents: boolean

    /**
     * Configuration controlling the batch upload feature
     */
    batchUpload: BatchUploadConfiguration

    /**
     * Allows changing rrweb recording options
     */
    rrweb: RrwebConfiguration

    /**
     * After how long a HTTP request is considered to have failed.
     */
    requestTimeoutMs: number

    /**
     * Identifier of the stimulus that owns the recorded interaction session.
     */
    stimulusId?: string

    /**
     * When used in conjunction with a survey tool this field can be used to link the "participant"
     * with that external ID for later merging of survey data. Note that this value must be globally
     * unique (i.e. there should not be two users with ID 1 across two surveys).
     */
    externalParticipantId: string | null

    /**
     * Identifier assigned by the embedding application to associate this recording
     * session with its external task or question.
     */
    externalSessionId: string | null

    /**
     * How often are the "aliveness" heartbeat events recorded.
     */
    heartbeatIntervalMs: number
}

export interface BatchUploadConfiguration {
    /**
     * Controls how many parallel uploads are attempted at any given time.
     */
    maxConcurrentUploads: number

    /**
     * Number of milliseconds between automatic flushes of the events to the backend.
     */
    flushIntervalMs: number

    /**
     * If a batch contains more than this number of events, it gets sealed.
     */
    maxEventsPerBatch: number

    /**
     * How long a given uploading process may lease a batch from storage for uploading.
     */
    leaseDurationMs: number

    /**
     * Controls the minimum amount of retry delay for failed uploads.
     */
    minimumRetryDelayMs: number

    /**
     * Controls the maximum amount of retry delay for failed uploads.
     */
    maximumRetryDelayMs: number
}

/**
 * All available rrweb configuration options, except for the `emit` callback, which we use internally.
 */
export type RrwebConfiguration = Omit<NonNullable<Parameters<typeof record<eventWithTime>>[0]>, 'emit'>

const DefaultInitialiseOptions: Omit<
    InstrumentationConfiguration,
    'apiBaseUrl' | 'stimulusId' | 'externalParticipantId' | 'externalSessionId'
> = {
    consoleLogEvents: false,
    requestTimeoutMs: 10_000,
    heartbeatIntervalMs: 5_000,
    batchUpload: {
        maxConcurrentUploads: 4,
        flushIntervalMs: 5_000,
        maxEventsPerBatch: 100,
        leaseDurationMs: 30_000,
        minimumRetryDelayMs: 5_000,
        maximumRetryDelayMs: 60_000,
    },
    rrweb: {},
}

/**
 * Only the collection API URL is required for initialisation.
 */
export type InitialiseOptions = Pick<InstrumentationConfiguration, 'apiBaseUrl'> &
    Partial<Omit<InstrumentationConfiguration, 'apiBaseUrl' | 'batchUpload'>> & {
        batchUpload?: Partial<BatchUploadConfiguration>
    }

export function resolveInstrumentationConfiguration(config: InitialiseOptions): InstrumentationConfiguration {
    const batchUploadDefaults = DefaultInitialiseOptions.batchUpload

    const resolvedConfig = {
        apiBaseUrl: removeTrailingSlashes(config.apiBaseUrl),
        consoleLogEvents: config.consoleLogEvents ?? DefaultInitialiseOptions.consoleLogEvents,
        requestTimeoutMs: config.requestTimeoutMs ?? DefaultInitialiseOptions.requestTimeoutMs,
        stimulusId: config.stimulusId?.trim() || undefined,
        externalParticipantId: config.externalParticipantId?.trim() ? config.externalParticipantId : null,
        externalSessionId: config.externalSessionId?.trim() ? config.externalSessionId : null,
        heartbeatIntervalMs: config.heartbeatIntervalMs ?? DefaultInitialiseOptions.heartbeatIntervalMs,
        batchUpload: {
            maxConcurrentUploads: config.batchUpload?.maxConcurrentUploads ?? batchUploadDefaults.maxConcurrentUploads,
            flushIntervalMs: config.batchUpload?.flushIntervalMs ?? batchUploadDefaults.flushIntervalMs,
            maxEventsPerBatch: config.batchUpload?.maxEventsPerBatch ?? batchUploadDefaults.maxEventsPerBatch,
            leaseDurationMs: config.batchUpload?.leaseDurationMs ?? batchUploadDefaults.leaseDurationMs,
            minimumRetryDelayMs: config.batchUpload?.minimumRetryDelayMs ?? batchUploadDefaults.minimumRetryDelayMs,
            maximumRetryDelayMs: config.batchUpload?.maximumRetryDelayMs ?? batchUploadDefaults.maximumRetryDelayMs,
        },
        rrweb: config.rrweb ?? DefaultInitialiseOptions.rrweb,
    } satisfies InstrumentationConfiguration

    if (!resolvedConfig.apiBaseUrl.trim()) {
        throw new Error('The instrumentation API URL must not be empty.')
    }

    assertIsPositiveInteger(resolvedConfig.requestTimeoutMs, 'requestTimeoutMs')
    assertIsPositiveInteger(resolvedConfig.heartbeatIntervalMs, 'heartbeatIntervalMs')
    assertIsPositiveInteger(resolvedConfig.batchUpload.maxConcurrentUploads, 'maxConcurrentUploads')
    assertIsPositiveInteger(resolvedConfig.batchUpload.flushIntervalMs, 'flushIntervalMs')
    assertIsPositiveInteger(resolvedConfig.batchUpload.maxEventsPerBatch, 'maxEventsPerBatch')
    assertIsPositiveInteger(resolvedConfig.batchUpload.leaseDurationMs, 'leaseDurationMs')
    assertIsPositiveInteger(resolvedConfig.batchUpload.minimumRetryDelayMs, 'minimumRetryDelayMs')
    assertIsPositiveInteger(resolvedConfig.batchUpload.maximumRetryDelayMs, 'maximumRetryDelayMs')

    return resolvedConfig
}

function assertIsPositiveInteger(num: number, name: string): void {
    if (!Number.isSafeInteger(num) || num < 1) {
        throw new Error(`Field "${name}" must be a positive integer.`)
    }
}

function removeTrailingSlashes(value: string): string {
    return value.replace(/\/+$/, '')
}
