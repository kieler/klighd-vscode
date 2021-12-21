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
import { SprottyDiagramIdentifier, SprottyWebviewOptions } from "sprotty-vscode";
import { SprottyLspWebview } from "sprotty-vscode/lib/lsp";
import { workspace, commands } from "vscode";
import { extensionId, contextKeys } from "./constants";

/**
 * Extends the SprottyLspWebview to communicate user preferences to the container,
 * when a new webview is constructed.
 */
export class KLighDWebview extends SprottyLspWebview {
    /** Controls whether the diagram view updates after the active editor changes. */
    private syncWithEditor!: boolean;
    /**
     * Diagram Identifier that stays synced with the editor even when "sync with editor"
     * is disabled.
     */
    private trackedIdentifier: SprottyDiagramIdentifier;
    
    // `SprottyWebview` is only able to queue ActionMessages and Sprotty initialization messages.
    // Therefore, we have to use our own queue for custom messages.
    private queuedMessages: any[] = [];

    constructor(options: SprottyWebviewOptions) {
        super(options);

        this.trackedIdentifier = options.identifier;
        this.setSyncWithEditor(true);

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

    /**
     * Function is called with a new identier every time the active text editor changes.
     * We keep track of the editor that us supposed to be displayed and only reload the
     * content if "sync with editor" is enabled.
     */
    override async reloadContent(newId: SprottyDiagramIdentifier): Promise<void> {
        this.trackedIdentifier = newId;
        if (!this.syncWithEditor) return;
        super.reloadContent(newId);
    }

    /**
     * Proxy to reload the diagram view content while ignoring the "sync with editor" option.
     * The open diagram command should use this function, so the user is able to change
     * the webview focus even if "sync with editor" is disabled.
     * */
    async forceReloadContent(newId: SprottyDiagramIdentifier): Promise<void> {
        this.trackedIdentifier = newId;
        super.reloadContent(newId);
    }

    private sendConfiguration() {
        const config = workspace.getConfiguration(extensionId);
        this.dispatch(
            SetPreferencesAction.create({
                resizeToFit: config.get<boolean>("initialResizeToFit"),
                forceLightBackground: config.get<boolean>("useLightBackground"),
                shouldSelectDiagram: config.get<boolean>("initialShouldSelectDiagram"),
                shouldSelectText: config.get<boolean>("initialShouldSelectText"),
                incrementalDiagramGenerator: config.get<boolean>("initialIncrementalDiagramGenerator"),
            })
        );
    }

    /** Changes the behavior of "sync with editor". If disabled, the diagram view will not update when the active editor changes. */
    setSyncWithEditor(sync: boolean): void {
        this.syncWithEditor = sync;
        commands.executeCommand("setContext", contextKeys.syncWithEditor, sync);

        // Prevents a "multi model request" by ensuring that the diagram view displays the active editor when the option is changes.
        // Want to know, what a "multi model request" is?
        // 1. Disable the next line
        // 2. Open a diagram view for an editor and toggle sync with editor off
        // 3. Change the active editor and toggle sync with editor on
        // 4. Go back to the first editor. The diagram model will be requested four times. _WHO KNOWS WHY..._
        this.reloadContent(this.trackedIdentifier);
    }

    /**
     * Send an arbitrary message to the webview.
     *
     * Aside: SprottyWebview only sends action messages and webview initialization messages.
     * So we have to build our own mechanism on top.
     */
    sendMessage<T>(msg: T): void {
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
