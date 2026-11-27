import { expect } from 'chai'
import { describe, it } from 'mocha'

import { ConsoleProcessor } from '../../../src/core/processor/console.processor'

describe('ConsoleProcessor', () => {
    it('writes the complete sequenced event to the console', () => {
        const originalLog = console.log
        const loggedValues: unknown[] = []
        console.log = (...values: unknown[]): void => {
            loggedValues.push(...values)
        }

        try {
            const event = {
                schemaVersion: 1 as const,
                eventId: 'event-4',
                type: 'test',
                occurredAt: 123,
                data: {},
                sequence: 4,
            }
            new ConsoleProcessor().process(event)

            expect(loggedValues).to.deep.equal([event])
        } finally {
            console.log = originalLog
        }
    })
})
