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
import { configureActionHandler, TYPES } from "sprotty";
import { UpdateOptionsAction } from "./actions";
import { OptionsPanel } from "./options-panel";
import { OptionsRegistry } from "./options-registry";
import { OptionsTrigger } from "./options-trigger";

export const UITYPES = {
    OptionsTrigger: Symbol("optsions-trigger"),
    OptionsPanel: Symbol("optsions-panel"),
};

export const optionsModule = new ContainerModule((bind, _, isBound) => {
    bind(UITYPES.OptionsTrigger)
        .to(OptionsTrigger)
        .inSingletonScope();
    bind(UITYPES.OptionsPanel)
        .to(OptionsPanel)
        .inSingletonScope();
    bind(TYPES.IUIExtension).toService(UITYPES.OptionsTrigger);
    bind(TYPES.IUIExtension).toService(UITYPES.OptionsPanel);

    bind(OptionsRegistry)
        .toSelf()
        .inSingletonScope();
    configureActionHandler({ bind, isBound }, UpdateOptionsAction.KIND, OptionsRegistry);
});
