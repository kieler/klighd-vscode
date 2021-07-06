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

import * as rpc from "vscode-ws-jsonrpc";
import * as lsp from "vscode-languageserver-protocol";
import { Connection, NotificationType, ActionMessage } from "@kieler/klighd-core";
import { showPopup } from "../popup";

type GeneralMessageParams = [string, "info" | "warn" | "error"];

// Custom LSP methods defined by KLighD
const acceptMessageType = new rpc.NotificationType<ActionMessage, void>("diagram/accept");
const generalMessageType = new rpc.NotificationType<GeneralMessageParams, void>(
    "general/sendMessage"
);

/**
 * Websocket connection to a language server. Implements the {@link Connection} service
 * required by `klighd-core`.
 *
 * Inspired by
 * [this implementation](https://github.com/wylieconlon/lsp-editor-adapter/blob/master/src/ws-connection.ts).
 */
export class LSPConnection implements Connection {
    private socket?: WebSocket;
    private connection?: rpc.MessageConnection;
    private messageHandlers: ((message: ActionMessage) => void)[] = [];
    /** Listeners that will be informed, once a connection is initialized */
    private _onInitializedListeners: (() => void)[] = [];
    private isInitialized = false;

    sendMessage(message: ActionMessage): void {
        this.connection?.sendNotification(acceptMessageType, message);
    }

    sendNotification<T extends Record<string, unknown>>(type: NotificationType, payload: T): void {
        this.connection?.sendNotification(type, payload);
    }

    onMessageReceived(handler: (message: ActionMessage) => void): void {
        this.messageHandlers.push(handler);
    }

    onReady(): Promise<void> {
        return new Promise((resolve) => {
            // Resolve directly if a connection is already initialized
            if (this.isInitialized) {
                resolve();
                return;
            }

            // ...else add this Promise to the waiting list
            this._onInitializedListeners.push(resolve);
        });
    }

    private notifyHandlers(message: ActionMessage) {
        for (const handler of this.messageHandlers) {
            handler(message);
        }
    }

    /** Notify listeners that are waiting for an initialized connection */
    private notifyInitializedListeners() {
        this._onInitializedListeners.forEach((cb) => cb());
        this._onInitializedListeners = [];
    }

    /** Connect to a given websocket url using `vscode-ws-jsonrpc`. */
    connect(websocketUrl: string): Promise<this> {
        // The WebSocket has to be created in place! Passing it as a parameter might lead
        // to a race-condition where the socket is opened, before vscode-ws-jsonrpc
        // starts to listen. This causes the connection to not work.
        return new Promise((resolve) => {
            const socket = new WebSocket(websocketUrl);
            this.socket = socket;
            console.time("lsp-connect");

            rpc.listen({
                webSocket: socket,
                logger: new rpc.ConsoleLogger(),
                onConnection: (conn) => {
                    conn.listen();

                    console.timeEnd("lsp-connect");
                    this.connection = conn;

                    this.setupErrorHandlers(conn);

                    // Setup subscriber notifications for incoming accept messages.
                    this.connection.onNotification(
                        acceptMessageType,
                        this.notifyHandlers.bind(this)
                    );

                    // Handle message from the server that should be displayed to the user
                    this.connection.onNotification(
                        generalMessageType,
                        this.displayGeneralMessage.bind(this)
                    );

                    resolve(this);
                },
            });
        });
    }

    /** Display connections errors and close events to the user. */
    private setupErrorHandlers(conn: rpc.MessageConnection) {
        conn.onError((e) => {
            showPopup(
                "error",
                "Connection error",
                e[0].message ?? "An error on the connection to the language server occurred."
            );
            console.error(e[0]);
        });

        conn.onClose(() => {
            showPopup(
                "error",
                "Connection closed",
                "Connection to the language server closed. Please reload to reconnect.",
                { persist: true }
            );
            this.close();
        });
    }

    private displayGeneralMessage(params: GeneralMessageParams) {
        const [message, type] = params;

        showPopup(type, "Server message", message);
    }

    /** Close the connection. */
    close(): void {
        this.connection?.dispose();
        this.connection = undefined;

        this.socket?.close();
    }

    /**
     * Initializes the connection according to the LSP specification.
     */
    async sendInitialize(): Promise<void> {
        if (!this.connection) return;

        const method = lsp.InitializeRequest.type.method;
        // The standalone view does not really has any LSP capabilities
        const initParams: lsp.InitializeParams = {
            processId: null,
            workspaceFolders: null,
            rootUri: null,
            clientInfo: { name: "webview" },
            capabilities: {},
        };

        console.time("lsp-init");
        await this.connection.sendRequest(method, initParams);
        this.connection.sendNotification(lsp.InitializedNotification.type.method);
        console.timeEnd("lsp-init");

        this.isInitialized = true;
        this.notifyInitializedListeners();
    }

    /**
     * Notifies the connected language server about an opened document. This only sends
     * the uri of the document. The LS uses the uri to open the document and parse
     * its content.
     * @param sourceUri Valid our for the document. See the LSP for more information.
     * @param languageId Id of the language inside the document.
     */
    sendDocumentDidOpen(sourceUri: string, languageId: string): void {
        const method = lsp.DidOpenTextDocumentNotification.type.method;
        const params = {
            textDocument: {
                languageId: languageId,
                uri: sourceUri,
                // The standalone view is not able to change a document. Therefore,
                // the document version is constant.
                version: 0,
            },
        };

        this.connection?.sendNotification(method, params);
    }
}
