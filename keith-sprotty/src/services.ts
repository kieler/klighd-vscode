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

// Services provide infrastructure functionality to the KEITH Sprotty container.
// A service shall not implemented by this core package. Each service has to be
// provided by an application that integrates `keith-sprotty`, as their implementation
// might be plattform dependent.

// Notice how a symbol with the same name as the service interface is exported.
// Typescript is smart enough to differentiate between each type. Therefore,
// the constant is used as a DI symbol and the interface as a type automatically.
// https://gitter.im/inversify/InversifyJS?at=5e4ed3645fd3f22ede92d911

import { ActionMessage } from "sprotty";

/** An abstract connection to a server. */
export interface Connection {
  /** Sends a {@link ActionMessage} to the server. */
  sendMessage(message: ActionMessage): void;
  /** Registers a callback that is executed when a {@link ActionMessage} is received from the server. */
  onMessageReceived(handler: (message: ActionMessage) => void): void;
}
export const Connection = Symbol("Connection");


/**
 * Key/Value Storage that should be used for short term persistence, lasting only the users
 * session. Uses the same interface as the web {@link Storage} API.
 */
export interface SessionStorage extends Storage {}
export const SessionStorage = Symbol("SessionStorage");