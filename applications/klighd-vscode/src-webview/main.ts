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

import "reflect-metadata";
// Load styles to make the diagram pretty
import "@kieler/klighd-core/styles/main.css";
import "sprotty-vscode-webview/css/sprotty-vscode.css";
import "./main.css";

import { bindServices, createKlighdDiagramContainer } from "@kieler/klighd-core";
import { Container } from "inversify";
import { KeyTool } from "sprotty";
import { ActionMessage, isActionMessage } from "sprotty-protocol";
import {
    SprottyDiagramIdentifier,
    SprottyStarter,
    VscodeDiagramWidget,
    VscodeDiagramWidgetFactory
} from "sprotty-vscode-webview";
import { DisabledKeyTool } from "sprotty-vscode-webview/lib/disabled-keytool";
import { VsCodeApi } from "sprotty-vscode-webview/lib/services";
import { KlighdDiagramWidget } from "./klighd-widget";
import { MessageConnection } from "./message-connection";
import { MessagePersistenceStorage } from "./persistence-storage";

/** Uses `klighd-core` and {@link SprottyStarter} to create a diagram container in a webview. */
export class KLighDSprottyStarter extends SprottyStarter {
    // SprottyStarter creates the container after a diagram identifier is received.
    // Thus our message connection only receives and sends messages to the container,
    // after the identifier message is received. However, the KLighD extension
    // tries to send messages (e.g. set preferences) to the container before the identifier is received.
    // The extension has no save way to ensure that a message is only send after the identifier in sprotty-vscode.
    // Therefore, we capture all ActionMessages from the extension until the container is ready to receive them.
    private queuedActionMessages: ActionMessage[] = [];

    constructor() {
        super();
        window.addEventListener("message", this.queueActionMessage);
    }

    /** Queues an action message to be replayed for the diagram container */
    private queueActionMessage = (message: any) => {
        if ("data" in message && isActionMessage(message.data)) {
            this.queuedActionMessages.push(message.data);
        }
    };

    /**
     * Replay stored action messages for the diagram container. Empties the message queue.
     * Further, stops the starter form storing more messages.
     */
    private replayCapturedActionMessages() {
        window.removeEventListener("message", this.queueActionMessage);
        for (const action of this.queuedActionMessages) {
            window.postMessage(action, window.origin);
        }
        this.queuedActionMessages = [];
    }

    protected override createContainer(diagramIdentifier: SprottyDiagramIdentifier): Container {
        const connection = new MessageConnection(this.vscodeApi);
        const persistenceStorage = new MessagePersistenceStorage(this.vscodeApi);
        const container = createKlighdDiagramContainer(diagramIdentifier.clientId);
        bindServices(container, { connection, sessionStorage, persistenceStorage });

        // Send stored actions to the container, which is no able to receive them
        this.replayCapturedActionMessages();

        return container;
    }

    /**
     * Override the bindings function to not bind a diagram server. We already bind a
     * diagram server in klighd-core that communicates over an abstract connection.
     */
    protected override addVscodeBindings(
        container: Container,
        diagramIdentifier: SprottyDiagramIdentifier
    ): void {
        container.bind(VsCodeApi).toConstantValue(this.vscodeApi)
        container.bind(VscodeDiagramWidget).toSelf().inSingletonScope();
        container.bind(VscodeDiagramWidgetFactory).toFactory((context) => {
            return () => context.container.get<VscodeDiagramWidget>(VscodeDiagramWidget);
        });
        container.bind(SprottyDiagramIdentifier).toConstantValue(diagramIdentifier);
        container.rebind(KeyTool).to(DisabledKeyTool);

        this.addCustomBindings(container);
    }

    protected addCustomBindings(container: Container): void {
        container.rebind(VscodeDiagramWidget).to(KlighdDiagramWidget).inSingletonScope();
    }
}

// Instantiate Starter if this file is used in a webview
new KLighDSprottyStarter();
