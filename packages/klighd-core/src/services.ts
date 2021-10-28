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

// Services provide infrastructure functionality to the KLighD Sprotty container.
// A service shall not be implemented by this core package. Each service has to be
// provided by an application that integrates `klighd-core`, as their implementation
// might be platform dependent.

// Notice how a symbol with the same name as the service interface is exported.
// Typescript is smart enough to differentiate between each type. Therefore,
// the constant is used as a DI symbol and the interface as a type automatically.
// https://gitter.im/inversify/InversifyJS?at=5e4ed3645fd3f22ede92d911

import { Container } from "inversify";
import { ActionMessage } from "sprotty";

/** All services that are required by the `klighd-core` package and have to be provided externally. */
interface Services {
    connection: Connection;
    sessionStorage: SessionStorage;
    persistenceStorage: PersistenceStorage;
}

/** Helper function to bind all required services to the given DI Container. */
export function bindServices(container: Container, services: Services): void {
    container.bind(Connection).toConstantValue(services.connection);
    container.bind(SessionStorage).toConstantValue(services.sessionStorage);
    container.bind(PersistenceStorage).toConstantValue(services.persistenceStorage);
}

/**
 * Notification types used in `klighd-core`. Most of the times the default Sprotty type
 * (diagram/accept) is used.
 * However, diagram options changes are communicated with separate method types.
 *
 * @see de.cau.cs.kieler.klighd.lsp.IDiagramOptionsLanguageServerExtension.xtend
 */
export const enum NotificationType {
    /** The default notification type that is used by Sprotty and thus most of the communication. */
    Accept = "diagram/accept",
    /** Notifies the server about an updated synthesis option. */
    SetSynthesisOption = "keith/diagramOptions/setSynthesisOptions",
    /** Notifies the server about an updated layout option. */
    SetLayoutOption = "keith/diagramOptions/setLayoutOptions",
    /** Perform an actionOption. Do not confuse this with the PerformActionAction with is send with the Accept type! */
    PerformAction = "keith/diagramOptions/performAction",
    /** Notifies the server about the current user preferences. */
    SetPreferences = "keith/preferences/setPreferences",
}

/** An abstract connection to a server. */
export interface Connection {
    /** Sends a {@link ActionMessage} to the server. ActionMessages should use the notification type "diagram/accept". This is the common scenario. */
    sendMessage(message: ActionMessage): void;

    /** Sends a generic notification message to the server with any payload. */
    sendNotification<T extends Record<string, unknown>>(type: NotificationType, payload: T): void;

    /** Registers a callback that is executed when a {@link ActionMessage} is received from the server. */
    onMessageReceived(handler: (message: ActionMessage) => void): void;

    /** Returns a promise that resolves when the connection is able to send and receive messages. */
    onReady(): Promise<void>;
}
export const Connection = Symbol("Connection");

/**
 * Key/Value Storage that should be used for short term persistence, lasting only the users
 * session. Uses the same interface as the web {@link Storage} API.
 */
export type SessionStorage = Storage;
export const SessionStorage = Symbol("SessionStorage");

/**
 * Key/Value Storage for items that should be persisted long term.
 * API is similar to the {@link Storage} API but is asynchronous, since not every
 * platform is able to provide synchronous storage access.
 *
 * The stored keys/items should be send to the server during initialization
 * as an object property of the `clientDiagramOptions` key.
 */
export interface PersistenceStorage {
    /**
     * Sets the item for a given key. Uses a setter function to update the value
     * based on the previous value, which is often desired.
     * This saves an additional read that would otherwise be required for an update.
     */
    setItem<T>(key: string, setter: (prev?: T) => T): void;

    /** Returns an item for the given key. Resolves to `undefined` if the key does not exist. */
    getItem<T>(key: string): Promise<T | undefined>;

    /** Removes an item for a given key. */
    removeItem(key: string): void;

    /** Clears the storage. Removes all stored items. */
    clear(): void;

    /** Attaches a listener that is notified when the storage gets cleared. */
    onClear(cb: () => void): void;
}
export const PersistenceStorage = Symbol("PersistenceStorage");
