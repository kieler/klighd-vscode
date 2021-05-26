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

import * as rpc from "vscode-ws-jsonrpc";
import * as lsp from "vscode-languageserver-protocol";
import { IConnection } from "@kieler/keith-sprotty";
import { ActionMessage } from "sprotty";
import { showPopup } from "./popup";

const acceptMessageType = new rpc.NotificationType<ActionMessage, void>("diagram/accept");

/**
 * Connection to the language server.
 *
 * Inspired by
 * [this implementation](https://github.com/wylieconlon/lsp-editor-adapter/blob/master/src/ws-connection.ts).
 */
export class LSPConnection implements IConnection {
    private socket?: WebSocket;
    private connection?: rpc.MessageConnection;
    private messageHandlers: ((message: ActionMessage) => void)[] = [];

    sendMessage(message: ActionMessage): void {
        this.connection?.sendNotification(acceptMessageType, message);
    }

    onMessageReceived(handler: (message: ActionMessage) => void): void {
        this.messageHandlers.push(handler);
    }

    private notifyHandlers(message: ActionMessage) {
        for (const handler of this.messageHandlers) {
            handler(message);
        }
    }

    connect(websocketUrl: string): Promise<this> {
        // The WebSocket has created in place! Passing it as a parameter might lead
        // to a race-condition where the socket is opened, before vscode-ws-jsonrpc
        // starts to listen. This causes the connection to not work.
        return new Promise((resolve) => {
            const socket = new WebSocket(websocketUrl);
            this.socket = socket;
            console.log("Connecting to language server.");

            rpc.listen({
                webSocket: socket,
                logger: new rpc.ConsoleLogger(),
                onConnection: (conn) => {
                    conn.listen();

                    console.log("Connected to language server.");
                    this.connection = conn;

                    this.setupErrorHandlers(conn);

                    this.connection.onNotification(
                        acceptMessageType,
                        this.notifyHandlers.bind(this)
                    );

                    resolve(this);
                },
            });
        });
    }

    private setupErrorHandlers(conn: rpc.MessageConnection) {
        conn.onError((e) => {
            showPopup(
                "Connection error",
                e[0].message ?? "An error on the connection to the language server occurred."
            );
            console.error(e[0]);
        });

        conn.onClose(() => {
            showPopup(
                "Connection closed",
                "Connection to the language server closed. Please reload to reconnect.",
                { persist: true }
            );
            this.close();
        });
    }

    close() {
        this.connection?.dispose();
        this.connection = undefined;

        this.socket?.close();
    }

    /**
     * Initializes the connection according to the LSP specification.
     * @see
     */
    async sendInitialize() {
        if (!this.connection) return;

        const method = lsp.InitializeRequest.type.method;
        const initParams: lsp.InitializeParams = {
            processId: null,
            workspaceFolders: null,
            rootUri: null,
            clientInfo: { name: "webview" },
            capabilities: {},
        };

        console.log("initialize LSP.");
        console.time("lsp-init");
        await this.connection.sendRequest(method, initParams);
        this.connection.sendNotification(lsp.InitializedNotification.type.method);
        console.timeEnd("lsp-init");
        console.log("initialized LSP.");
    }

    /**
     * Notifies the connected language server about an opened document.
     * @param sourceUri Valid our for the document. See the LSP for more information.
     * @param languageId Id of the language inside the document.
     */
    sendDocumentDidOpen(sourceUri: string, languageId: string) {
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
