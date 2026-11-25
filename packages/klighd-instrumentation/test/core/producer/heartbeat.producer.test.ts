import { expect } from 'chai'
import { afterEach, beforeEach, describe, it } from 'mocha'

import type { Collector } from '../../../src/core/collector'
import type { InteractionEvent } from '../../../src/core/event'
import { HeartbeatProducer } from '../../../src/core/producer'
import { FixedClock } from '../../../src/core/time'

describe('HeartbeatProducer', () => {
    let intervalCallback: (() => void) | undefined
    let intervalHandle: ReturnType<typeof setInterval> | undefined
    let clearedInterval: ReturnType<typeof setInterval> | undefined
    let intervalWasUnreferenced = false
    let originalSetInterval: typeof globalThis.setInterval
    let originalClearInterval: typeof globalThis.clearInterval

    beforeEach(() => {
        intervalCallback = undefined
        intervalHandle = undefined
        clearedInterval = undefined
        intervalWasUnreferenced = false
        originalSetInterval = globalThis.setInterval
        originalClearInterval = globalThis.clearInterval

        globalThis.setInterval = ((callback: () => void) => {
            intervalCallback = callback
            intervalHandle = {
                unref: () => {
                    intervalWasUnreferenced = true
                },
            } as ReturnType<typeof setInterval>

            return intervalHandle
        }) as typeof globalThis.setInterval

        globalThis.clearInterval = ((handle: ReturnType<typeof setInterval>) => {
            clearedInterval = handle
        }) as typeof globalThis.clearInterval
    })

    afterEach(() => {
        globalThis.setInterval = originalSetInterval
        globalThis.clearInterval = originalClearInterval
    })

    it('collects a heartbeat immediately and when its interval elapses', () => {
        const clock = new FixedClock(100)
        const events: InteractionEvent[] = []
        const producer = new HeartbeatProducer(clock, recordingCollector(events), 1_000)

        expect(events).to.deep.equal([heartbeatAt(100)])
        expect(intervalWasUnreferenced).to.equal(true)

        clock.sleep(1_000)
        intervalCallback?.()

        expect(events).to.deep.equal([heartbeatAt(100), heartbeatAt(1_100)])
        producer.dispose()
    })

    it('stops its interval and does not collect further heartbeats after disposal', () => {
        const events: InteractionEvent[] = []
        const producer = new HeartbeatProducer(new FixedClock(100), recordingCollector(events), 1_000)

        producer.dispose()
        intervalCallback?.()

        expect(clearedInterval).to.equal(intervalHandle)
        expect(events).to.deep.equal([heartbeatAt(100)])
    })
})

function recordingCollector(events: InteractionEvent[]): Collector {
    return {
        collect(event): void {
            events.push(event)
        },
    }
}

function heartbeatAt(occurredAt: number): InteractionEvent {
    return {
        schemaVersion: 1,
        type: 'heartbeat',
        occurredAt,
        data: {},
    }
}
