import { record } from '@rrweb/record'
import { eventWithTime } from '@rrweb/types'

import { Producer } from '../core/producer'
import { Collector } from '../core/collector'
import { InteractionEvent } from '../core/event'
import { RrwebConfiguration } from '../core/config'
import { Clock } from '../core/time'

export interface RrwebEvent extends InteractionEvent {
    type: 'rrweb'
    data: { rrwebEvent: eventWithTime; rrwebIsCheckout: boolean | undefined }
}

/**
 * Producer that sends `rrweb` events up for collection. This allows a later visual
 * replay of the user interaction session.
 */
export class RrwebProducer implements Producer {
    private disposed = false

    /**
     * Function supplied by rrweb to permanently stop its recording listeners.
     */
    private readonly stopRecording: ReturnType<typeof record>

    constructor(
        private readonly clock: Clock,
        private readonly collector: Collector,
        private readonly config: RrwebConfiguration
    ) {
        this.stopRecording = record({
            ...this.config,
            emit: (rrwebEvent: eventWithTime, isCheckout?: boolean): void => {
                if (this.disposed) {
                    return
                }

                const event: RrwebEvent = {
                    schemaVersion: 1,
                    type: 'rrweb',
                    occurredAt: this.clock.now(),
                    data: {
                        rrwebEvent,
                        rrwebIsCheckout: isCheckout,
                    },
                }

                this.collector.collect(event)
            },
        })
    }

    dispose(): void {
        if (this.disposed) {
            return
        }

        this.disposed = true
        if (this.stopRecording) {
            this.stopRecording()
        }
    }
}
