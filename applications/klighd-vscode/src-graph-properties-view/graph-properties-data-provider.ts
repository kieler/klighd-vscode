// @ts-nocheck
import { TableWebview } from '@kieler/table-webview/lib/table-webview'
import * as path from 'path'
import * as vscode from 'vscode'
import { LanguageClient } from 'vscode-languageclient'


export class GraphProperty {
    id: string

    value: any

    constructor(id: string, value: any) {
        this.id = id
        this.value = value
    }
}

export class GraphPropertiesDataProvider implements vscode.WebviewViewProvider {
    protected view: TableWebview

    protected props: GraphProperty[]

    protected selectedRow: string

    constructor(private lsClient: LanguageClient, readonly context: vscode.ExtensionContext) {}

    /**
     * Initializes table
     */
    public initTable() {
        this.view.reset()
        if (this.props) {
            this.props.forEach((entry: any) => {
                this.view.addRow(entry.id, { cssClass: '', value: entry.id }, { cssClass: '', value: entry.value })
            })
        }
    }

    /**
     * Creates the table webview.
     *
     * @param webviewView The webview.
     * @param context The context.
     * @param token The cancellation token.
     */
    resolveWebviewView(webviewView: vscode.WebviewView): void | Thenable<void> {
        // initialize webview
        const table = new TableWebview(
            'Graph Property View',
            [this.getExtensionFileUri('dist')],
            this.getExtensionFileUri('dist', 'graph-properties-webview.js')
        )
        table.webview = webviewView.webview
        table.webview.options = {
            enableScripts: true,
        }

        // title and table headers
        const title = table.getTitle()
        webviewView.title = title
        table.initializeWebview(webviewView.webview, title, ['Name', 'Value'])
        this.view = table

        // Subscriptions
        this.context.subscriptions.push(
            this.view.cellClicked((cell: { rowId: string; columnId: string } | undefined) => {
                if (cell && cell.rowId) {
                    this.clickedRow(cell.rowId)
                }
            })
        )

        this.view.initialized(() => {
            this.initTable()
        })
    }

    /**
     * Returns the uri by joining given strings with the extension path.
     * Used to create the script uri for the webview.
     *
     * @param segments Path strings to join with the extension path.
     * @returns A uri.
     */
    getExtensionFileUri(...segments: string[]): vscode.Uri {
        return vscode.Uri.file(path.join(this.context.extensionPath, ...segments))
    }

    /**
     * Handles what should be done if a row in the table was selected.
     *
     * @param rowId The row id that was clicked.
     */
    clickedRow(rowId: string): void {
        this.selectedRow = rowId
    }
}
