import { HttpClient } from '../http'

export async function registerSession(
    httpClient: HttpClient,
    apiBaseUrl: string,
    stimulusId: string,
    externalParticipantId: string | null,
    externalSessionId: string | null
): Promise<{ sessionId: string }> {
    const response = await httpClient.postJson(`${apiBaseUrl}/api/register`, {
        stimulusId,
        externalParticipantId,
        externalSessionId,
    })

    if (!response.ok) {
        // Todo: add logging and pass oninformation from `responseData`
        throw new Error('Could not register with server.')
    }

    const responseData = (await response.json()) as { sessionId: string }

    return { sessionId: responseData.sessionId }
}
