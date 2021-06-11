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
import { configureActionHandler } from "sprotty";
import { DISymbol } from "../di.symbols";
import {
    UpdateOptionsAction,
    PerformOptionsActionAction,
    SetSynthesisOptionsAction,
    SetLayoutOptionsAction,
    SetRenderOptionAction,
} from "./actions";
import { OptionsPanel } from "./options-panel";
import { OptionsRegistry } from "./options-registry";
import { OptionsRenderer } from "./options-renderer";
import { GeneralPanel } from "./general-panel";
import { RenderOptionsRegistry } from "./render-options-registry";

export const optionsModule = new ContainerModule((bind, _, isBound) => {
    bind(OptionsPanel)
        .toSelf()
        .inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(OptionsPanel);

    bind(GeneralPanel)
        .toSelf()
        .inSingletonScope();
    bind(DISymbol.SidebarPanel).toService(GeneralPanel);

    bind(DISymbol.OptionsRenderer).to(OptionsRenderer);
    bind(DISymbol.OptionsRegistry)
        .to(OptionsRegistry)
        .inSingletonScope();
    bind(DISymbol.RenderOptionsRegistry)
        .to(RenderOptionsRegistry)
        .inSingletonScope();

    const ctx = { bind, isBound };
    configureActionHandler(ctx, UpdateOptionsAction.KIND, DISymbol.OptionsRegistry);
    configureActionHandler(ctx, PerformOptionsActionAction.KIND, DISymbol.OptionsRegistry);
    configureActionHandler(ctx, SetSynthesisOptionsAction.KIND, DISymbol.OptionsRegistry);
    configureActionHandler(ctx, SetLayoutOptionsAction.KIND, DISymbol.OptionsRegistry);
    configureActionHandler(ctx, SetRenderOptionAction.KIND, DISymbol.RenderOptionsRegistry);
});
