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
import { IWebSocket } from "vscode-ws-jsonrpc";
import * as rpcServer from "vscode-ws-jsonrpc/lib/server";
// _fastify-websocket_ typing for their conn.socket object. _ws_ is a dependency of _fastify-websocket_.
import * as WebSocket from "ws";

/**
 * Creates a connection to the language server. If the process is started with
 * an --LS_PORT argument, a socket connection is created using that port.
 * Otherwise, the language server is started as a subprocess.
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

        rpcServer.forward(clientConnection, lsConn, (msg) => {
            logger.debug(msg, "Forwarding message");
            return msg;
        });

        logger.info("Forwarding to language server socket.");
        socket.connect(lsPort);
    } else if (lsPath) {
        const args = ["-jar", "-Djava.awt.headless=true", lsPath];
        lsConn = rpcServer.createServerProcess("Language Server", "java", args);

        rpcServer.forward(clientConnection, lsConn, (msg) => {
            logger.debug(msg, "Forwarding message");
            return msg;
        });

        logger.info("Forwarding to language server process.");
    } else {
        logger.error("No options provided to start a language server.");
    }

    webSocket.onClose(() => {
        logger.info("Client closed. Shutting down language server.");
        lsConn.dispose();
    });

    return () => {
        clientConnection.dispose();
        lsConn.dispose();
    };
}

/**
 * Transforms a _fastify-websocket_ `WebSocket` object to an `IWebSocket`.
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
