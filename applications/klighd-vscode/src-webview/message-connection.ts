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
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { Connection, NotificationType } from "klighd-core";
import { inject, injectable } from "inversify";
import { ActionMessage, isActionMessage, ServerStatusAction } from "sprotty";
import { VscodeDiagramWidgetFactory } from "sprotty-vscode-webview";
import { vscodeApi } from "sprotty-vscode-webview/lib/vscode-api";

/**
 * Message based {@link Connection} to the VSCode extension. `sprotty-vscode` is used in
 * the extension to forward the messages to the server and sends server messages as
 * message events.
 */
@injectable()
export class MessageConnection implements Connection {
    private messageHandlers: ((message: ActionMessage) => void)[] = [];

    @inject(VscodeDiagramWidgetFactory)
    private diagramWidgetFactory!: VscodeDiagramWidgetFactory;

    constructor() {
        this.messageHandlers.push(this.statusMessageHandler);
        this.messageHandlers.push(this.logHandler);

        // Messages from a VSCode extension arrive as a message event on the window object
        window.addEventListener("message", (msg) => {
            if ("data" in msg && isActionMessage(msg.data)) {
                this.notifyHandlers(msg.data);
            }
        });
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

        vscodeApi.postMessage(message);
    }

    sendNotification<T extends Record<string, unknown>>(type: NotificationType, payload: T): void {
        console.groupCollapsed(`MessageConnection sends ${type} notification:`);
        console.log(payload);
        console.groupEnd();

        // SprottyLSPWebview sends a message with the language client, if it
        // has a method property and passes a params property as the second argument
        // to languageClient.sendNotification.
        vscodeApi.postMessage({ method: type, params: payload });
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
