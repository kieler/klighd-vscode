import { Processor } from '.'
import type { SequencedInteractionEvent } from '../collector'

/**
 * Very simple processor that just outputs all events into the browser console.
 * Should only be used during development / debugging.
 */
export class ConsoleProcessor implements Processor {
    process(event: SequencedInteractionEvent): void {
        // eslint-disable-next-line no-console
        console.log(event)
    }
}
