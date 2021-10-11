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
// Distributable CLI script that starts a standalone diagram view and provides a
// link to view the diagram for a given file.

import { Command } from "commander";
import getPort from "get-port";
import openUrl from "open";
import { pathToFileURL } from "url";
import { parseIntOrUndefined } from "./helpers";
import { createServer } from "./server";
import { VERSION } from "./version";

const setupInformation = `
Alternatively, the path to a language server jar can be configured with the
environment variable LS_PATH. The path option takes precedence over the environment
variable. If both a path and a port for a language server is provided, the webserver
will use the port to connect to the listening language server.

Example calls:
  $ ${process.title} --ls_port 5007 ./ABRO.sctx
  $ ${process.title} --ls_path ../language-server.jar ./example.elkt
  $ ${process.title} serve -p 8000
`;

const program = new Command(process.title);

program
    .version(VERSION)
    .description(
        "Starts a web server to view a KLighD synthesized diagram.\nThe KLighD synthesis must be provided by a separate language server."
    )
    .addHelpText("after", setupInformation)
    .configureHelp({ sortOptions: true, sortSubcommands: true });

// Global options
program
    .option("--ls_port <port>", "port used to connect to a language server")
    .option("--ls_path <path>", "path to a language server jar")
    .option("-p, --port <port>", "port used for the diagram-view server");

const serve = new Command("serve")
    .description("start the diagram-view server without any specific file")
    .action(async () => {
        // The global options only exists on the program object and not on the program passed in as the last argument.
        // In case these Commands are refactored into another file, a factory function must be used to receive the "original program".
        const port = parseIntOrUndefined(program.opts().port);
        const [lsPath, lsPort] = getLanguageServerAccess(program);

        try {
            const finalPort = await findPort(port);
            const server = createServer({ logging: "error", lsPort, lsPath });

            const url = await server.listen(finalPort);

            // Minimal CLI output so it is still understandable but also parsable in scripts.
            console.log("Server listening at:", url);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

const open = new Command("open")
    .description("start and open a diagram view for the given file")
    .arguments("<file>")
    .option("--clear", "clear persisted data")
    .option("--no-fit", "do not resize the diagram to fit the viewport")
    .action(async (file, options) => {
        // The global options only exists on the program object and not on the program passed in as the last argument.
        // In case these Commands are refactored into another file, a factory function must be used to receive the "original program".
        const port = parseIntOrUndefined(program.opts().port);
        const [lsPath, lsPort] = getLanguageServerAccess(program);

        // options.fit is true when the --no-fit flag is absent.
        // See https://www.npmjs.com/package/commander#other-option-types-negatable-boolean-and-booleanvalue
        // Local command options
        const resizeToFit = options.fit;
        const clearData = options.clear;

        // Default resizeToFit behavior is true. So the param is only added when it should be disabled
        const preferences = `${!resizeToFit ? "&resizeToFit=false" : ""}${
            clearData ? "&clearData=true" : ""
        }`;

        try {
            const fileUrl = pathToFileURL(file);
            const finalPort = await findPort(port);
            const server = createServer({ logging: "warn", lsPort, lsPath });

            const addr = await server.listen(finalPort);
            const url = `${addr}?source=${fileUrl}${preferences}`;

            console.log("\n==============================\n");
            console.log("KLighD Diagram Viewer\n");
            console.log("Inspect your diagram at:");
            console.log(url);
            console.log("\n==============================\n");

            openUrl(url);
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    });

// Add commands
program.addCommand(serve);
program.addCommand(open, { isDefault: true });

program.parse(process.argv);

////////////////////////////////////////////////////////////////////////////////
// Helper Functions

/** Returns an available ports. A provided port overwrites the result regardless of whether or not it is available. */
async function findPort(port?: number): Promise<number> {
    return port ?? (await getPort({ port: [7000, 7001, 7002, 7003, 7004, 7005] }));
}

/** Ensures that either a path or port is specified for the LS. Reads the options from the global options. */
function getLanguageServerAccess(
    global: typeof program
): [path: string | undefined, port: number | undefined] {
    // A path to a language can be configured by an environment variable.
    // The lsp_path option for the command takes a higher preference.
    const lsPath: string | undefined = global.opts().ls_path ?? process.env.LS_PATH;
    const lsPort = parseIntOrUndefined(global.opts().ls_port);

    // Fail fast if no possible LS connection is provided
    if (!lsPath && !lsPort) {
        console.error(
            "Please provide either a path to a language server jar or a port for a listening language server!\n"
        );
        global.help({ error: true });
    }

    return [lsPath, lsPort];
}
