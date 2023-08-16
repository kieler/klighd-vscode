import { TableWebview } from '@kieler/table-webview/lib/table-webview';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
export declare class GraphProperty {
    id: string;
    value: any;
    constructor(id: string, value: any);
}
export declare class GraphPropertiesDataProvider implements vscode.WebviewViewProvider {
    private lsClient;
    readonly context: vscode.ExtensionContext;
    protected view: TableWebview;
    protected props: GraphProperty[];
    protected selectedRow: string;
    constructor(lsClient: LanguageClient, context: vscode.ExtensionContext);
    /**
     * Initializes table
     */
    initTable(): void;
    /**
     * Creates the table webview.
     *
     * @param webviewView The webview.
     * @param context The context.
     * @param token The cancellation token.
     */
    resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void>;
    /**
     * Returns the uri by joining given strings with the extension path.
     * Used to create the script uri for the webview.
     *
     * @param segments Path strings to join with the extension path.
     * @returns A uri.
     */
    getExtensionFileUri(...segments: string[]): vscode.Uri;
    /**
     * Handles what should be done if a row in the table was selected.
     *
     * @param rowId The row id that was clicked.
     */
    clickedRow(rowId: string): void;
}
//# sourceMappingURL=graph-properties-data-provider.d.ts.map