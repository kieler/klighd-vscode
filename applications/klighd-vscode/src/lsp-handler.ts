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
import { viewportFeature } from "sprotty";
import { VscodeDiagramServer } from "sprotty-vscode-webview";
import { VsCodeApi } from "sprotty-vscode-webview/lib/services";
import { window, TextEdit, workspace, Uri, WorkspaceEdit, commands } from "vscode";
import { CommonLanguageClient, Range as LspRange } from "vscode-languageclient";

/** Handles KLighD specific LSP extensions. */
export class LspHandler {
    private lastEditSuccessful: boolean;

    constructor(private lsClient: CommonLanguageClient) {
        lsClient.onReady().then(() => {
            lsClient.onNotification("general/sendMessage", this.handleGeneralMessage.bind(this));
            lsClient.onNotification(
                "general/replaceContentInFile",
                this.handleReplaceContentInFile.bind(this)
            );
        });

        this.lastEditSuccessful = true;
    }

    /** Handles a message notification from the server for messages that should be displayed to the user. */
    private handleGeneralMessage(message: string, type: "info" | "warn" | "error" | "switchEditor") {
        switch (type) {
            case "info":
                window.showInformationMessage(message);
                break;
            case "warn":
                window.showWarningMessage(message);
                break;
            case "error":
                window.showErrorMessage(message);
                break;
            case "switchEditor":
                commands.executeCommand("workbench.action.focusPreviousGroup")
                break;
            default:
                window.showInformationMessage(message);
                break;
        }
    }

    /** Handle a edit notification from the server that should replace the content of a specified file. */
    private async handleReplaceContentInFile(uri: string, code: string, lspRange: LspRange) {
        const textDocument = workspace.textDocuments.find(
            (doc) => doc.uri.toString() === Uri.parse(uri).toString()
        );
        if (!textDocument) {
            console.error(
                `Server requested a text edit but the requested uri was not found among the known documents: ${uri}`
            );

            // Show a warning to the user, but only show it once per "stream of failed edits"
            if (this.lastEditSuccessful) {
                this.lastEditSuccessful = false;
                window.showWarningMessage(
                    "Changes can not be saved because the effected document is unknown. Make sure that the document is open so your changes can be saved."
                );
            }
            return;
        }

        const range = this.lsClient.protocol2CodeConverter.asRange(lspRange);
        const workSpaceEdit = new WorkspaceEdit();

        const edits: TextEdit[] = [TextEdit.replace(range, code)];
        workSpaceEdit.set(textDocument.uri, edits);

        // Apply and save the edit. Report possible failures.
        const edited = await workspace.applyEdit(workSpaceEdit);
        if (!edited) {
            console.error("Workspace edit could not be applied!");
            return;
        }

        const saved = await textDocument.save();
        if (!saved) {
            console.error(`TextDocument ${textDocument.uri} could not be saved!`);
            return;
        }

        this.lastEditSuccessful = true;
    }
}
