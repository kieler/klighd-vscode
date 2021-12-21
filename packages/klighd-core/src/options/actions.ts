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
import {
    DisplayedActionData,
    LayoutOptionUIData,
    LayoutOptionValue,
    SynthesisOption,
    ValuedSynthesisOption,
} from "./option-models";

/** Request message from the server to update the diagram options widget on the client. */
export interface UpdateOptionsAction extends Action {
    kind: typeof UpdateOptionsAction.KIND
    valuedSynthesisOptions: ValuedSynthesisOption[]
    layoutOptions: LayoutOptionUIData[]
    actions: DisplayedActionData[]
    modelUri: string
}

export namespace UpdateOptionsAction {
    export const KIND = "updateOptions"

    export function create(
        valuedSynthesisOptions: ValuedSynthesisOption[],
        layoutOptions: LayoutOptionUIData[],
        actions: DisplayedActionData[],
        modelUri: string,
    ): UpdateOptionsAction {
        return {
            kind: KIND,
            valuedSynthesisOptions,
            layoutOptions, 
            actions,
            modelUri,
        }
    }

    export function isThisAction(action: Action): action is UpdateOptionsAction {
        return action.kind === UpdateOptionsAction.KIND;
    }
}

/**
 * Triggers a action from the options that should be performed.
 * Do not confuse this with PerformActionAction!
 */
export interface PerformOptionsActionAction extends Action {
    kind: typeof PerformOptionsActionAction.KIND
    actionId: string
}

export namespace PerformOptionsActionAction {
    export const KIND = "performOptionsAction"

    export function create(actionId: string): PerformOptionsActionAction {
        return {
            kind: KIND,
            actionId,
        }
    }

    export function isThisAction(action: Action): action is PerformOptionsActionAction {
        return action.kind === PerformOptionsActionAction.KIND;
    }
}

/** Change the value of one or multiple synthesis options. */
export interface SetSynthesisOptionsAction extends Action {
    kind: typeof SetSynthesisOptionsAction.KIND
    options: SynthesisOption[]
}

export namespace SetSynthesisOptionsAction {
    export const KIND = "setSynthesisOptions"

    export function create(options: SynthesisOption[]): SetSynthesisOptionsAction {
        return {
            kind: KIND,
            options,
        }
    }

    export function isThisAction(action: Action): action is SetSynthesisOptionsAction {
        return action.kind === SetSynthesisOptionsAction.KIND;
    }
}

/** Resets all synthesis options to default for both server and client. */
export interface ResetSynthesisOptionsAction extends Action {
    kind: typeof ResetSynthesisOptionsAction.KIND
}

export namespace ResetSynthesisOptionsAction {
    export const KIND = "resetSynthesisOptions"

    export function create(): ResetSynthesisOptionsAction {
        return {
            kind: KIND,
        }
    }

    export function isThisAction(action: Action): action is ResetSynthesisOptionsAction {
        return action.kind === ResetSynthesisOptionsAction.KIND;
    }
}

/** Change the value of one or multiple layout options. */
export interface SetLayoutOptionsAction extends Action {
    kind: typeof SetLayoutOptionsAction.KIND
    options: LayoutOptionValue[]
}

export namespace SetLayoutOptionsAction {
    export const KIND = 'setLayoutOptions'

    export function create(options: LayoutOptionValue[]): SetLayoutOptionsAction {
        return {
            kind: KIND,
            options
        }
    }

    export function isThisAction(action: Action): action is SetLayoutOptionsAction {
        return action.kind === SetLayoutOptionsAction.KIND;
    }
}

/** Resets all layout options to default for both server and client. */
export interface ResetLayoutOptionsAction extends Action {
    kind: typeof ResetLayoutOptionsAction.KIND
}

export namespace ResetLayoutOptionsAction {
    export const KIND = "resetLayoutOptions"

    export function create(): ResetLayoutOptionsAction {
        return {
            kind: KIND,
        }
    }

    export function isThisAction(action: Action): action is ResetLayoutOptionsAction {
        return action.kind === ResetLayoutOptionsAction.KIND;
    }
}

/** Change the value of one or multiple render options. */
export interface SetRenderOptionAction extends Action {
    kind: typeof SetRenderOptionAction.KIND
    id: string
    value: unknown
}

export namespace SetRenderOptionAction {
    export const KIND = "setRenderOption"

    export function create(id: string, value: unknown): SetRenderOptionAction {
        return {
            kind: KIND,
            id,
            value
        }
    }

    export function isThisAction(action: Action): action is SetRenderOptionAction {
        return action.kind === SetRenderOptionAction.KIND;
    }
}

/** Resets all render options to default. */
export interface ResetRenderOptionsAction extends Action {
    kind: typeof ResetRenderOptionsAction.KIND
}

export namespace ResetRenderOptionsAction {
    export const KIND = "resetRenderOptions"

    export function create(): ResetRenderOptionsAction {
        return {
            kind: KIND,
        }
    }

    export function isThisAction(action: Action): action is ResetRenderOptionsAction {
        return action.kind === ResetRenderOptionsAction.KIND;
    }
}