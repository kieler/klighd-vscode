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
import "reflect-metadata";
import { nanoid } from "nanoid/non-secure";
import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient";
import { command } from "./constants";
import { ActionHandlerCallback, KLighDExtension } from "./klighd-extension";
import { LspHandler } from "./lsp-handler";

// potential exports for other extensions to improve their dev experience
// Currently, this only includes our command string. Requires this extension to be published as a package.
export { command };

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext): void {
    const extensionMap: Map<string, KLighDExtension> = new Map();

    // Command provided for other extensions to register the LS used to generate diagrams with KLighD.
    context.subscriptions.push(
        vscode.commands.registerCommand(
            command.setLanguageClient,
            (client: LanguageClient, fileEndings: any) => {
                // TODO: Check if client is really a LanguageClient. Instanceof checks do not work,
                // since the LanguageClient class from the host extension is not the same as this LanguageClient class.
                // Both classes are part of different bundles and thus module system. Therefore, they are two different
                // classes internally.
                if (!isFileEndingsArray(fileEndings)) {
                    vscode.window.showErrorMessage(
                        "setLanguageClient must be executed with an array of supported file endings as the second argument."
                    );
                    return;
                }

                try {
                    const extension = new KLighDExtension(context, {
                        lsClient: client,
                        supportedFileEnding: fileEndings,
                    });
                    // Handle notifications that are KLighD specific extensions of the LSP for this LSClient.
                    new LspHandler(client);

                    // Uses nanoid (non-secure) to quickly generate a random id with low collision probability
                    const id = nanoid(16);
                    extensionMap.set(id, extension);

                    return id;
                } catch (e) {
                    console.error(e);
                    throw e;
                }
            }
        )
    );

    // Command provided for other extensions to add an action handler to their created diagram extension instance.
    context.subscriptions.push(
        vscode.commands.registerCommand(
            command.addActionHandler,
            (id: string, kind: string, actionHandler: ActionHandlerCallback) => {
                const extension = extensionMap.get(id);
                if (!extension) {
                    vscode.window.showErrorMessage(
                        `${command.addActionHandler} command called with unknown reference id: ${id}`
                    );
                    return;
                }

                if (typeof kind !== "string" || typeof actionHandler !== "function") {
                    vscode.window.showErrorMessage(
                        "AddActionHandler command called with invalid arguments. Please refer to the documentation for reference about the correct usage."
                    );
                }

                extension.addActionHandler(kind, actionHandler);
            }
        )
    );
}

function isFileEndingsArray(array: unknown): array is string[] {
    return Array.isArray(array) && array.every((val) => typeof val === "string");
}
