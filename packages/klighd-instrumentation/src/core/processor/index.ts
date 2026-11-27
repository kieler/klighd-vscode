import type { SequencedInteractionEvent } from '../collector'

export interface Processor {
    process(event: SequencedInteractionEvent): void
}
