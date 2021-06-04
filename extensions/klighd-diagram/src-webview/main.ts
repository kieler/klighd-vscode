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
import "./main.css";
import "@kieler/keith-sprotty/styles/main.css";

import { Container } from "inversify";
import {
    SprottyDiagramIdentifier,
    SprottyStarter,
    VscodeDiagramWidget,
    VscodeDiagramWidgetFactory,
} from "sprotty-vscode-webview";
import { DisabledKeyTool } from "sprotty-vscode-webview/lib/disabled-keytool";
import { Connection, createKeithDiagramContainer, SessionStorage } from "@kieler/keith-sprotty";
import { MessageConnection } from "./message-connection";
import { ActionMessage, isActionMessage, KeyTool } from "sprotty";
import { KlighDDiagramWidget } from "./klighd-widget";

export class KLighDSprottyStarter extends SprottyStarter {
    // SprottyStarter creates the container after a diagram identifier is received.
    // Thus our message connection only receives and send messages to the container,
    // after the identifier message is received. However, the KLighD extension
    // tries to send messages (e.g. set preferences) to the container before the identifier is received.
    // The extension has no save way to ensure that a message is only send after the identifier in sprotty-vscode.
    // Therefore, we capture all ActionMessages from the extension until the container is ready to receive them.
    private queuedActionMessages: ActionMessage[] = [];

    constructor() {
        super();
        window.addEventListener("message", this.queueActionMessage);
    }

    private queueActionMessage = (message: any) => {
        if ("data" in message && isActionMessage(message.data)) {
            this.queuedActionMessages.push(message.data);
        }
    };

    private replayCapturedActionMessages() {
        window.removeEventListener("message", this.queueActionMessage);
        for (const action of this.queuedActionMessages) {
            window.postMessage(action, window.origin);
        }
        this.queuedActionMessages = [];
    }

    protected createContainer(diagramIdentifier: SprottyDiagramIdentifier): Container {
        const container = createKeithDiagramContainer(diagramIdentifier.clientId);
        container.bind(SessionStorage).toConstantValue(sessionStorage);
        container
            .bind(Connection)
            .to(MessageConnection)
            .inSingletonScope();

        // Send stored actions to the container, which is no able to receive them
        this.replayCapturedActionMessages();

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
