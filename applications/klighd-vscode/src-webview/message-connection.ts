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

import { Connection, NotificationType } from "@kieler/klighd-core";
import { inject, injectable } from "inversify";
import { ServerStatusAction } from "sprotty";
import { ActionMessage, } from "sprotty-protocol";
import { ActionNotification } from 'sprotty-vscode-protocol';
import { LspNotification, LspRequest } from 'sprotty-vscode-protocol/lib/lsp';
import { VscodeDiagramWidgetFactory } from "sprotty-vscode-webview";
import { NotificationMessage, RequestMessage } from 'vscode-languageclient';
import { HOST_EXTENSION } from 'vscode-messenger-common';
import { Messenger } from 'vscode-messenger-webview';

/**
 * Message based {@link Connection} to the VS Code extension. `sprotty-vscode` is used in
 * the extension to forward the messages to the server and sends server messages as
 * message events.
 */
@injectable()
export class MessageConnection implements Connection {
    private messageHandlers: ((message: ActionMessage) => void)[] = [];

    @inject(VscodeDiagramWidgetFactory)
    private diagramWidgetFactory!: VscodeDiagramWidgetFactory;
    messenger: Messenger;

    constructor(messenger: Messenger) {
        this.messageHandlers.push(this.statusMessageHandler);
        this.messageHandlers.push(this.logHandler);
        this.messenger = messenger
        // Messages from a VS Code extension arrive as a message event on the messenger
        this.messenger.onNotification(ActionNotification, (msg) => {
            this.notifyHandlers(msg)
        });
    }

    onReady(): Promise<void> {
        // A message connection is created in a webview. When a webview is created,
        // it is able to send messages to the extension, and the extension should
        // already have a initialized language client. So onReady is able to always resolve directly.
        return new Promise((resolve) => resolve());
    }

    private notifyHandlers(message: ActionMessage) {
        for (const handler of this.messageHandlers) {
            handler(message);
        }
    }

    async sendMessage<R>(message: ActionMessage): Promise<R> {
        console.groupCollapsed(`MessageConnection sends ${message.action.kind} action:`);
        console.log(message);
        console.groupEnd();

        const theMessage: RequestMessage = {
            jsonrpc: '2.0',
            method: "diagram/accept",
            id: message.clientId,
            params: message
        };
        const response = await this.messenger.sendRequest(LspRequest, HOST_EXTENSION, theMessage);
        if (response.error) {
            throw new Error(String(response.error));
        }
        return response.result as unknown as R;
    }

    sendNotification<T extends Record<string, unknown>>(type: NotificationType, payload: T): void {
        console.groupCollapsed(`MessageConnection sends ${type} notification:`);
        console.log(payload);
        console.groupEnd();

        const message: NotificationMessage = {
            jsonrpc: '2.0',
            method: type,
            params: payload as any
        };
        this.messenger.sendNotification(LspNotification, HOST_EXTENSION, message);
    }

    onMessageReceived(handler: (message: ActionMessage) => void): void {
        this.messageHandlers.push(handler);
    }

    logHandler(message: ActionMessage): void {
        console.groupCollapsed(`MessageConnection received ${message.action.kind} action:`);
        console.log(message);
        console.groupEnd();
    }

    statusMessageHandler(message: ActionMessage): void {
        if (message.action.kind === ServerStatusAction.KIND) {
            this.diagramWidgetFactory().setStatus(message.action as ServerStatusAction);
        }
    }
}
