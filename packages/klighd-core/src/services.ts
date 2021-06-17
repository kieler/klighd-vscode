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

// Services provide infrastructure functionality to the KLighD Sprotty container.
// A service shall not implemented by this core package. Each service has to be
// provided by an application that integrates `klighd-core`, as their implementation
// might be plattform dependent.

// Notice how a symbol with the same name as the service interface is exported.
// Typescript is smart enough to differentiate between each type. Therefore,
// the constant is used as a DI symbol and the interface as a type automatically.
// https://gitter.im/inversify/InversifyJS?at=5e4ed3645fd3f22ede92d911

import { ActionMessage } from "sprotty";

/**
 * Notification types used in `klighd-core`. Most of the times the default Sprotty type
 * (diagram/accept) is used.
 * However, diagram options changes are communicated on a separate namespace.
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
}

/** An abstract connection to a server. */
export interface Connection {
    /** Sends a {@link ActionMessage} to the server. ActionMessages should use the notification type "diagram/accept". */
    sendMessage(message: ActionMessage): void;

    /** Sends a generic notification message to the server with any payload. */
    sendNotification<T extends Record<string, unknown>>(type: NotificationType, payload: T): void;

    /** Registers a callback that is executed when a {@link ActionMessage} is received from the server. */
    onMessageReceived(handler: (message: ActionMessage) => void): void;
}
export const Connection = Symbol("Connection");

/**
 * Key/Value Storage that should be used for short term persistence, lasting only the users
 * session. Uses the same interface as the web {@link Storage} API.
 */
export type SessionStorage = Storage;
export const SessionStorage = Symbol("SessionStorage");
