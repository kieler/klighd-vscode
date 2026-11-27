import { ContainerModule } from 'inversify'

import { createSprottyModule } from './sprotty/sprotty-module'
import { SprottyProducer } from './sprotty/sprotty.producer'
import { ConsoleProcessor } from './core/processor/console.processor'
import { SequencingCollector } from './core/collector'
import { RrwebProducer } from './rrweb/rrweb.producer'
import { BatchUploadProcessor } from './core/processor/batch-upload'
import { Processor } from './core/processor'
import { InitialiseOptions, resolveInstrumentationConfiguration } from './core/config'
import { registerSession } from './core/registration'
import { RealClock } from './core/time'
import { FetchHttpClient } from './core/http'
import { HeartbeatProducer } from './core/producer'

export {
    startPendingBatchUploadLoop,
    type PendingBatchUploadLoopHandle,
    type PendingBatchUploadLoopOptions,
} from './pending-batch-upload-loop'

/**
 * Returned by the `initialise()` function to allow interacting with the instrumentation
 * after it was created / initialised.
 */
export interface InstrumentationHandle {
    /**
     * Reference to a Sprotty Container module that needs to be integrated with the Sprotty runtime to
     * correctly collect all (semantic) Sprotty actions / events.
     */
    module: ContainerModule

    /**
     * Allows disposing / permanently stopping the instrumentation.
     */
    dispose(): Promise<void>
}

/**
 * Initialises the instrumentation for immediate event collection and processing.
 */
export async function initialise(options: InitialiseOptions): Promise<InstrumentationHandle> {
    // Merge the passed configuration with the default configuration values
    const config = resolveInstrumentationConfiguration(options)

    // Set up instance of a clock
    const clock = new RealClock()
    const httpClient = new FetchHttpClient(config.requestTimeoutMs)

    // Register the current diagram session with the backend
    const { sessionId } = await registerSession(
        httpClient,
        config.apiBaseUrl,
        config.stimulusId,
        config.externalParticipantId,
        config.externalSessionId
    )

    // Set up the batch upload processor and its persistent event storage.
    const batchUploadProcessor = await BatchUploadProcessor.create(
        sessionId,
        config.apiBaseUrl,
        config.batchUpload,
        clock,
        httpClient
    )

    // If configured, also add a Console processor to print events to the browser console
    const processors: Processor[] = [batchUploadProcessor]
    if (config.consoleLogEvents) {
        processors.push(new ConsoleProcessor())
    }

    // Instantiate the collector that gets the events from the producers, numbers them, and sends them
    // of to the processors.
    const collector = new SequencingCollector(processors)

    // Instantiate the producers
    const heartbeatProducer = new HeartbeatProducer(clock, collector, config.heartbeatIntervalMs)
    const rrwebProducer = new RrwebProducer(clock, collector, config.rrweb)
    const sprottyProducer = new SprottyProducer(clock, collector)
    const producers = [heartbeatProducer, rrwebProducer, sprottyProducer]

    // Capture the disposal state of this instrumentation instance
    let disposed = false

    return {
        module: createSprottyModule(sprottyProducer),
        async dispose(): Promise<void> {
            if (disposed) {
                return
            }

            disposed = true
            producers.forEach((producer) => producer.dispose())
            await batchUploadProcessor.dispose()
        },
    }
}
