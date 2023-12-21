/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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
import { LanguageClient } from "vscode-languageclient/node";
import { Messenger } from 'vscode-messenger';
import { diagramType } from '../constants';
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
    private messenger: Messenger | undefined;

    constructor(memento: Memento, client: LanguageClient) {
        this.memento = memento;
        this.messenger = undefined

        const data = this.getData();
        console.log("Persisted data:", data);

        // Add the options to the initialization options so they are send to the LS on start
        client.clientOptions.initializationOptions = {
            ...client.clientOptions.initializationOptions,
            clientDiagramOptions: data,
        };
    }

    setMessenger(messenger: Messenger): void {
        this.messenger = messenger
        messenger.onRequest({ method: 'klighd/persistence' }, this.handleMessage.bind(this))
    }

    /** Removes all persisted data. Useful to nuke persisted data to a fresh state. */
    static clearAll(memento: Memento): void {
        memento.update(StorageService.key, {});
    }

    private getData() {
        return this.memento.get<Record<string, any>>(StorageService.key) ?? {};
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    setItem(key: string, value: any): void {
        const data = this.getData();
        data[key] = value;

        this.updateData(data);
    }

    getItem(key: string): any {
        const data = this.getData();
        return data[key]
    }

    private updateData(data: Record<string, any>) {
        this.memento.update(StorageService.key, data);
    }

    /**
     * Report the data changes back to the webview.
     * The data in this service should be the source of truth.
     */
    private reportData(send: Send, data: Record<string, any>) {
        send({ type: "persistence/reportItems", payload: { items: data } });
    }

    /**
     * Report a clear back to the webview.
     *
     * _NOTE_: At the moment, this will never be reported as it can only reports for
     * clears that are triggered by the webview. Currently, clears are only triggered
     * by the extension, which also reports the change as it is able to access all open webviews.
     * Because this service does not cache added webviews to avoid
     * storing closed webviews, it can only respond to messages handled by a webview.
     * It is not able to actively send a message.
     *
     * This functionality only exists to be conform with "clears are reported back to the webview",
     * in case a webview implements and triggers clear messages.
     * */
    private reportChange(send: Send, type: "clear") {
        send({ type: "persistence/reportChange", payload: { type } });
    }

    private handleMessage( msg: PersistenceMessage): void {
        if (!("type" in msg) || this.messenger === undefined) return;

        const send = (msg: PersistenceMessage) => { this.messenger?.sendNotification({ method: "klighd/persistence" }, { type: 'webview', webviewType: diagramType } , msg) }

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
                this.reportChange(send, "clear");
                break;
            }
            default:
                break;
        }
    }
}
