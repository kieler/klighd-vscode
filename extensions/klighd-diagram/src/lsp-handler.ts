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
import { window, TextEdit, workspace, Uri, Range, Position, WorkspaceEdit } from "vscode";
import { LanguageClient, Range as LspRange, Protocol2CodeConverter } from "vscode-languageclient";

/** Handles KLighD specific LSP extensions. */
export class LspHandler {
    constructor(private lsClient: LanguageClient) {
        lsClient.onReady().then(() => {
            lsClient.onNotification("general/sendMessage", this.handleGeneralMessage.bind(this));
            lsClient.onNotification(
                "general/replaceContentInFile",
                this.handleReplaceContentInFile.bind(this)
            );
        });
    }

    /** Handles a message notification from the server for messages that should be displayed to the user. */
    private handleGeneralMessage(message: string, type: "info" | "warn" | "error") {
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
            default:
                window.showInformationMessage(message);
                break;
        }
    }

    /** Handle a edit notification from the server  that should replace the content of a specified file. */
    private async handleReplaceContentInFile(uri: string, code: string, lspRange: LspRange) {
        const textDocument = workspace.textDocuments.find(
            (doc) => doc.uri.toString() === Uri.parse(uri).toString()
        );
        if (!textDocument) {
            console.error(
                `Server requested a text edit but the requested uri was not found among the known documents: ${uri}`
            );
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
        }

        const saved = await textDocument.save();
        if (!saved) {
            console.error(`TextDocument ${textDocument.uri} could not be saved!`);
        }
    }
}
