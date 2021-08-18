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

import { Memento } from "vscode";
import { LanguageClient } from "vscode-languageclient";
import { KLighDWebview } from "../klighd-webview";
import { PersistenceMessage } from "./messages";

/** Sends a {@link PersistenceMessage}. */
type Send = (msg: PersistenceMessage) => void;

/**
 * Service that receives {@link PersistenceMessage}s from provided webviews
 * and persists them in the workspace state.
 */
export class StorageService {
    private static readonly key = "klighdPersistence";
    private memento: Memento;

    constructor(memento: Memento, client: LanguageClient) {
        this.memento = memento;

        const data = this.getData();
        console.log("Persisted data:", data);

        // Add the options to the initialization options so they are send to the LS on start
        client.clientOptions.initializationOptions = {
            ...client.clientOptions.initializationOptions,
            clientDiagramOptions: data,
        };
    }

    /**
     * Registers a message listener on the given webview.
     * Used to send and receive messages from the webview.
     */
    addWebview(webview: KLighDWebview): void {
        webview.onMessage(this.handleMessage.bind(this, webview));
    }

    /** Removes all persisted data. Useful to nuke persisted data to a fresh state. */
    static clearAll(memento: Memento): void {
        memento.update(StorageService.key, {});
    }

    private getData() {
        return this.memento.get<Record<string, any>>(StorageService.key) ?? {};
    }

    private updateData(data: Record<string, any>) {
        this.memento.update(StorageService.key, data);
    }

    /** 
     * Reports the data changes back to the webview.
     * The data in this service should be the source of truth.
     */
    private reportData(send: Send, data: Record<string, any>) {
        send({ type: "persistence/reportItems", payload: { items: data } });
    }

    private handleMessage(origin: KLighDWebview, msg: PersistenceMessage): void {
        if (!("type" in msg)) return;

        const send = origin.sendMessage.bind(origin);

        switch (msg.type) {
            case "persistence/getItems": {
                this.reportData(send, this.getData());
                break;
            }
            case "persistence/setItem": {
                const data = this.getData();
                data[msg.payload.key] = msg.payload.value;

                this.updateData(data);
                this.reportData(send, data);
                break;
            }
            case "persistence/removeItem": {
                const data = this.getData();
                delete data[msg.payload.key];

                this.updateData(data);
                this.reportData(send, data);
                break;
            }
            case "persistence/clear": {
                this.updateData({});
                this.reportData(send, {});
                break;
            }
            default:
                break;
        }
    }
}
