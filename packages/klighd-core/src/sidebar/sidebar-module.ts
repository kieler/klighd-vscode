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
import { ToggleSidebarPanelAction } from "./actions";
import { Sidebar } from "./sidebar";
import { SidebarPanelRegistry } from "./sidebar-panel-registry";

/** DI module that adds support for sidebars. */
export const sidebarModule = new ContainerModule((bind, _, isBound) => {
    bind(DISymbol.Sidebar)
        .to(Sidebar)
        .inSingletonScope();
    bind(TYPES.IUIExtension).toService(DISymbol.Sidebar);

    bind(DISymbol.SidebarPanelRegistry)
        .to(SidebarPanelRegistry)
        .inSingletonScope();

    const ctx = { bind, isBound };
    configureActionHandler(ctx, ToggleSidebarPanelAction.KIND, DISymbol.SidebarPanelRegistry);
});
