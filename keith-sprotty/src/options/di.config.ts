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

import { ContainerModule } from "inversify";
import { TYPES } from "sprotty";
import { OptionsPanel } from "./options-panel";
import { OptionsTrigger } from "./options-trigger";

export const UITYPES = {
    OptionsTrigger: Symbol("optsions-trigger"),
    OptionsPanel: Symbol("optsions-panel"),
};

export const optionsModule = new ContainerModule((bind) => {
    bind(UITYPES.OptionsTrigger)
        .to(OptionsTrigger)
        .inSingletonScope();
    bind(UITYPES.OptionsPanel)
        .to(OptionsPanel)
        .inSingletonScope();

    bind(TYPES.IUIExtension).toService(UITYPES.OptionsTrigger);
    bind(TYPES.IUIExtension).toService(UITYPES.OptionsPanel);
});
