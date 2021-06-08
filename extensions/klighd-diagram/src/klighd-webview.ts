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

import { SetPreferencesAction } from "@kieler/keith-sprotty";
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

        // Dispatch preferences when the webview is ready. Notice, that the
        // preference are still dispatched before the diagram identifier is send
        // to the webview. There appears to be no possibility to ensure that the
        // message is only send after the identifier in vscode-sprotty.
        // This requires some special handling in the webview, as the container only receives
        // messages after the diagram identifier is send. See src-webview/main.ts
        this.ready().then(() => {
            this.sendConfiguration();

            workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration(extensionId)) {
                    this.sendConfiguration();
                }
            });
        });
    }

    private sendConfiguration() {
        const config = workspace.getConfiguration(extensionId);
        this.dispatch(
            new SetPreferencesAction({
                resizeToFit: config.get<boolean>("resizeToFit") ?? true,
            })
        );
    }
}
