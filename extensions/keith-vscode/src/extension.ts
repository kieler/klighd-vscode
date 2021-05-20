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

import * as vscode from "vscode";
import {
    LanguageClient,
    ServerOptions,
    LanguageClientOptions,
    StreamInfo,
} from "vscode-languageclient";
import { connect, NetConnectOpts, Socket } from "net";

let lsClient: LanguageClient;
let socket: Socket;

/** Lookup map for available commands by the KLighD extension */
const klighd = {
    setLSClient: "klighd-diagram.setLanguageClient",
    showDiagram: "klighd-diagram.diagram.show",
};

// this method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
    const serverOptions: ServerOptions = createServerOptions(context);

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: "file", language: "sctx" }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher("**/*.*"),
        },
    };

    lsClient = new LanguageClient("KIELER Language Server", serverOptions, clientOptions, true);

    // Inform the KLighD extension about the LS client
    await vscode.commands.executeCommand(klighd.setLSClient, lsClient, ["sctx"]);

    console.debug("Starting Language Server...");
    lsClient.start();
}

// this method is called when your extension is deactivated
export function deactivate() {
    // Possible socket connection is not ended together with the lsClient
    // and has to be ended separately, otherwise the LS crashes on the next connection,
    // thus leading to an unpleasing development experience.
    return Promise.all([
        lsClient?.stop(),
        new Promise<void>((resolve) => {
            socket ? socket.end(resolve) : resolve();
        }),
    ]);
}

function createServerOptions(context: vscode.ExtensionContext): ServerOptions {
    // Connect to language server via socket if a port is specified as an env variable
    if (typeof process.env.KEITH_LS_PORT !== "undefined") {
        const connectionInfo: NetConnectOpts = {
            port: parseInt(process.env.KEITH_LS_PORT, 10),
        };
        console.log("Connecting to language server on port: ", connectionInfo.port);

        return async () => {
            socket = connect(connectionInfo);
            const result: StreamInfo = {
                writer: socket,
                reader: socket,
            };
            return result;
        };
    } else {
        console.log("Spawning to language server as a process.");
        const lsPath = context.asAbsolutePath("kieler-language-server.linux.jar");

        return {
            run: { command: "java", args: ["-jar", lsPath] },
            debug: { command: "java", args: ["-jar", lsPath] },
        };
    }
}
