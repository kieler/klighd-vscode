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
import { join } from "path";
import {
  IWebSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from "vscode-ws-jsonrpc";
import {
  createConnection,
  createServerProcess,
  createSocketConnection,
  forward,
  IConnection,
} from "vscode-ws-jsonrpc/lib/server";
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
  websocket: WebSocket,
  logger: FastifyLoggerInstance
): () => void {
  const socket = transformWebSocketToIWebSocket(websocket);
  const reader = new WebSocketMessageReader(socket);
  const writer = new WebSocketMessageWriter(socket);
  // Socket connection to the client
  const socketConn = createConnection(reader, writer, () => {
    socket.dispose();
  });

  const lsPort = getPort();
  let lsConn: IConnection;
  if (lsPort) {
    const socket = new Socket();
    // Socket connection to the LS
    lsConn = createSocketConnection(socket, socket, () => {
      socket.destroy();
    });

    forward(socketConn, lsConn, (msg) => {
      logger.debug(msg, "Forwarding message");
      return msg;
    });
    socket.connect(lsPort);
  } else {
    // TODO: (cfr) Use a more flexible pathing
    const lsPath = join(__dirname, "../kieler-language-server.linux.jar");
    let args = ["-jar", "-Djava.awt.headless=true", lsPath];
    lsConn = createServerProcess("Language Server", "java", args);

    forward(socketConn, lsConn, (msg) => {
      logger.debug(msg, "Forwarding message");
      return msg;
    });
  }

  return () => {
    socketConn.dispose();
    lsConn.dispose();
  };
}

function getPort(): number | undefined {
  let arg = process.argv.filter((arg) => arg.startsWith("--LSP_PORT="))[0];
  if (!arg) {
    return undefined;
  } else {
    return Number.parseInt(arg.substring("--LSP_PORT=".length), 10);
  }
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
          cb((ev as any).message);
        }
      }),
    onClose: (cb) => (socket.onclose = (ev) => cb(ev.code, ev.reason)),
    dispose: () => socket.close(),
  };
}
