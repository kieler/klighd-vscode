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

import { requestModel } from "@kieler/klighd-core";
import { ServerStatusAction } from "sprotty";
import { VscodeDiagramWidget } from "sprotty-vscode-webview";
import { vscodeApi } from "sprotty-vscode-webview/lib/vscode-api";

/**
 * Overwrite the {@link VscodeDiagramWidget} to dispatch a RequestModelAction instead
 * of requesting it.
 *
 * This is inline with the behavior of KLighD, where the LS expects an
 * requestModel notification instead of an request and produces a warning otherwise.
 */
export class KlighdDiagramWidget extends VscodeDiagramWidget {
    override async requestModel(): Promise<void> {
        try {
            await requestModel(this.actionDispatcher, this.diagramIdentifier.uri);
            vscodeApi.setState(this.diagramIdentifier)
        } catch (err) {
            const status = new ServerStatusAction();
            status.message = err instanceof Error ? err.message : (err as any).toString();
            status.severity = "FATAL";
            this.setStatus(status);
            vscodeApi.setState(undefined)
        }
    }

    onDisposeWidget(): void {
        vscodeApi.setState(undefined)
    }
}
