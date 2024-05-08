/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023-2024 by
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
import { Action, ActionMessage, isActionMessage } from 'sprotty-protocol'
import { WebviewEndpoint } from 'sprotty-vscode'
import { LspNotification, LspRequest } from 'sprotty-vscode-protocol/lib/lsp'
import { LspWebviewEndpointOptions, acceptMessageType } from 'sprotty-vscode/lib/lsp'
import { ResponseMessage } from 'vscode-jsonrpc/lib/common/messages'
import { LanguageClient } from 'vscode-languageclient/node'

type ActionHandler = (action: Action) => void | Promise<void>

/**
 * Mostly the LspWebviewEndpoint implementation, with the change that we can also intercept
 * LspRequests that will request a diagram/accept action.
 */
export class KlighDWebviewEndpoint extends WebviewEndpoint {
    readonly languageClient: LanguageClient

    protected readonly klighdActionHandlers: Map<string, ActionHandler[]> = new Map()

    constructor(options: LspWebviewEndpointOptions) {
        super(options)
        this.languageClient = options.languageClient
    }

    /**
     * Add an action handler for the given type of Sprotty action to be handled here before being sent to the language server.
     * @param kind the kind of action to be handled.
     * @param actionHandler the action handler to be called for this action.
     */
    addKlighdActionHandler(kind: string, actionHandler: ActionHandler): void {
        const handlers = this.klighdActionHandlers.get(kind)
        if (handlers) {
            handlers.push(actionHandler)
        } else {
            this.klighdActionHandlers.set(kind, [actionHandler])
        }
    }

    protected override connect(): void {
        super.connect()
        this.messenger.onRequest(
            LspRequest,
            async (request) => {
                const result: any =
                    request.params === undefined
                        ? await this.languageClient.sendRequest(request.method)
                        : await this.languageClient.sendRequest(request.method, request.params)
                const response: ResponseMessage = {
                    jsonrpc: '2.0',
                    id: request.id,
                    result,
                }
                return response
            },
            { sender: this.messageParticipant }
        )
        this.messenger.onNotification(
            LspNotification,
            (notification) => {
                // Catch any diagram/accept action and call the registered action handlers.
                if (notification.method === 'diagram/accept' && isActionMessage(notification.params)) {
                    const { action } = notification.params
                    const handlers = this.klighdActionHandlers.get(notification.params.action.kind)
                    if (handlers) {
                        handlers.forEach((handler) => handler(action))
                        // TODO: if one of the handlers says the action does not need to be forwarded to the server, do not forward it.
                    }
                }
                this.languageClient.sendNotification(notification.method, notification.params)
            },
            { sender: this.messageParticipant }
        )
    }

    override async receiveAction(message: ActionMessage): Promise<void> {
        await super.receiveAction(message)
        await this.languageClient.sendNotification(acceptMessageType, message)
    }
}
