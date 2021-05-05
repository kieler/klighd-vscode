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

import { fastify } from "fastify";
import staticPlugin from "fastify-static";
import websocketPlugin from "fastify-websocket";
import { join } from "path";
import { connectToLanguageServer } from "./ls-connection";

const server = fastify({
  logger: { prettyPrint: true, level: "info" },
  disableRequestLogging: true,
});

// Register ecosystem plugins
server.register(websocketPlugin);
server.register(staticPlugin, {
  // TODO: (cfr) Improve pathing to be more flexible
  root: join(__dirname, "../dist"),
});

// Setup WebSocket handler
server.get("/socket", { websocket: true }, (conn) => {
  // Connection established. Spawn a LS for the connection and stream messages
  connectToLanguageServer(conn.socket, server.log);
});

// IIFE to start the server and listen for requests
(async function main() {
  try {
    await server.listen(8000);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
})();
