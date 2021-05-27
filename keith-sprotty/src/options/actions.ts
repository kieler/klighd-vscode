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

import { SetUIExtensionVisibilityAction } from "sprotty";
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
