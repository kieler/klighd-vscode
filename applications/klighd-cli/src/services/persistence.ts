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
import { showPopup } from "../popup";

/** {@link PersistenceStorage} that uses the `localStorage` API to save and retrieve persisted data. */
export class LocalStorage implements PersistenceStorage {
    private static readonly key = "klighdPersistence";

    /** Local cache to speed up reads. */
    private cache: Record<string, any>;

    constructor() {
        this.cache = JSON.parse(localStorage.getItem(LocalStorage.key) ?? "{}");
    }

    private save() {
        try {
            localStorage.setItem(LocalStorage.key, JSON.stringify(this.cache));
        } catch (error) {
            console.error(error);
            showPopup("error", "Persistence Error", "Unable to persist data to local storage.");
        }
    }

    setItem<T>(key: string, setter: (prev?: T) => T): void {
        const value = setter(this.cache[key]);
        this.cache[key] = value;

        this.save();
    }

    async getItem<T>(key: string): Promise<T | undefined> {
        return this.cache[key];
    }

    removeItem(key: string): void {
        delete this.cache[key];
        this.save();
    }

    clear(): void {
        this.cache = {};
        localStorage.removeItem(LocalStorage.key);
    }

    getAllData(): Record<string, any> {
      return this.cache;
    }
}
