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

import { Action, SetUIExtensionVisibilityAction } from "sprotty";
import { DisplayedActionData, LayoutOptionUIData, LayoutOptionValue, SynthesisOption, ValuedSynthesisOption } from "./option-models";
import { OptionsPanel } from "./options-panel";

/** Wrapper action around {@link SetUIExtensionVisibilityAction} which shows the option panel */
export class ShowOptionsPanelAction extends SetUIExtensionVisibilityAction {
    constructor() {
        super(OptionsPanel.ID, true);
    }
}

/** Wrapper action around {@link SetUIExtensionVisibilityAction} which hides the option panel */
export class HideOptionsPanelAction extends SetUIExtensionVisibilityAction {
    constructor() {
        super(OptionsPanel.ID, false);
    }
}

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
}

/** Type predicate to narrow an action to {@link UpdateOptionsAction}. */
export function isUpdateOptionsAction(action: Action): action is UpdateOptionsAction {
    return action.kind === UpdateOptionsAction.KIND;
}

/**
 * Triggers a action from the options that should be performed.
 * Do not confuse this with PerformActionAction!
 */
export class PerformOptionsActionAction implements Action {
    static readonly KIND = "performOptionsAction";
    readonly kind = PerformOptionsActionAction.KIND;

    constructor(readonly actionId: string) {}
}

/** Type predicate to narrow an action to {@link PerformOptionsActionAction}. */
export function isPerformOptionsActionAction(action: Action): action is PerformOptionsActionAction {
    return action.kind === PerformOptionsActionAction.KIND;
}

/**
 * Triggers a action from the options that should be performed.
 * Do not confuse this with PerformActionAction!
 */
export class SetSynthesisOptionsAction implements Action {
    static readonly KIND = "setSynthesisOptions";
    readonly kind = SetSynthesisOptionsAction.KIND;

    constructor(readonly options: SynthesisOption[]) {}
}

/** Type predicate to narrow an action to {@link SetSynthesisOptionsAction}. */
export function isSetSynthesisOptionsAction(action: Action): action is SetSynthesisOptionsAction {
    return action.kind === SetSynthesisOptionsAction.KIND;
}
/**
 * Triggers a action from the options that should be performed.
 * Do not confuse this with PerformActionAction!
 */
export class SetLayoutOptionsAction implements Action {
    static readonly KIND = "setLayoutOptions";
    readonly kind = SetLayoutOptionsAction.KIND;

    constructor(readonly options: LayoutOptionValue[]) {}
}

/** Type predicate to narrow an action to {@link SetLayoutOptionsAction}. */
export function isSetLayoutOptionsAction(action: Action): action is SetLayoutOptionsAction {
    return action.kind === SetLayoutOptionsAction.KIND;
}
