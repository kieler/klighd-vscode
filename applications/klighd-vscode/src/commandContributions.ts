/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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
import {
    KlighdFitToScreenAction,
    KlighdRequestExportSvgAction,
    RefreshDiagramAction,
    RefreshLayoutAction,
} from '@kieler/klighd-core'
import 'reflect-metadata'
import { CenterAction, FitToScreenAction } from 'sprotty-protocol'
import { serializeUri } from 'sprotty-vscode'
import * as vscode from 'vscode'
import { command } from './constants'
import { KLighDWebviewPanelManager } from './webview-panel-manager'

/**
 * Overwrite register from sprotty-vscode's default contributions commands to
 * fix zooming problems with diagram.fit when an element is selected.
 *
 * _Note: This can not call the default implementation since VS Code is not able
 * to overwrite commands and would throw an error._
 */
export function registerCommands(manager: KLighDWebviewPanelManager, context: vscode.ExtensionContext): void {
    function getURI(commandArgs: any[]): vscode.Uri | undefined {
        if (commandArgs.length > 0 && commandArgs[0] instanceof vscode.Uri) {
            return commandArgs[0]
        }
        if (vscode.window.activeTextEditor) {
            return vscode.window.activeTextEditor.document.uri
        }
        return undefined
    }
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramOpen, async (...commandArgs: any[]) => {
            const uri = getURI(commandArgs)
            if (uri) {
                manager.storageService.setItem('diagramOpen', true)
                if (manager.getShowMainDiagram()) {
                    manager.setMainDiagramUri(uri)
                }
                manager.openDiagram(uri, { reveal: true })
            }
        })
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramCenter, () => {
            const activeWebview = manager.findActiveWebview()
            if (activeWebview) {
                activeWebview.sendAction(CenterAction.create([], { animate: true }))
            }
        })
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramFit, () => {
            const activeWebview = manager.findActiveWebview()
            if (activeWebview) {
                activeWebview.sendAction(KlighdFitToScreenAction.create(true))
            }
        })
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramLayout, () => {
            const activeWebview = manager.findActiveWebview()
            if (activeWebview) {
                activeWebview.sendAction(RefreshLayoutAction.create())
            }
        })
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramRefresh, () => {
            const activeWebview = manager.findActiveWebview()
            if (activeWebview) {
                activeWebview.sendAction(RefreshDiagramAction.create()).then(() => {
                    // If the diagram should resize to fit, send a resize to fit action.
                    if (manager.storageService.getItem(FitToScreenAction.KIND)) {
                        activeWebview.sendAction(KlighdFitToScreenAction.create(true))
                    }
                })
            }
        })
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramExport, () => {
            const activeWebview = manager.findActiveWebview()
            if (activeWebview) {
                // TODO: check if this is fixed in a newer Sprotty release.
                activeWebview.sendAction(KlighdRequestExportSvgAction.create())
            }
        })
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramSync, () => {
            manager.setSyncWithEditor(true)
            manager.setShowMainDiagram(false)
            const { activeTextEditor } = vscode.window
            if (activeTextEditor) {
                const uri = activeTextEditor.document.fileName
                vscode.commands.executeCommand(command.diagramOpen, vscode.Uri.file(uri))
            }
        })
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramNoSync, () => {
            manager.setSyncWithEditor(false)
        })
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramShowMain, () => {
            manager.setSyncWithEditor(true)
            manager.setShowMainDiagram(true)

            const activeDiagramUri = manager.findActiveWebview()?.diagramIdentifier?.uri
            const mainDiagramUri = activeDiagramUri
                ? vscode.Uri.parse(activeDiagramUri)
                : vscode.window.activeTextEditor?.document.uri
            if (mainDiagramUri) {
                manager.setMainDiagramUri(mainDiagramUri)
                manager.openDiagram(mainDiagramUri, { reveal: true })
            }
        })
    )
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramShowActive, () => {
            manager.setSyncWithEditor(true)
            manager.setShowMainDiagram(false)

            const { activeTextEditor } = vscode.window
            if (activeTextEditor) {
                manager.openDiagram(activeTextEditor.document.uri, { reveal: true })
            }
        })
    )
}

/**
 * Register a listener to active text editor switching. After every switch, the diagram view attempts to
 * open the text editor's document.
 * Turns this behavior off if sync with editor is disabled.
 */
export function registerTextEditorSync(manager: KLighDWebviewPanelManager, context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(async (editor) => {
            if (!editor) return

            if (!manager.getSyncWithEditor()) return

            const shouldOpen = manager.storageService.getItem('diagramOpen')
            if (!shouldOpen) return

            const activeWebview = manager.findActiveWebview()
            let targetUri = editor.document.uri
            if (manager.getShowMainDiagram()) {
                targetUri = manager.getMainDiagramUri() ?? editor.document.uri
                if (!manager.getMainDiagramUri()) {
                    manager.setMainDiagramUri(targetUri)
                }
            }

            const alreadyOpen = serializeUri(targetUri) === activeWebview?.diagramIdentifier?.uri
            if (!alreadyOpen) {
                manager.openDiagram(targetUri)
            }
        })
    )
}
