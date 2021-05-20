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
import { LanguageClient } from "vscode-languageclient";
import { command } from "./constants";
import { KLighDExtension } from "./klighd-extension";


// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    let extension: KLighDExtension;

    // Command provided for other extensions to register the LS used to generate diagrams with KLighD.
    context.subscriptions.push(
        vscode.commands.registerCommand(command.setLanguageClient, (client: LanguageClient) => {
            // TODO: Check if client is really a LanguageClient. Instanceof checks do not work,
            // since the LanguageClient class from the host extension is not the same as this LanguageClient class.
            // Both classes are part of different bundles and thus module system. Therefore, they are two different
            // classes internally.
            try {
                KLighDExtension.lsClient = client;
                extension = new KLighDExtension(context);

                console.debug("KLighD extension activated.");
            } catch (e) {
                console.error(e);
            }
        })
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
