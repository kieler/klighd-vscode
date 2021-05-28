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
import { DisplayedActionData, LayoutOptionUIData, ValuedSynthesisOption } from "./option-models";
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
