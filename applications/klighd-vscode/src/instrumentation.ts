import { randomUUID } from 'node:crypto'
import * as vscode from 'vscode'

const installationIdKey = 'instrumentation.installationId'
let pendingInstallationId: Promise<string> | undefined

async function getInstallationId(storage: vscode.Memento): Promise<string> {
    if (pendingInstallationId) {
        return pendingInstallationId
    }

    const stored = storage.get<string>(installationIdKey)
    if (stored) {
        return stored
    }

    const id = randomUUID()
    pendingInstallationId = Promise.resolve(storage.update(installationIdKey, id))
        .then(() => id)
        .finally(() => {
            pendingInstallationId = undefined
        })
    return pendingInstallationId
}

function isCollectionUrl(value: string): boolean {
    try {
        const url = new URL(value)
        return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash
    } catch {
        return false
    }
}

export function attachCaptureHost(panel: vscode.WebviewPanel, globalState: vscode.Memento): void {
    // Pin the destination for this panel so an upload cannot switch servers midway through a capture.
    const config = vscode.workspace.getConfiguration('klighdInstrumentation')
    const requestTimeoutMs = config.get('requestTimeoutMs', 10_000)
    const settings = {
        apiBaseUrl: config.get('apiBaseUrl', '').trim().replace(/\/+$/, ''),
        requestTimeoutMs,
        heartbeatIntervalMs: config.get<number>('heartbeatIntervalMs'),
        batchUpload: {
            flushIntervalMs: config.get<number>('batchUpload.flushIntervalMs'),
            maxEventsPerBatch: config.get<number>('batchUpload.maxEventsPerBatch'),
            minimumRetryDelayMs: config.get<number>('batchUpload.minimumRetryDelayMs'),
            maximumRetryDelayMs: config.get<number>('batchUpload.maximumRetryDelayMs'),
            // Keep the lease valid until the HTTP request and webview reply have had time to finish.
            leaseDurationMs: Math.max(30_000, requestTimeoutMs + 5_000),
        },
    }

    const { webview } = panel
    let closed = false
    const subscription = webview.onDidReceiveMessage(async (message) => {
        if (
            message?.type !== 'klighdInstrumentation.request' ||
            !Number.isSafeInteger(message.id) ||
            !['settings', 'register', 'batch'].includes(message.kind)
        ) {
            return
        }

        const reply = { type: 'klighdInstrumentation.reply', id: message.id }
        let result: unknown
        let failure: string | undefined
        try {
            if (!isCollectionUrl(settings.apiBaseUrl)) {
                throw new Error(
                    'Set a valid HTTP(S) API Base URL in KLighD Instrumentation settings, then reopen the diagram.'
                )
            }
            if (!Number.isInteger(requestTimeoutMs) || requestTimeoutMs < 1 || requestTimeoutMs > 2_147_478_647) {
                throw new Error('Set a valid Request Timeout in KLighD Instrumentation settings, then reopen the diagram.')
            }
            if (message.kind === 'settings') {
                result = settings
            } else {
                const data =
                    message.kind === 'register'
                        ? { ...message.data, externalParticipantId: await getInstallationId(globalState) }
                        : message.data
                const response = await fetch(`${settings.apiBaseUrl}/api/${message.kind}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    redirect: 'error',
                    signal: AbortSignal.timeout(requestTimeoutMs),
                })
                result = { status: response.status, body: await response.text() }
            }
        } catch (error) {
            failure = error instanceof Error ? error.message : 'The instrumentation request failed.'
        }
        if (!closed) {
            await webview.postMessage({ ...reply, result, error: failure })
        }
    })
    panel.onDidDispose(() => {
        closed = true
        subscription.dispose()
    })
}
