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

// Interfaces for the messages that are send between the webview and extension
// to communicate data from the webview that should be persisted.

/** Generic template literal type that adds a prefix to the message type. */
type MessageType<T extends string> = `persistence/${T}`

/**
 * Discriminated Union of messages that is communicated between the webview
 * and extension to persist data that is created in the webview
 */
export type PersistenceMessage<T = any> =
    | ReportItemsMessage
    | ReportChangeMessage
    | GetItemsMessage
    | SetItemMessage<T>
    | RemoveItemMessage
    | ClearMessage

/**
 * Report all items that are currently stored.
 *
 * Direction: Extension --> Webview
 */
export interface ReportItemsMessage {
    type: MessageType<'reportItems'>
    payload: {
        items: Record<string, any>
    }
}

/**
 * Report a change to the currently stored data.
 * _Note:_ Currently, only clear is reported.
 *
 * Direction: Extension --> Webview
 */
export interface ReportChangeMessage {
    type: MessageType<'reportChange'>
    payload: {
        type: 'set' | 'remove' | 'clear'
        affectedKeys?: string[]
    }
}

/**
 * Requests an {@link ReportItemsMessage} of all items that are currently stored
 *
 * Direction: Webview --> Extension
 */
export interface GetItemsMessage {
    type: MessageType<'getItems'>
}

/**
 * Sets an item for a given key.
 *
 * Direction: Webview --> Extension
 */
export interface SetItemMessage<T = any> {
    type: MessageType<'setItem'>
    payload: {
        key: string
        value: T
    }
}

/**
 * Removes an item for a given key.
 *
 * Direction: Webview --> Extension
 */
export interface RemoveItemMessage {
    type: MessageType<'removeItem'>
    payload: {
        key: string
    }
}

/**
 * Clears all currently stored items.
 *
 * Direction: Webview --> Extension
 */
export interface ClearMessage {
    type: MessageType<'clear'>
}
