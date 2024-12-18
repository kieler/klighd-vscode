/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
// reflect-metadata needs to be imported before anything else to make any code requiring inversify.js to work.
// See https://stackoverflow.com/questions/37534890/inversify-js-reflect-hasownmetadata-is-not-a-function
import 'reflect-metadata'
// The other imports.
import { ChangeColorThemeAction, DebugOptions, SetRenderOptionAction } from '@kieler/klighd-core'
import { diagramType } from '@kieler/klighd-core/lib/base/external-helpers'
import { Action, ActionMessage, isAction } from 'sprotty-protocol'
import { registerLspEditCommands } from 'sprotty-vscode'
import * as vscode from 'vscode'
import { LanguageClient, State } from 'vscode-languageclient/node'
import { Messenger } from 'vscode-messenger'
import { registerCommands, registerTextEditorSync } from './commandContributions'
import { command } from './constants'
import { KlighdWebviewReopener } from './klighd-webview-reopener'
import { LspHandler } from './lsp-handler'
import { ReportChangeMessage } from './storage/messages'
import { StorageService } from './storage/storage-service'
import { ActionHandlerCallback, KLighDWebviewPanelManager } from './webview-panel-manager'

// potential exports for other extensions to improve their dev experience
// Currently, this only includes our command string. Requires this extension to be published as a package.
export { command }

let languageClient: LanguageClient

let messenger: Messenger

const actionHandlers: { kind: string; actionHandler: ActionHandlerCallback }[] = []

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext): void {
    // This extension should persist data in workspace state, so it is different for
    // each project a user opens. To change this, assign another Memento to this constant.
    const mementoForPersistence = context.workspaceState

    // Command provided for other extensions to register the LS used to generate diagrams with KLighD.
    context.subscriptions.push(
        vscode.commands.registerCommand(command.setLanguageClient, (client: unknown, fileEndings: unknown) => {
            if (!isLanguageClient(client) || !isFileEndingsArray(fileEndings)) {
                vscode.window.showErrorMessage(
                    `${command.setLanguageClient} command called with invalid arguments. Please refer to the documentation for reference about the correct usage.`
                )
                return
            }
            const storageService = new StorageService(mementoForPersistence, client)
            client.onDidChangeState((stateChangedEvent) => {
                if (stateChangedEvent.newState === State.Running) {
                    try {
                        languageClient = client
                        const webviewPanelManager = new KLighDWebviewPanelManager(
                            {
                                extensionUri: context.extensionUri,
                                defaultDiagramType: diagramType,
                                languageClient,
                                supportedFileExtensions: fileEndings.map((ending) => `.${ending}`),
                                singleton: true,
                            },
                            storageService,
                            actionHandlers
                        )
                        messenger = webviewPanelManager.messenger
                        registerCommands(webviewPanelManager, context)
                        registerLspEditCommands(webviewPanelManager, context, { extensionPrefix: 'klighd-vscode' })
                        registerTextEditorSync(webviewPanelManager, context)
                        registerChangeColorTheme(webviewPanelManager)

                        // Handle notifications that are KLighD specific extensions of the LSP for this LSClient.
                        LspHandler.init(client)

                        storageService.setMessenger(messenger)

                        new KlighdWebviewReopener(storageService).reopenDiagram()
                    } catch (e) {
                        vscode.window.showErrorMessage(
                            'something went wrong while setting the language client for the KLighD extension.'
                        )
                        throw e
                    }
                }
                return undefined
            })
        })
    )

    // Command for the user to remove all data stored by this extension. Allows
    // the user to reset changed synthesis options etc.
    context.subscriptions.push(
        vscode.commands.registerCommand(command.clearData, () => {
            StorageService.clearAll(mementoForPersistence)
            messenger.sendNotification(
                { method: 'klighd/persistence' },
                { type: 'webview', webviewType: diagramType },
                {
                    type: 'persistence/reportChange',
                    payload: { type: 'clear' },
                } as ReportChangeMessage
            )

            vscode.window.showInformationMessage('Stored data has been deleted.')
        })
    )

    // Command provided for other extensions to add an action handler to their created diagram extension instance.
    context.subscriptions.push(
        vscode.commands.registerCommand(
            command.addActionHandler,
            (kind: string, actionHandler: ActionHandlerCallback) => {
                if (typeof kind !== 'string' || typeof actionHandler !== 'function') {
                    vscode.window.showErrorMessage(
                        `${command.addActionHandler} command called with invalid arguments. Please refer to the documentation for reference about the correct usage.`
                    )
                    return
                }
                actionHandlers.push({
                    kind,
                    actionHandler,
                })
            }
        )
    )

    // Command provided for other extensions to dispatch an action if a webview is open
    context.subscriptions.push(
        vscode.commands.registerCommand(command.dispatchAction, (action: Action) => {
            if (!isAction(action)) {
                vscode.window.showErrorMessage(
                    `${command.addActionHandler} command called with invalid arguments. Please refer to the documentation for reference about the correct usage.`
                )
                return
            }
            messenger.sendNotification({ method: 'ActionMessage' }, { type: 'webview', webviewType: diagramType }, {
                clientId: `${diagramType}_sprotty`,
                action,
            } as ActionMessage)
        })
    )

    // Command to show debug options.
    context.subscriptions.push(
        vscode.commands.registerCommand(command.debugOptions, () => {
            vscode.commands.executeCommand(command.dispatchAction, SetRenderOptionAction.create(DebugOptions.ID, true))
        })
    )
}

export async function deactivate(): Promise<void> {
    if (languageClient) {
        await languageClient.stop()
    }
}

function isLanguageClient(client: unknown): client is LanguageClient {
    // Instanceof checks do not work, since the LanguageClient class from the
    // host extension is not the same as this LanguageClient class.
    // Both classes are part of different bundles and thus module system.
    // Therefore, they are two different classes internally.

    // To work around this, we ensure that it is an object and check the object
    // for the existence of a few methods that are used in this extension.

    const wantedMethod = [
        'needsStart',
        'onDidChangeState',
        'onNotification',
        'onRequest',
        'sendNotification',
        'sendRequest',
    ]

    const isObject = typeof client === 'object' && client !== null
    const hasWantedMethods = wantedMethod.every(
        (method) => typeof (client as Record<string, any>)[method] === 'function'
    )

    return isObject && hasWantedMethods
}

function isFileEndingsArray(array: unknown): array is string[] {
    return Array.isArray(array) && array.every((val) => typeof val === 'string')
}
/**
 * Hook into VS Code's theme change and notify the webview to check the current colors and send them to the server.
 */
function registerChangeColorTheme(manager: KLighDWebviewPanelManager) {
    vscode.window.onDidChangeActiveColorTheme(() => {
        for (const endpoint of manager.endpoints) {
            endpoint.sendAction({
                kind: ChangeColorThemeAction.KIND,
            })
        }
    })
}
