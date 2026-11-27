export interface Producer {
    /** Permanently stops this producer and releases its resources. */
    dispose(): void
}

export { HeartbeatProducer } from './heartbeat.producer'
