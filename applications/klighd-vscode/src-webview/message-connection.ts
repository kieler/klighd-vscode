/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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
import { ActionMessage, isActionMessage } from "sprotty-protocol";
import { VscodeDiagramWidgetFactory } from "sprotty-vscode-webview";
import { VsCodeApi } from "sprotty-vscode-webview/lib/services";
/**
 * Message based {@link Connection} to the VS Code extension. `sprotty-vscode` is used in
 * the extension to forward the messages to the server and sends server messages as
 * message events.
 */
@injectable()
export class MessageConnection implements Connection {
    private messageHandlers: ((message: ActionMessage) => void)[] = [];

    vscodeApi: VsCodeApi

    @inject(VscodeDiagramWidgetFactory)
    private diagramWidgetFactory!: VscodeDiagramWidgetFactory;

    constructor(vscodeApi: VsCodeApi) {
        this.vscodeApi = vscodeApi;
        this.messageHandlers.push(this.statusMessageHandler);
        this.messageHandlers.push(this.logHandler);

        // Messages from a VS Code extension arrive as a message event on the window object
        window.addEventListener("message", (msg) => {
            if ("data" in msg && isActionMessage(msg.data)) {
                this.notifyHandlers(msg.data);
            }
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

    sendMessage(message: ActionMessage): void {
        console.groupCollapsed(`MessageConnection sends ${message.action.kind} action:`);
        console.log(message);
        console.groupEnd();

        this.vscodeApi.postMessage(message);
    }

    sendNotification<T extends Record<string, unknown>>(type: NotificationType, payload: T): void {
        console.groupCollapsed(`MessageConnection sends ${type} notification:`);
        console.log(payload);
        console.groupEnd();

        // SprottyLSPWebview sends a message with the language client, if it
        // has a method property and passes a params property as the second argument
        // to languageClient.sendNotification.
        this.vscodeApi.postMessage({ method: type, params: payload });
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
