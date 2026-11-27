import { Producer } from '.'
import { Collector } from '../collector'
import { InteractionEvent } from '../event'
import { Clock } from '../time'

export interface HeartbeatEvent extends InteractionEvent {
    type: 'heartbeat'
}

export class HeartbeatProducer implements Producer {
    private disposed = false

    private intervalHandler: ReturnType<typeof setInterval> | null = null

    constructor(
        private readonly clock: Clock,
        private readonly collector: Collector,
        private readonly heartbeatIntervalMs: number
    ) {
        this.intervalHandler = setInterval(() => {
            this.tick()
        }, this.heartbeatIntervalMs)
        this.tick()

        // If we're not in a browser context (e.g. CLI / tests) make sure this
        if (typeof this.intervalHandler === 'object' && 'unref' in this.intervalHandler) {
            this.intervalHandler.unref()
        }
    }

    tick(): void {
        if (this.disposed) {
            return
        }

        this.collector.collect({
            schemaVersion: 1,
            type: 'heartbeat',
            occurredAt: this.clock.now(),
            data: {},
        } satisfies HeartbeatEvent)
    }

    dispose(): void {
        if (this.disposed) {
            return
        }

        this.disposed = true
        if (this.intervalHandler) {
            clearInterval(this.intervalHandler)
            this.intervalHandler = null
        }
    }
}
