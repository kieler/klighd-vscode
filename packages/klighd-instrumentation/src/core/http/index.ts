export interface HttpClient {
    postJson(url: string, data: object): Promise<Response>
}

export class FetchHttpClient implements HttpClient {
    constructor(private readonly timeoutMs: number) {}

    async postJson(url: string, data: object): Promise<Response> {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            return response
        } finally {
            clearTimeout(timeout)
        }
    }
}
