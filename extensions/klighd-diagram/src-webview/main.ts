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

import "reflect-metadata";
import "sprotty-vscode-webview/css/sprotty-vscode.css";
import "sprotty/css/sprotty.css";
import "./main.css";

import { Container } from "inversify";
import {
    SprottyDiagramIdentifier,
    SprottyStarter,
    VscodeDiagramWidget,
    VscodeDiagramWidgetFactory,
} from "sprotty-vscode-webview";
import { DisabledKeyTool } from "sprotty-vscode-webview/lib/disabled-keytool";
import { Connection, createKeithDiagramContainer } from "@kieler/keith-sprotty";
import { MessageConnection } from "./message-connection";
import { KeyTool } from "sprotty";
import { KlighDDiagramWidget } from "./klighd-widget";

export class KLighDSprottyStarter extends SprottyStarter {
    protected createContainer(diagramIdentifier: SprottyDiagramIdentifier): Container {
        const container = createKeithDiagramContainer(diagramIdentifier.clientId);
        container
            .bind(Connection)
            .to(MessageConnection)
            .inSingletonScope();
        return container;
    }

    /**
     * Override the bindings function to not bind a diagram server. We already bind a
     * diagram server in keith-sprotty that communicates over a generic connection.
     */
    protected addVscodeBindings(
        container: Container,
        diagramIdentifier: SprottyDiagramIdentifier
    ): void {
        container
            .bind(VscodeDiagramWidget)
            .toSelf()
            .inSingletonScope();
        container.bind(VscodeDiagramWidgetFactory).toFactory((context) => {
            return () => context.container.get<VscodeDiagramWidget>(VscodeDiagramWidget);
        });
        container.bind(SprottyDiagramIdentifier).toConstantValue(diagramIdentifier);
        container.rebind(KeyTool).to(DisabledKeyTool);

        this.addCustomBindings(container);
    }

    protected addCustomBindings(container: Container) {
        container.rebind(VscodeDiagramWidget).to(KlighDDiagramWidget);
    }
}

// Instantiate Starter if this file is used in a webview
new KLighDSprottyStarter();
