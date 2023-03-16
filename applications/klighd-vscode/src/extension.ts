/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2022 by
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
// reflect-metadata needs to be imported before anything else to make any code requiring inversify.js to work.
// See https://stackoverflow.com/questions/37534890/inversify-js-reflect-hasownmetadata-is-not-a-function
import "reflect-metadata";
// The other imports.
import { DebugOptions, SetRenderOptionAction } from '@kieler/klighd-core';
import { nanoid } from "nanoid/non-secure";
import { Action, isAction } from "sprotty-protocol";
import * as vscode from "vscode";
import { CommonLanguageClient } from "vscode-languageclient";
import { command } from "./constants";
import { ActionHandlerCallback, KLighDExtension } from "./klighd-extension";
import { KlighdWebviewReopener } from "./klighd-webview-reopener";
import { LspHandler } from "./lsp-handler";
import { ReportChangeMessage } from "./storage/messages";
import { StorageService } from "./storage/storage-service";

// potential exports for other extensions to improve their dev experience
// Currently, this only includes our command string. Requires this extension to be published as a package.
export { command };


export const klighdExtensionCreatedEmitter = new vscode.EventEmitter<KLighDExtension | undefined>()
export const klighdExtensionCreated: vscode.Event<KLighDExtension | undefined> = klighdExtensionCreatedEmitter.event


// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext): void {
    const extensionMap: Map<string, KLighDExtension> = new Map();

    // This extension should persist data in workspace state, so it is different for
    // each project a user opens. To change this, assign another Memento to this constant.
    const mementoForPersistence = context.workspaceState;

    // Command provided for other extensions to register the LS used to generate diagrams with KLighD.
    context.subscriptions.push(
        vscode.commands.registerCommand(
            command.setLanguageClient,
            (client: unknown, fileEndings: unknown) => {
                if (!isLanguageClient(client) || !isFileEndingsArray(fileEndings)) {
                    vscode.window.showErrorMessage(
                        `${command.setLanguageClient} command called with invalid arguments. Please refer to the documentation for reference about the correct usage.`
                    );
                    return;
                }

                try {
                    const storageService = new StorageService(mementoForPersistence, client);

                    // And make sure we register a serializer for our webview type
                    const reopener = new KlighdWebviewReopener(storageService)
                    context.subscriptions.push(
                        klighdExtensionCreated(() => reopener.onExtensionCreated())
                    )
                    const extension = new KLighDExtension(context, {
                        lsClient: client,
                        supportedFileEnding: fileEndings,
                        storageService,
                    });
                    klighdExtensionCreatedEmitter.fire(extension)
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

    // Command for the user to remove all data stored by this extension. Allows
    // the user to reset changed synthesis options etc.
    context.subscriptions.push(
        vscode.commands.registerCommand(command.clearData, () => {
            StorageService.clearAll(mementoForPersistence);
            // webviews are managed by the SprottyExtensions which in return are stored by this extension in a lookup map
            for (const extension of extensionMap.values()) {
                for (const webview of extension.webviews) {
                    webview.sendMessage<ReportChangeMessage>({
                        type: "persistence/reportChange",
                        payload: { type: "clear" },
                    });
                }
            }

            vscode.window.showInformationMessage("Stored data has been deleted.");
        })
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
                        `${command.addActionHandler} command called with invalid arguments. Please refer to the documentation for reference about the correct usage.`
                    );
                    return;
                }

                extension.addActionHandler(kind, actionHandler);
            }
        )
    );

    // Command provided for other extensions to dispatch an action if a webview is open
    context.subscriptions.push(
        vscode.commands.registerCommand(command.dispatchAction, (id: string, action: Action) => {
            const extension = extensionMap.get(id);
            if (!extension) {
                vscode.window.showErrorMessage(
                    `${command.dispatchAction} command called with unknown reference id: ${id}`
                );
                return;
            }

            if (!isAction(action)) {
                vscode.window.showErrorMessage(
                    `${command.addActionHandler} command called with invalid arguments. Please refer to the documentation for reference about the correct usage.`
                );
                return;
            }

            extension.webviews.forEach((webview) => webview.dispatch(action));
        })
    );

    // Command to show debug options.
    context.subscriptions.push(
        vscode.commands.registerCommand(command.debugOptions, () => {
            // All registered extensions should show the debug options.
            for (const id of extensionMap.keys()) {
                vscode.commands.executeCommand(command.dispatchAction, id, SetRenderOptionAction.create(DebugOptions.ID, true))
            }
        })
    );

}

function isLanguageClient(client: unknown): client is CommonLanguageClient {
    // Instanceof checks do not work, since the LanguageClient class from the
    // host extension is not the same as this LanguageClient class.
    // Both classes are part of different bundles and thus module system.
    // Therefore, they are two different classes internally.

    // To work around this, we ensure that it is an object and check the object
    // for the existence of a few methods.

    const wantedMethod = [
        "onReady",
        "sendNotification",
        "onNotification",
        "sendRequest",
        "onRequest",
    ];

    const isObject = typeof client === "object" && client !== null;
    const hasWantedMethods = wantedMethod.every(
        (method) => typeof (client as Record<string, any>)[method] === "function"
    );

    return isObject && hasWantedMethods;
}

function isFileEndingsArray(array: unknown): array is string[] {
    return Array.isArray(array) && array.every((val) => typeof val === "string");
}
