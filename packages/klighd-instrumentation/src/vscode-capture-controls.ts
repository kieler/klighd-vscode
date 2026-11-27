/* eslint-env browser */

type CaptureState = 'idle' | 'pending' | 'recording' | 'error'

const styles = `
    .klighd-capture-controls {
        position: fixed;
        right: 2rem;
        bottom: 2rem;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: .35rem;
        border: 1px solid transparent;
        border-radius: 22px;
        color: var(--vscode-foreground);
        font-family: var(--vscode-font-family, sans-serif);
    }

    .klighd-capture-controls[data-expanded] {
        padding-right: .5rem;
        border-color: var(--vscode-widget-border, #888);
        background: var(--vscode-editorWidget-background);
        box-shadow: 0 3px 10px #00000035;
    }

    .klighd-capture-toggle {
        position: relative;
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        padding: 8px;
        border: 1px solid currentColor;
        border-radius: 50%;
        background: var(--vscode-editor-background);
        color: var(--vscode-icon-foreground, inherit);
        cursor: pointer;
    }

    .klighd-capture-toggle svg {
        width: 100%;
        height: 100%;
    }

    .klighd-capture-dot {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 12px;
        height: 12px;
        box-sizing: border-box;
        border: 1px solid #6f7378;
        border-radius: 50%;
        background: #9aa0a6;
    }

    .klighd-capture-controls[data-state="pending"] .klighd-capture-dot {
        border: 2px solid #b8b8b8;
        border-top-color: #555;
        background: var(--vscode-editor-background);
        animation: klighd-capture-spin .8s linear infinite;
    }

    .klighd-capture-controls[data-state="recording"] .klighd-capture-dot {
        border-color: #34ad34;
        background: #42cc42;
        animation: klighd-capture-pulse 2.5s ease-in-out infinite;
    }

    .klighd-capture-controls[data-state="error"] .klighd-capture-dot {
        border-color: #ad3434;
        background: #cc4242;
    }

    .klighd-capture-actions:not([hidden]) {
        display: flex;
        gap: .35rem;
    }

    .klighd-capture-actions button {
        border: 1px solid transparent;
        border-radius: 12px;
        padding: 4px 8px;
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        white-space: nowrap;
    }

    .klighd-capture-actions button:hover:enabled {
        background: var(--vscode-button-secondaryHoverBackground);
        cursor: pointer;
    }

    .klighd-capture-actions button:disabled {
        opacity: .55;
    }

    .klighd-capture-status {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
    }

    .klighd-capture-controls[data-expanded][data-state="error"] .klighd-capture-status {
        right: 0;
        bottom: calc(100% + 6px);
        width: 100%;
        height: auto;
        box-sizing: border-box;
        padding: 6px 8px;
        border-radius: 6px;
        background: var(--vscode-editorWidget-background);
        color: var(--vscode-errorForeground);
        clip-path: none;
    }

    @keyframes klighd-capture-spin {
        to { transform: rotate(360deg); }
    }

    @keyframes klighd-capture-pulse {
        30% { box-shadow: 0 0 0 4px #42cc4240; }
        60%, 100% { box-shadow: none; }
    }

    @media (prefers-reduced-motion: reduce) {
        .klighd-capture-controls[data-state] .klighd-capture-dot {
            animation: none;
        }
    }
`

export function createCaptureControls(document: Document, onStart: () => void, onStop: () => void) {
    const style = document.createElement('style')
    style.textContent = styles
    document.head.append(style)

    const root = document.createElement('div')
    root.className = 'klighd-capture-controls'
    root.innerHTML = `
        <button class="klighd-capture-toggle" type="button" aria-expanded="false"
            aria-label="Toggle diagram capture controls" aria-controls="klighd-capture-actions">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.-->
                <path fill="currentcolor" d="M240 64C213.5 64 192 85.5 192 112L192 320C192 346.5 213.5 368 240 368L304 368C330.5 368 352 346.5 352 320L352 256L384 256C454.7 256 512 313.3 512 384C512 454.7 454.7 512 384 512L96 512C78.3 512 64 526.3 64 544C64 561.7 78.3 576 96 576L544 576C561.7 576 576 561.7 576 544C576 526.3 561.7 512 544 512L527.1 512C557.5 478 576 433.2 576 384C576 278 490 192 384 192L352 192L352 112C352 85.5 330.5 64 304 64L240 64zM184 416C170.7 416 160 426.7 160 440C160 453.3 170.7 464 184 464L360 464C373.3 464 384 453.3 384 440C384 426.7 373.3 416 360 416L184 416z"/>
            </svg>
            <span class="klighd-capture-dot" aria-hidden="true"></span>
        </button>
        <div id="klighd-capture-actions" class="klighd-capture-actions" hidden>
            <button type="button" class="klighd-capture-start">Start Capture</button>
            <button type="button" class="klighd-capture-stop">Stop Capture</button>
        </div>
        <span class="klighd-capture-status" role="status"></span>
    `

    const toggle = root.querySelector<HTMLButtonElement>('.klighd-capture-toggle')!
    const actions = root.querySelector<HTMLDivElement>('.klighd-capture-actions')!
    const start = root.querySelector<HTMLButtonElement>('.klighd-capture-start')!
    const stop = root.querySelector<HTMLButtonElement>('.klighd-capture-stop')!
    const status = root.querySelector<HTMLSpanElement>('.klighd-capture-status')!

    toggle.addEventListener('click', () => {
        const expanded = root.toggleAttribute('data-expanded')
        toggle.setAttribute('aria-expanded', String(expanded))
        actions.hidden = !expanded
    })
    start.addEventListener('click', onStart)
    stop.addEventListener('click', onStop)

    function setState(state: CaptureState, message: string): void {
        root.dataset.state = state
        start.disabled = state === 'pending' || state === 'recording'
        stop.disabled = state !== 'recording'
        status.textContent = message
        toggle.title = message
    }

    setState('idle', 'Capture idle')
    document.body.append(root)
    return { setState }
}
