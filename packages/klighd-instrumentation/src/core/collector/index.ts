import type { InteractionEvent } from '../event'

export interface Collector {
    collect<T extends InteractionEvent>(event: T): void
}

/**
 * Extends the "raw" interaction event and amends it with a monotonically increasing
 * event number.
 */
export interface SequencedInteractionEvent extends InteractionEvent {
    /**
     * Monotonically increasing browser-side event order.
     */
    sequence: number

    /**
     * Globally unique ID for the event
     */
    eventId: string
}

export { SequencingCollector } from './sequencing.collector'
