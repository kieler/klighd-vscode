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

/** DI Symbols for Services provided by the KLighD DI container. */
export const DISymbol = {
    Sidebar: Symbol("Sidebar"),
    SidebarPanel: Symbol("SidebarPanel"),
    SidebarPanelRegistry: Symbol("SidebarPanelRegistry"),

    PreferencesRegistry: Symbol("PreferencesRegistry"),
    
    OptionsRenderer: Symbol("OptionsRenderer"),
    OptionsRegistry: Symbol("OptionsRegistry"),
    RenderOptionsRegistry: Symbol("RenderOptionsRegistry"),
    SynthesesRegistry: Symbol("SynthesesRegistry"),
};
