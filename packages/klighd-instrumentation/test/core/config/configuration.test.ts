import { expect } from 'chai'
import { describe, it } from 'mocha'

import { resolveInstrumentationConfiguration } from '../../../src/core/config'

describe('resolveInstrumentationConfiguration', () => {
    it('applies defaults and removes trailing slashes from the API base URL', () => {
        expect(
            resolveInstrumentationConfiguration({
                apiBaseUrl: 'https://collector.example/study///',
                stimulusId: 'stimulus-1',
            })
        ).to.deep.equal({
            apiBaseUrl: 'https://collector.example/study',
            consoleLogEvents: false,
            requestTimeoutMs: 10_000,
            stimulusId: 'stimulus-1',
            externalParticipantId: null,
            externalSessionId: null,
            heartbeatIntervalMs: 5_000,
            rrweb: {},
            batchUpload: {
                maxConcurrentUploads: 4,
                flushIntervalMs: 5_000,
                maxEventsPerBatch: 100,
                leaseDurationMs: 30_000,
                minimumRetryDelayMs: 5_000,
                maximumRetryDelayMs: 60_000,
            },
        })
    })

    it('uses explicitly supplied options, including false', () => {
        const configuration = resolveInstrumentationConfiguration({
            apiBaseUrl: 'https://collector.example',
            consoleLogEvents: false,
            requestTimeoutMs: 4,
            stimulusId: 'stimulus-1',
            externalParticipantId: 'external-id',
            externalSessionId: 'external-session-id',
            heartbeatIntervalMs: 8,
            batchUpload: {
                maxConcurrentUploads: 1,
                flushIntervalMs: 2,
                maxEventsPerBatch: 3,
                leaseDurationMs: 5,
                minimumRetryDelayMs: 6,
                maximumRetryDelayMs: 7,
            },
        })

        expect(configuration).to.deep.include({
            apiBaseUrl: 'https://collector.example',
            consoleLogEvents: false,
            requestTimeoutMs: 4,
            stimulusId: 'stimulus-1',
            externalParticipantId: 'external-id',
            externalSessionId: 'external-session-id',
            heartbeatIntervalMs: 8,
            batchUpload: {
                maxConcurrentUploads: 1,
                flushIntervalMs: 2,
                maxEventsPerBatch: 3,
                leaseDurationMs: 5,
                minimumRetryDelayMs: 6,
                maximumRetryDelayMs: 7,
            },
        })
    })

    for (const externalParticipantId of ['', '   ']) {
        it('correctly normalises missing external IDs to null', () => {
            const config = resolveInstrumentationConfiguration({
                apiBaseUrl: 'https://collector.example',
                stimulusId: 'stimulus-id',
                externalParticipantId,
            })

            expect(config.externalParticipantId).to.equal(null)
        })
    }

    for (const externalSessionId of ['', '   ']) {
        it('correctly normalises missing external session IDs to null', () => {
            const config = resolveInstrumentationConfiguration({
                apiBaseUrl: 'https://collector.example',
                stimulusId: 'stimulus-id',
                externalSessionId,
            })

            expect(config.externalSessionId).to.equal(null)
        })
    }

    for (const apiBaseUrl of ['', '   ', '/']) {
        it(`rejects an empty API base URL after normalisation: ${JSON.stringify(apiBaseUrl)}`, () => {
            expect(() => resolveInstrumentationConfiguration({ apiBaseUrl, stimulusId: 'stimulus-1' })).to.throw(
                'The instrumentation API URL must not be empty.'
            )
        })
    }

    for (const invalidValue of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
        it(`rejects an invalid batch-upload number: ${String(invalidValue)}`, () => {
            expect(() =>
                resolveInstrumentationConfiguration({
                    apiBaseUrl: 'https://collector.example',
                    stimulusId: 'stimulus-1',
                    requestTimeoutMs: 1,
                    batchUpload: {
                        maxConcurrentUploads: invalidValue,
                        flushIntervalMs: 1,
                        maxEventsPerBatch: 1,
                        leaseDurationMs: 1,
                        minimumRetryDelayMs: 1,
                        maximumRetryDelayMs: 1,
                    },
                })
            ).to.throw('Field "maxConcurrentUploads" must be a positive integer.')
        })
    }

    for (const invalidValue of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
        it(`rejects an invalid heartbeat interval: ${String(invalidValue)}`, () => {
            expect(() =>
                resolveInstrumentationConfiguration({
                    apiBaseUrl: 'https://collector.example',
                    stimulusId: 'stimulus-1',
                    heartbeatIntervalMs: invalidValue,
                })
            ).to.throw('Field "heartbeatIntervalMs" must be a positive integer.')
        })
    }
})
