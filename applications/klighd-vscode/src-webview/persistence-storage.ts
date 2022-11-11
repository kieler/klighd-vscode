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

import { PersistenceStorage } from "@kieler/klighd-core";
import { VsCodeApi } from "sprotty-vscode-webview/lib/services";
import { PersistenceMessage } from "../src/storage/messages";

/**
 * {@link PersistenceStorage} that syncs the data with the extension via messages
 * so they can be stored in workspace storage.
 */
export class MessagePersistenceStorage implements PersistenceStorage {
    /** Local cache of reported data to speed up reads. */
    private cache: Record<string, any>;

    vscodeApi: VsCodeApi;

    /**
     * The storage has to receive data from the webview first before data can be accessed.
     * Therefore, it is considered asynchronous and is only ready to use after data is received.
     */
    private state: "initializing" | "ready";

    /** Listeners that will be informed once the cache is ready. */
    private onReadyListeners: (() => void)[] = [];

    /** Callbacks which will be called when a clear change is reported by the extension */
    private onClearListeners: (() => void)[] = [];

    constructor(vscodeApi: VsCodeApi) {
        this.vscodeApi = vscodeApi
        this.cache = {};
        this.state = "initializing";

        window.addEventListener("message", this.handleMessageEvent.bind(this));
        this.sendToExtension({ type: "persistence/getItems" });
    }

    async setItem<T>(key: string, setter: (prev?: T) => T): Promise<void> {
        await this.ready();
        const value = setter(this.cache[key]);

        // Optimistic cache update. Will be replaced with the source of truth
        // when `setItem` is answered by a `reportItems` message.
        this.cache[key] = value;
        this.sendToExtension({ type: "persistence/setItem", payload: { key, value } });
    }

    async getItem<T>(key: string): Promise<T | undefined> {
        await this.ready();
        return this.cache[key];
    }

    removeItem(key: string): void {
        this.sendToExtension({ type: "persistence/removeItem", payload: { key } });
    }

    clear(): void {
        this.sendToExtension({ type: "persistence/clear" });
    }

    onClear(cb: () => void): void {
        this.onClearListeners.push(cb);
    }

    /** Resolves when the storage is ready to use for reads. */
    private ready(): Promise<void> {
        return new Promise((resolve) => {
            if (this.state === "ready") {
                resolve();
                return;
            }

            this.onReadyListeners.push(resolve);
        });
    }

    private setReady(cache: Record<string, any>): void {
        this.cache = cache;
        this.state = "ready";
        this.onReadyListeners.forEach((cb) => cb());
        this.onReadyListeners = [];
    }

    private sendToExtension<T>(msg: PersistenceMessage<T>) {
        this.vscodeApi.postMessage(msg);
    }

    private handleMessageEvent(event: MessageEvent<PersistenceMessage>) {
        if (!("type" in event.data)) return;

        if (event.data.type === "persistence/reportItems") {
            if (this.state !== "ready") {
                this.setReady(event.data.payload.items);
            } else {
                this.cache = event.data.payload.items;
            }
        } else if (event.data.type === "persistence/reportChange") {
            if (event.data.payload.type === "clear") this.onClearListeners.forEach((cb) => cb());
        }
    }
}
