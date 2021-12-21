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

import { Action } from "sprotty-protocol";

/** Data sent to the client for setting the available syntheses. */
export interface SetSynthesesActionData {
    /** The ID of the synthesis */
    id: string;
    /** The displayable name of the synthesis. */
    displayName: string;
}

/** Sent from the server to the client to send a list of all available syntheses for the current model. */
export interface SetSynthesesAction extends Action {
    kind: typeof SetSynthesesAction.KIND
    syntheses: SetSynthesesActionData[]
}

export namespace SetSynthesesAction {
    export const KIND = "setSyntheses"

    export function create(syntheses: SetSynthesesActionData[]): SetSynthesesAction {
        return {
            kind: KIND,
            syntheses,
        }
    }

    export function isThisAction(action: Action): action is SetSynthesesAction {
        return action.kind === SetSynthesesAction.KIND;
    }
}

/** Sent from the client to the server to request a new diagram with the given synthesis. */
export interface SetSynthesisAction extends Action {
    kind: typeof SetSynthesisAction.KIND
    id: string
}

export namespace SetSynthesisAction {
    export const KIND = "setSynthesis"

    export function create(id: string): SetSynthesisAction {
        return {
            kind: KIND,
            id,
        }
    }

    export function isThisAction(action: Action): action is SetSynthesisAction {
        return action.kind === SetSynthesisAction.KIND;
    }
}
