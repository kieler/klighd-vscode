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
// Main entry point to run the webserver directly in node. This is mainly intended
// to be used for development or as a deployable server. For distribution, the
// CLI at keith.ts should be used.

import { createServer } from "./server";
import { join } from "path";
import { getArgValue, parseIntOrUndefined } from "./helpers";

// IIFE to start the server and listen for requests
(async function main() {
  const defaultLSPath = join(__dirname, "../kieler-language-server.linux.jar");

  const lsPort = parseIntOrUndefined(getArgValue("ls_port"));
  const lsPath = getArgValue("ls_path") ?? defaultLSPath;

  const server = createServer({ logging: "debug", lsPort, lsPath });
  try {
    await server.listen(8000);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
})();
