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

import { FastifyLoggerInstance } from "fastify";
import { Socket } from "net";
import { IWebSocket, Message } from "vscode-ws-jsonrpc";
import * as rpcServer from "vscode-ws-jsonrpc/lib/server";
// _fastify-websocket_ typing for their conn.socket object. _ws_ is a dependency of _fastify-websocket_.
import * as WebSocket from "ws";

/**
 * Creates a connection to the language server. The connection is able to either
 * use a socket connection or start a subprocess for a given path. The socket
 * connection has a higher precedence if both a port and path are provided.
 *
 * The implementation uses _vscode-ws-jsonrpc_ to tunnel a connection from a
 * WebSocket to the LS.
 * @see https://www.npmjs.com/package/vscode-ws-jsonrpc
 *
 * @returns A dispose callback.
 */
export function connectToLanguageServer(
    client: WebSocket,
    logger: FastifyLoggerInstance,
    lsPort?: number,
    lsPath?: string
): () => void {
    const webSocket = transformWebSocketToIWebSocket(client);
    const clientConnection = rpcServer.createWebSocketConnection(webSocket);

    let lsConn: rpcServer.IConnection;
    if (lsPort) {
        const socket = new Socket();
        // Socket connection to the LS
        lsConn = rpcServer.createSocketConnection(socket, socket, () => {
            socket.end();
        });

        logger.info("Forwarding to language server socket.");
        socket.connect(lsPort);
    } else if (lsPath) {
        const args = ["-jar", "-Djava.awt.headless=true", lsPath];
        lsConn = rpcServer.createServerProcess("Language Server", "java", args);

        logger.info("Forwarding to language server process.");
    } else {
        logger.fatal("No options provided to start a language server.");
        logger.fatal("Canceling client request.")
        clientConnection.dispose();
        return () => {
            // empty cleanup
        };
    }

    // Log methods names that are forward between the server and client
    rpcServer.forward(clientConnection, lsConn, logMessage.bind(undefined, logger));

    clientConnection.onClose(() => {
        logger.info("Client closed. Shutting down language server.");
        clientConnection.dispose();
        lsConn.dispose();
    });

    return () => {
        clientConnection.dispose();
        lsConn.dispose();
    };
}

/**
 * Transforms a _fastify-websocket_  {@link WebSocket} object to an {@link IWebSocket}.
 *
 * Inspired by `toWebSocket` in _vscode-ws-jsonrpc_.
 */
function transformWebSocketToIWebSocket(socket: WebSocket): IWebSocket {
    return {
        send: (content) => socket.send(content),
        onMessage: (cb) => (socket.onmessage = (ev) => cb(ev.data)),
        onError: (cb) =>
            (socket.onerror = (ev) => {
                if ("message" in ev) {
                    cb(ev.message);
                }
            }),
        onClose: (cb) => (socket.onclose = (ev) => cb(ev.code, ev.reason)),
        dispose: () => socket.close(),
    };
}

/** Creates a debug log for a forwarded message. */
function logMessage(logger: FastifyLoggerInstance, msg: Message): Message {
    // Sadly, we are unable to identify the direction of the message...
    const methodName: string = (msg as any)?.method ?? "unknown";

    if (methodName.startsWith("diagram/accept")) {
        const actionKind: string = (msg as any)?.params?.action?.kind ?? "unknown";
        logger.debug(`Forwarding "${methodName}" method with action "${actionKind}".`);
        return msg;
    }

    logger.debug(`Forwarding ${methodName} method.`);
    return msg;
}
