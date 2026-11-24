/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2026 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 * + and Scheidt & Bachmann System Technik GmbH, 24109 Melsdorf
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'net'
import { Message } from 'vscode-jsonrpc'
import { IConnection, IWebSocket } from 'vscode-ws-jsonrpc'
import * as rpcServer from 'vscode-ws-jsonrpc/server'
// _@fastify/websocket_ typing for their socket object. _ws_ is a dependency of _@fastify/websocket_.
import type { WebSocket } from 'ws'

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
    logger: FastifyBaseLogger,
    lsPort?: number,
    lsPath?: string
): () => void {
    const webSocket = transformWebSocketToIWebSocket(client)
    const clientConnection = rpcServer.createWebSocketConnection(webSocket)

    let lsConn: IConnection | undefined
    if (lsPort) {
        const socket = new Socket()
        // Socket connection to the LS
        lsConn = rpcServer.createSocketConnection(socket, socket, () => {
            socket.end()
        })

        logger.info('Forwarding to language server socket.')
        socket.connect(lsPort)
    } else if (lsPath) {
        const args = ['-jar', '-Djava.awt.headless=true', lsPath]
        lsConn = rpcServer.createServerProcess('Language Server', 'java', args)

        logger.info('Forwarding to language server process.')
    }

    if (!lsConn) {
        logger.fatal('No options provided to start a language server.')
        logger.fatal('Canceling client request.')
        clientConnection.dispose()
        return () => {
            // empty cleanup
        }
    }
    const lsConnection = lsConn

    // Log methods names that are forward between the server and client
    rpcServer.forward(clientConnection, lsConnection, logMessage.bind(undefined, logger))

    clientConnection.onClose(() => {
        logger.info('Client closed. Shutting down language server.')
        clientConnection.dispose()
        lsConnection.dispose()
    })

    return () => {
        clientConnection.dispose()
        lsConnection.dispose()
    }
}

/**
 * Transforms a _@fastify/websocket_  {@link WebSocket} object to an {@link IWebSocket}.
 *
 * Inspired by `toSocket` in _vscode-ws-jsonrpc_.
 */
function transformWebSocketToIWebSocket(socket: WebSocket): IWebSocket {
    return {
        $type: 'IWebSocket',
        send: (content) => socket.send(content),
        // eslint-disable-next-line no-return-assign
        onMessage: (cb) => (socket.onmessage = (ev) => cb(ev.data)),
        // eslint-disable-next-line no-return-assign
        onError: (cb) =>
            (socket.onerror = (ev) => {
                if ('message' in ev) {
                    cb(ev.message)
                }
            }),
        // eslint-disable-next-line no-return-assign
        onClose: (cb) => (socket.onclose = (ev) => cb(ev.code, ev.reason)),
        dispose: () => socket.close(),
    }
}

/** Creates a debug log for a forwarded message. */
function logMessage(logger: FastifyBaseLogger, msg: Message): Message {
    // Sadly, we are unable to identify the direction of the message...
    const methodName: string = (msg as any)?.method ?? 'unknown'

    if (methodName.startsWith('diagram/accept')) {
        const actionKind: string = (msg as any)?.params?.action?.kind ?? 'unknown'
        logger.debug(`Forwarding "${methodName}" method with action "${actionKind}".`)
        return msg
    }

    logger.debug(`Forwarding ${methodName} method.`)
    return msg
}
