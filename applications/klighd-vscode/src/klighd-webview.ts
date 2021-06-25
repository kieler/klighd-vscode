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

import { SetPreferencesAction } from "klighd-core";
import { SprottyWebviewOptions } from "sprotty-vscode";
import { SprottyLspWebview } from "sprotty-vscode/lib/lsp";
import { workspace } from "vscode";
import { extensionId } from "./constants";

/**
 * Extends the SprottyLspWebview to communicate user preferences to the container,
 * when a new webview is constructed.
 */
export class KLighDWebview extends SprottyLspWebview {
    constructor(options: SprottyWebviewOptions) {
        super(options);

        // Dispatch preferences when the webview is ready. The current configuration
        // should only dispatched initially and not sync the current webview with changes.
        // If this changes in the future, use `workspace.onDidChangeConfiguration`
        // to sync changes that should be updated after initialization.
        this.ready().then(() => {
            this.sendConfiguration();
        });
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
}
