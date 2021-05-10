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

interface SetupOptions {
  /** Activate logging with the given level if this property is defined. */
  logging?: "info" | "debug";

  lsPort?: number;
  lsPath?: string;
}

export function createServer(opts: SetupOptions) {
  const server = fastify({
    logger: opts.logging
      ? { prettyPrint: true, level: opts.logging }
      : undefined,
    disableRequestLogging: true,
  });

  // Register ecosystem plugins
  server.register(websocketPlugin);
  server.register(staticPlugin, {
    // Web sources are bundled into the dist folder at the package root
    root: join(__dirname, "../dist"),
  });

  // Setup WebSocket handler
  server.get("/socket", { websocket: true }, (conn) => {
    // Connection established. Spawn a LS for the connection and stream messages
    connectToLanguageServer(conn.socket, server.log, opts.lsPort, opts.lsPath);
  });

  return server;
}
