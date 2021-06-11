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

import { Action } from "sprotty";
import {
    DisplayedActionData,
    LayoutOptionUIData,
    LayoutOptionValue,
    SynthesisOption,
    ValuedSynthesisOption,
} from "./option-models";

/** Request message from the server to update the diagram options widget on the client. */
export class UpdateOptionsAction implements Action {
    static readonly KIND = "updateOptions";
    readonly kind = UpdateOptionsAction.KIND;

    constructor(
        public readonly valuedSynthesisOptions: ValuedSynthesisOption[],
        public readonly layoutOptions: LayoutOptionUIData[],
        public readonly actions: DisplayedActionData[],
        public readonly modelUri: string
    ) {}

    /** Type predicate to narrow an action to this action. */
    static isThisAction(action: Action): action is UpdateOptionsAction {
        return action.kind === UpdateOptionsAction.KIND;
    }
}

/**
 * Triggers a action from the options that should be performed.
 * Do not confuse this with PerformActionAction!
 */
export class PerformOptionsActionAction implements Action {
    static readonly KIND = "performOptionsAction";
    readonly kind = PerformOptionsActionAction.KIND;

    constructor(readonly actionId: string) {}

    /** Type predicate to narrow an action to this action. */
    static isThisAction(action: Action): action is PerformOptionsActionAction {
        return action.kind === PerformOptionsActionAction.KIND;
    }
}

/** Change the value of one or multiple synthesis options. */
export class SetSynthesisOptionsAction implements Action {
    static readonly KIND = "setSynthesisOptions";
    readonly kind = SetSynthesisOptionsAction.KIND;

    constructor(readonly options: SynthesisOption[]) {}

    /** Type predicate to narrow an action to this action. */
    static isThisAction(action: Action): action is SetSynthesisOptionsAction {
        return action.kind === SetSynthesisOptionsAction.KIND;
    }
}

/** Change the value of one or multiple layout options. */
export class SetLayoutOptionsAction implements Action {
    static readonly KIND = "setLayoutOptions";
    readonly kind = SetLayoutOptionsAction.KIND;

    constructor(readonly options: LayoutOptionValue[]) {}

    /** Type predicate to narrow an action to this action. */
    static isThisAction(action: Action): action is SetLayoutOptionsAction {
        return action.kind === SetLayoutOptionsAction.KIND;
    }
}

/** Change the value of one or multiple layout options. */
export class SetRenderOptionAction implements Action {
    static readonly KIND = "setRenderOption";
    readonly kind = SetRenderOptionAction.KIND;

    constructor(readonly id: string, readonly value: any) {}

    /** Type predicate to narrow an action to this action. */
    static isThisAction(action: Action): action is SetRenderOptionAction {
        return action.kind === SetRenderOptionAction.KIND;
    }
}
