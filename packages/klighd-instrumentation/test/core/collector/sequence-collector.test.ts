import { expect } from 'chai'
import { describe, it } from 'mocha'

import { SequencingCollector } from '../../../src/core/collector'
import type { SequencedInteractionEvent } from '../../../src/core/collector'
import type { Processor } from '../../../src/core/processor'

describe('SequencingCollector', () => {
    it('preserves producer timestamps and assigns consecutive sequence numbers', () => {
        const events: SequencedInteractionEvent[] = []
        const processor: Processor = { process: (event) => events.push(event) }
        const collector = new SequencingCollector([processor])

        collector.collect({ schemaVersion: 1, type: 'first', occurredAt: 100, data: { source: 'first' } })
        collector.collect({ schemaVersion: 1, type: 'second', occurredAt: 200, data: { source: 'second' } })

        expect(events).to.have.lengthOf(2)
        expect(events[0]).to.deep.include({
            schemaVersion: 1,
            type: 'first',
            occurredAt: 100,
            data: { source: 'first' },
            sequence: 0,
        })
        expect(events[1]).to.deep.include({
            schemaVersion: 1,
            type: 'second',
            occurredAt: 200,
            data: { source: 'second' },
            sequence: 1,
        })
        expect(events[0]?.eventId).to.be.a('string').and.not.empty
        expect(events[1]?.eventId).to.be.a('string').and.not.empty
        expect(events[0]?.eventId).not.to.equal(events[1]?.eventId)
    })

    it('sends the same sequenced event to every processor synchronously', () => {
        const firstProcessorEvents: SequencedInteractionEvent[] = []
        const secondProcessorEvents: SequencedInteractionEvent[] = []
        const collector = new SequencingCollector([
            { process: (event) => firstProcessorEvents.push(event) },
            { process: (event) => secondProcessorEvents.push(event) },
        ])

        collector.collect({ schemaVersion: 1, type: 'event', occurredAt: 100, data: {} })

        expect(firstProcessorEvents).to.have.lengthOf(1)
        expect(secondProcessorEvents).to.have.lengthOf(1)
        expect(firstProcessorEvents[0]).to.equal(secondProcessorEvents[0])
        expect(firstProcessorEvents[0]).to.deep.include({ sequence: 0, occurredAt: 100, data: {} })
    })
})
