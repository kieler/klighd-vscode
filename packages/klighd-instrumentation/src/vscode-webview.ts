/* global window */
/* global document */
import type { Container } from 'inversify'
import { startRecording } from './index'
import type { InitialiseOptions } from './core/config'
import { RealClock } from './core/time'
import { createSprottyModule } from './sprotty/sprotty-module'
import { SprottyProducer } from './sprotty/sprotty.producer'
import { createCaptureControls } from './vscode-capture-controls'

type RequestKind = 'settings' | 'register' | 'batch'

function createHostRequest(api: { postMessage(message: unknown): void }) {
    let nextId = 0
    return function request<T>(kind: RequestKind, data?: object, timeoutMs = 15_000): Promise<T> {
        const id = ++nextId
        return new Promise((resolve, reject) => {
            function cleanup(): void {
                window.clearTimeout(timeout)
                window.removeEventListener('message', receive)
            }

            function receive(event: MessageEvent): void {
                const reply = event.data
                if (reply?.type !== 'klighdInstrumentation.reply' || reply.id !== id) {
                    return
                }
                cleanup()
                if (reply.error) {
                    reject(new Error(reply.error))
                } else {
                    resolve(reply.result)
                }
            }

            const timeout = window.setTimeout(() => {
                cleanup()
                reject(new Error('The instrumentation request timed out.'))
            }, timeoutMs)
            window.addEventListener('message', receive)
            api.postMessage({ type: 'klighdInstrumentation.request', id, kind, data })
        })
    }
}

/** Installs recording controls and returns a callback for diagram changes. */
export function attachCapture(container: Container, api: { postMessage(message: unknown): void }): () => void {
    const producer = new SprottyProducer(new RealClock())
    container.load(createSprottyModule(producer))
    const request = createHostRequest(api)

    const controls = createCaptureControls(
        document,
        () => {
            start()
        },
        () => {
            stop()
        }
    )

    let starting: AbortController | undefined
    let recording: Awaited<ReturnType<typeof startRecording>> | undefined

    async function stop(): Promise<void> {
        starting?.abort()
        if (recording) {
            const current = recording
            recording = undefined
            controls.setState('pending', 'Stopping capture…')
            try {
                await current.dispose()
                controls.setState('idle', 'Capture idle')
            } catch {
                controls.setState('error', 'Could not finish the capture upload.')
            }
        }
    }

    async function start(): Promise<void> {
        const controller = new AbortController()
        starting = controller
        controls.setState('pending', 'Starting capture…')
        try {
            const settings = await request<InitialiseOptions & { requestTimeoutMs: number }>('settings')
            controller.signal.throwIfAborted()
            const current = await startRecording(
                { ...settings, rrweb: { blockSelector: '.klighd-capture-controls', maskAllInputs: true } },
                producer,
                {
                    databaseName: `klighd-vscode-capture:${settings.apiBaseUrl}`,
                    signal: controller.signal,
                    httpClient: {
                        async postJson(url, data) {
                            const kind = url.endsWith('/api/register') ? 'register' : 'batch'
                            const response = await request<{ status: number; body: string }>(
                                kind,
                                data,
                                settings.requestTimeoutMs + 5_000
                            )
                            return new Response(response.body || null, { status: response.status })
                        },
                    },
                }
            )
            if (controller.signal.aborted) {
                await current.dispose()
                return
            }
            recording = current
            controls.setState('recording', 'Recording')
        } catch (error) {
            if (!controller.signal.aborted) {
                controls.setState('error', error instanceof Error ? error.message : 'Could not start capture.')
            }
        } finally {
            if (controller.signal.aborted) {
                controls.setState('idle', 'Capture idle')
            }
            starting = undefined
        }
    }

    window.addEventListener(
        'pagehide',
        () => {
            stop()
        },
        { once: true }
    )
    return () => {
        stop()
    }
}
