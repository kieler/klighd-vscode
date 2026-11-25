export interface InteractionEvent {
    /**
     * Schema identifier for the event.
     */
    schemaVersion: 1

    /**
     * Source / categorical type of the event
     */
    type: string

    /**
     * Browser-side timestamp, in milliseconds since the Unix epoch.
     */
    occurredAt: number

    /**
     * Event Payload
     */
    data: Record<string, any>
}
