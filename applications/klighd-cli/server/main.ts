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
// Main entry point to run the webserver directly in node. This is mainly intended
// to be used for development or as a deployable server. For distribution, the
// CLI at klighd.ts should be used.

import { createServer } from "./server";
import { join } from "path";
import { getArgValue, parseIntOrUndefined } from "./helpers";

// IIFE to start the server and listen for requests
(async function main() {
    const defaultLSPath = join(__dirname, `../language-server.jar`);

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
