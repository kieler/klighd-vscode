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
import 'reflect-metadata'
import { Action } from 'sprotty-protocol'
import { SprottyDiagramIdentifier, WebviewEndpoint, serializeUri } from 'sprotty-vscode'
import { LspWebviewEndpoint, LspWebviewPanelManager, LspWebviewPanelManagerOptions } from 'sprotty-vscode/lib/lsp'
import { addLspLabelEditActionHandler, addWorkspaceEditActionHandler } from 'sprotty-vscode/lib/lsp/editing'
import * as vscode from 'vscode'
import { contextKeys } from './constants'
import { StorageService } from './storage/storage-service'
import { KlighDWebviewEndpoint } from './webview-endpoint'

/**
 * Callback provided for other extension to register an {@link ActionHandler}.
 * To simplify the implementation for other extensions, which do not have access to
 * the type definition, we simplify the requirements to provide an action kind and
 * callback instead of an class.
 */
export type ActionHandlerCallback = (action: Action) => Promise<void>

/**
 * The webview panel manager for KLighD diagrams. Additionally handles synchronization of the
 * diagram with the editor, when it opens, and connects external action handlers with the endpoint.
 */
export class KLighDWebviewPanelManager extends LspWebviewPanelManager {
    readonly storageService: StorageService

    private syncWithEditor: boolean

    private showMainDiagram: boolean

    private mainDiagramUri: vscode.Uri | undefined

    private actionHandlers: { kind: string; actionHandler: ActionHandlerCallback }[]

    constructor(
        options: LspWebviewPanelManagerOptions,
        storageService: StorageService,
        actionHandlers: { kind: string; actionHandler: ActionHandlerCallback }[]
    ) {
        super(options)
        this.storageService = storageService
        this.actionHandlers = actionHandlers
        this.syncWithEditor = true
        this.showMainDiagram = false
        const persistedMainDiagramUri = this.storageService.getItem('mainDiagramUri')
        this.mainDiagramUri =
            typeof persistedMainDiagramUri === 'string' ? vscode.Uri.parse(persistedMainDiagramUri) : undefined

        const persistedSyncWithEditor = this.storageService.getItem('syncWithEditor')
        this.setSyncWithEditor(persistedSyncWithEditor === undefined ? true : !!persistedSyncWithEditor)

        const persistedShowMainDiagram = this.storageService.getItem('showMainDiagram')
        this.setShowMainDiagram(persistedShowMainDiagram === undefined ? false : !!persistedShowMainDiagram)
    }

    /** Changes the behavior of "sync with editor". If disabled, the diagram view will not update when the active editor changes. */
    setSyncWithEditor(sync: boolean): void {
        this.syncWithEditor = sync
        this.storageService.setItem('syncWithEditor', sync)
        vscode.commands.executeCommand('setContext', contextKeys.syncWithEditor, sync)
    }

    getSyncWithEdior(): boolean {
        return this.syncWithEditor
    }

    setShowMainDiagram(showMainDiagram: boolean): void {
        this.showMainDiagram = showMainDiagram
        this.storageService.setItem('showMainDiagram', showMainDiagram)
        vscode.commands.executeCommand('setContext', contextKeys.showMainDiagram, showMainDiagram)
    }

    getShowMainDiagram(): boolean {
        return this.showMainDiagram
    }

    setMainDiagramUri(uri: vscode.Uri | undefined): void {
        this.mainDiagramUri = uri
        if (uri) {
            this.storageService.setItem('mainDiagramUri', uri.toString())
        } else {
            this.storageService.setItem('mainDiagramUri', undefined)
        }
    }

    getMainDiagramUri(): vscode.Uri | undefined {
        return this.mainDiagramUri
    }

    protected override async createDiagramIdentifier(
        uri: vscode.Uri,
        diagramType?: string
    ): Promise<SprottyDiagramIdentifier | undefined> {
        if (!diagramType) {
            diagramType = await this.getDiagramType(uri)
            if (!diagramType) {
                return undefined
            }
        }
        const clientId = `${diagramType}_sprotty`
        return {
            diagramType,
            uri: serializeUri(uri),
            clientId,
        }
    }

    protected override createEndpoint(identifier: SprottyDiagramIdentifier): LspWebviewEndpoint {
        // const endpoint = super.createEndpoint(identifier);
        const webviewContainer = this.createWebview(identifier)
        const participant = this.messenger.registerWebviewPanel(webviewContainer)
        const endpoint = new KlighDWebviewEndpoint({
            languageClient: this.languageClient,
            webviewContainer,
            messenger: this.messenger,
            messageParticipant: participant,
            identifier,
        })

        addWorkspaceEditActionHandler(endpoint as unknown as LspWebviewEndpoint)
        addLspLabelEditActionHandler(endpoint as unknown as LspWebviewEndpoint)

        for (const actionHandler of this.actionHandlers) {
            endpoint.addKlighdActionHandler(actionHandler.kind, actionHandler.actionHandler)
        }
        // endpoint.
        return endpoint as unknown as LspWebviewEndpoint
    }

    protected override didCloseWebview(endpoint: WebviewEndpoint): void {
        super.didCloseWebview(endpoint)
        this.storageService.setItem('diagramOpen', false)
    }
}
