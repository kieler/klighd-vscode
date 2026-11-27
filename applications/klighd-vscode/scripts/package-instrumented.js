const { execFileSync } = require('node:child_process')
const { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')

const application = path.resolve(__dirname, '..')
const staging = mkdtempSync(path.join(tmpdir(), 'klighd-vscode-instrumented-'))

try {
    const manifest = JSON.parse(readFileSync(path.join(application, 'package.json'), 'utf8'))
    manifest.displayName = 'KLighD Diagrams (Instrumented)'
    const { configuration } = manifest.contributes
    manifest.contributes.configuration = [
        ...(Array.isArray(configuration) ? configuration : [configuration].filter(Boolean)),
        {
            title: 'KLighD Instrumentation',
            properties: {
                'klighdInstrumentation.apiBaseUrl': {
                    type: 'string',
                    default: 'https://survey.rtsys.informatik.uni-kiel.de',
                    scope: 'application',
                    description: 'Base URL of the Exeter-compatible collection API.',
                },
                'klighdInstrumentation.requestTimeoutMs': positiveIntegerSetting(
                    10_000,
                    'Timeout in milliseconds for registration and batch upload requests.'
                ),
                'klighdInstrumentation.heartbeatIntervalMs': positiveIntegerSetting(
                    5_000,
                    'Milliseconds between heartbeat events while recording.'
                ),
                'klighdInstrumentation.batchUpload.flushIntervalMs': positiveIntegerSetting(
                    5_000,
                    'Milliseconds between attempts to flush buffered events.'
                ),
                'klighdInstrumentation.batchUpload.maxEventsPerBatch': positiveIntegerSetting(
                    100,
                    'Number of buffered events that triggers a batch upload.'
                ),
                'klighdInstrumentation.batchUpload.minimumRetryDelayMs': positiveIntegerSetting(
                    5_000,
                    'Initial retry delay in milliseconds before random variation is applied.'
                ),
                'klighdInstrumentation.batchUpload.maximumRetryDelayMs': positiveIntegerSetting(
                    60_000,
                    'Maximum retry delay in milliseconds before random variation is applied.'
                ),
            },
        },
    ]
    delete manifest.scripts
    delete manifest.dependencies
    delete manifest.devDependencies
    writeFileSync(path.join(staging, 'package.json'), `${JSON.stringify(manifest, null, 4)}\n`)
    for (const file of ['README.md', 'CHANGELOG.md', 'LICENSE', 'icon.png', '.vscodeignore']) {
        copyFileSync(path.join(application, file), path.join(staging, file))
    }

    const webpack = require.resolve('webpack/bin/webpack.js')
    // Separate processes release each compiler's memory before starting the next bundle.
    for (const config of ['extension', 'webview']) {
        execFileSync(
            process.execPath,
            [
                webpack,
                '--config-name',
                config,
                '--mode',
                'production',
                '--devtool',
                'false',
                '--env',
                `instrumentedOutput=${staging}`,
            ],
            { cwd: application, stdio: 'inherit' }
        )
    }
    execFileSync(
        process.execPath,
        [
            require.resolve('@vscode/vsce/vsce'),
            'package',
            '--no-dependencies',
            '--baseImagesUrl',
            'https://github.com/kieler/klighd-vscode/raw/HEAD/applications/klighd-vscode',
            '-o',
            path.join(application, 'klighd-vscode-instrumented.vsix'),
        ],
        { cwd: staging, stdio: 'inherit' }
    )
} finally {
    rmSync(staging, { recursive: true, force: true })
}

function positiveIntegerSetting(defaultValue, description) {
    return { type: 'integer', minimum: 1, default: defaultValue, scope: 'application', description }
}
