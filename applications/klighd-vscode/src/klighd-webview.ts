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

import { SetPreferencesAction } from "@kieler/klighd-core";
import { SprottyWebviewOptions } from "sprotty-vscode";
import { SprottyLspWebview } from "sprotty-vscode/lib/lsp";
import { workspace } from "vscode";
import { extensionId } from "./constants";

/**
 * Extends the SprottyLspWebview to communicate user preferences to the container,
 * when a new webview is constructed.
 */
export class KLighDWebview extends SprottyLspWebview {
    // `SprottyWebview` is only able to queue ActionMessages and Sprotty initialization messages.
    // Therefore, we have to use our own queue for custom messages.
    private queuedMessages: any[] = [];

    constructor(options: SprottyWebviewOptions) {
        super(options);

        // Dispatch preferences when the webview is ready. The current configuration
        // should only dispatched initially and not sync the current webview with changes.
        // If this changes in the future, use `workspace.onDidChangeConfiguration`
        // to sync changes that should be updated after initialization.
        this.ready().then(() => {
            this.sendConfiguration();
        });

        // Clear our own message queue every time the webview is visible
        this.disposables.push(
            this.diagramPanel.onDidChangeViewState((event) => {
                if (event.webviewPanel.visible) {
                    this.queuedMessages.forEach((message) => this.sendMessage(message));
                    this.queuedMessages = [];
                }
            })
        );
    }

    private sendConfiguration() {
        const config = workspace.getConfiguration(extensionId);
        this.dispatch(
            new SetPreferencesAction({
                resizeToFit: config.get<boolean>("initialResizeToFit"),
                forceLightBackground: config.get<boolean>("useLightBackground"),
                shouldSelectDiagram: config.get<boolean>("initialShouldSelectDiagram"),
                shouldSelectText: config.get<boolean>("initialShouldSelectText"),
            })
        );
    }

    /**
     * Send an arbitrary message to the webview.
     *
     * Aside: SprottyWebview only sends action messages and webview initialization messages.
     * So we have to build our own mechanism on top.
     */
    sendMessage(msg: unknown): void {
        if (this.diagramPanel.visible) {
            this.diagramPanel.webview.postMessage(msg);
        } else {
            this.queuedMessages.push(msg);
        }
    }

    /** Registers a message listener to handle received messages */
    onMessage(handler: (msg: any) => void): void {
        this.disposables.push(this.diagramPanel.webview.onDidReceiveMessage(handler));
    }
}
