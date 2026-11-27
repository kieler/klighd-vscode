import { Collector, SequencedInteractionEvent } from '.'
import { InteractionEvent } from '../event'
import { Processor } from '../processor'

export class SequencingCollector implements Collector {
    private nextSequence: number = 0

    constructor(private readonly processors: Processor[]) {}

    collect(event: InteractionEvent): void {
        // Amend the event by its sequence number
        const sequencedEvent: SequencedInteractionEvent = {
            ...event,
            eventId: crypto.randomUUID(),
            sequence: this.nextSequence,
        }

        // Increment sequence number
        this.nextSequence += 1

        // Call processors synchronously
        this.processors.forEach((processor) => processor.process(sequencedEvent))
    }
}
