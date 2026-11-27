import { expect } from 'chai'
import { describe, it } from 'mocha'

import { HttpClient } from '../../../src/core/http'
import { registerSession } from '../../../src/core/registration'

describe('registerSession', () => {
    it('registers the stimulus identifier and returns the server-issued session ID', async () => {
        const requests: Array<{ url: string; data: object }> = []
        const httpClient: HttpClient = {
            async postJson(url, data): Promise<Response> {
                requests.push({ url, data })
                return new Response(JSON.stringify({ sessionId: 'session-1' }), { status: 201 })
            },
        }

        const registration = await registerSession(httpClient, 'https://collector.example', 'stimulus-1', null, null)

        expect(registration).to.deep.equal({ sessionId: 'session-1' })
        expect(requests).to.deep.equal([
            {
                url: 'https://collector.example/api/register',
                data: { stimulusId: 'stimulus-1', externalParticipantId: null, externalSessionId: null },
            },
        ])
    })

    it('rejects when registration is not accepted by the server', async () => {
        const httpClient: HttpClient = {
            async postJson(): Promise<Response> {
                return new Response(null, { status: 503 })
            },
        }

        try {
            await registerSession(httpClient, 'https://collector.example', 'stimulus-1', null, null)
            expect.fail('Expected registration to fail.')
        } catch (error) {
            expect(error).to.be.an.instanceOf(Error)
            expect((error as Error).message).to.equal('Could not register with server.')
        }
    })

    it('supports passing an external participant ID', async () => {
        const requests: Array<{ url: string; data: object }> = []
        const httpClient: HttpClient = {
            async postJson(url, data): Promise<Response> {
                requests.push({ url, data })
                return new Response(JSON.stringify({ sessionId: 'session-1' }), { status: 201 })
            },
        }

        const registration = await registerSession(
            httpClient,
            'https://collector.example',
            'stimulus-1',
            'external-id',
            'external-session-id'
        )

        expect(registration).to.deep.equal({ sessionId: 'session-1' })
        expect(requests).to.deep.equal([
            {
                url: 'https://collector.example/api/register',
                data: {
                    stimulusId: 'stimulus-1',
                    externalParticipantId: 'external-id',
                    externalSessionId: 'external-session-id',
                },
            },
        ])
    })
})
