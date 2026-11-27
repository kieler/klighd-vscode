import type { Container } from 'inversify'
import type { VsCodeApi } from 'sprotty-vscode-webview/lib/services'

// The instrumented webpack build replaces this module with the recording adapter.
export function attachCapture(_container: Container, _api: VsCodeApi): (() => void) | undefined {
    return undefined
}
