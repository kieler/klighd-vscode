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

import { ServerStatusAction } from "sprotty";
import { VscodeDiagramWidget } from "sprotty-vscode-webview";
import { requestModel } from "klighd-core";

/**
 * Overwrite the VSCodeDiagramWidget to dispatch a RequestModelAction instead
 * of requesting it.
 *
 * This is inline with the behavior of KLighD, where the LS expects an
 * requestModel notification instead of an request and produces a warning otherwise.
 */
export class KlighdDiagramWidget extends VscodeDiagramWidget {
    override async requestModel(): Promise<void> {
        try {
            await requestModel(this.actionDispatcher, this.diagramIdentifier.uri);
        } catch (err) {
            const status = new ServerStatusAction();
            status.message = err instanceof Error ? err.message : err.toString();
            status.severity = "FATAL";
            this.setStatus(status);
        }
    }
}
