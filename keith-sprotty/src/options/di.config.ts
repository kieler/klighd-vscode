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
import { DISymbol } from "../di.symbols";
import { UpdateOptionsAction, PerformOptionsActionAction } from "./actions";
import { OptionsPanel } from "./options-panel";
import { OptionsRegistry } from "./options-registry";
import { OptionsRenderer } from "./options-renderer";
import { OptionsTrigger } from "./options-trigger";

export const optionsModule = new ContainerModule((bind, _, isBound) => {
    bind(DISymbol.OptionsTrigger)
        .to(OptionsTrigger)
        .inSingletonScope();
    bind(DISymbol.OptionsPanel)
        .to(OptionsPanel)
        .inSingletonScope();
    bind(TYPES.IUIExtension).toService(DISymbol.OptionsTrigger);
    bind(TYPES.IUIExtension).toService(DISymbol.OptionsPanel);

    bind(DISymbol.OptionsRenderer).to(OptionsRenderer);
    bind(DISymbol.OptionsRegistry)
        .to(OptionsRegistry)
        .inSingletonScope();

    const ctx = { bind, isBound };
    configureActionHandler(ctx, UpdateOptionsAction.KIND, DISymbol.OptionsRegistry);
    configureActionHandler(ctx, PerformOptionsActionAction.KIND, DISymbol.OptionsRegistry);
});
