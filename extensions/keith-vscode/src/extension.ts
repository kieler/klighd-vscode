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
import { KeithErrorHandler } from "./error-handler";

let lsClient: LanguageClient;
let socket: Socket;

/** Lookup map for available commands by the KLighD extension that this extension uses */
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

    // Setup basic connection error reporting
    const defaultErrorHandler = lsClient.createDefaultErrorHandler();
    lsClient.clientOptions.errorHandler = new KeithErrorHandler(defaultErrorHandler);

    // Inform the KLighD extension about the LS client and supported file endings
    vscode.commands.executeCommand(klighd.setLSClient, lsClient, [
        "sctx",
        "elkt",
        "kgt",
        "kviz",
        "strl",
        "lus",
    ]);

    console.debug("Starting Language Server...");
    lsClient.start();
}

// this method is called when your extension is deactivated
export function deactivate() {
    return new Promise<void>((resolve) => {
        if (socket) {
            // Don't call lsClient.stop when we are connected via socket for development.
            // That call will end the LS server, leading to a bad dev experience.
            socket.end(resolve);
            return;
        }
        lsClient?.stop().then(resolve);
    });
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
        const lsPath = context.asAbsolutePath("server/kieler-language-server.linux.jar");

        return {
            run: { command: "java", args: ["-jar", lsPath] },
            debug: { command: "java", args: ["-jar", lsPath] },
        };
    }
}
