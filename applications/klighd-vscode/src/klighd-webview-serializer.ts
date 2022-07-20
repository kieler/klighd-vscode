/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

import * as path from 'path';
import { SprottyDiagramIdentifier } from "sprotty-vscode";
import { commands, ExtensionContext, Uri, WebviewPanel, WebviewPanelSerializer } from "vscode";
import { command } from "./constants";


export class KlighdWebviewSerializer implements WebviewPanelSerializer {

    state: SprottyDiagramIdentifier | undefined

    webviewPanel: WebviewPanel | undefined

    context: ExtensionContext

    constructor(context: ExtensionContext) {
        this.context = context
    }

    async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: SprottyDiagramIdentifier): Promise<void> {
        this.state = state
        this.webviewPanel = webviewPanel

        webviewPanel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, height=device-height">
                    <title>${state.uri.substring(state.uri.lastIndexOf('/') + 1)}</title>
                    <link
                        rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css"
                        integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/"
                        crossorigin="anonymous">
                </head>
                <body>
                    <div id="${state.clientId}_container" style="height: 100%;"></div>
                    <div>krlktrjtktjkret</div>
                    <script src="${
                        webviewPanel.webview.asWebviewUri(
                            Uri.file(path.join(this.context.extensionPath, 'dist', 'webview.js'))).toString()}"></script>
                </body>
            </html>`;
    }

    onExtensionCreated(): void {
        commands.executeCommand(command.diagramRefresh)
    }

}