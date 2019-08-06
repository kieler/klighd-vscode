/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { ContainerModule, interfaces } from 'inversify'
import { SimulationContribution } from './simulation-contribution'
import { KeybindingContext, WidgetFactory, bindViewContribution, FrontendApplicationContribution } from '@theia/core/lib/browser'
import '../../src/browser/style/index.css'
import { SimulationKeybindingContext } from './simulation-keybinding-context'
import { SimulationWidget } from './simulation-widget'

export default new ContainerModule((bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {

    // added for keybinding and commands
    bind(SimulationKeybindingContext).toSelf()
    bind(KeybindingContext).toDynamicValue(context => context.container.get(SimulationKeybindingContext));

    bindViewContribution(bind, SimulationContribution)
    bind(FrontendApplicationContribution).toService(SimulationContribution);

    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: "simulation-widget",
        createWidget: () => ctx.container.get(SimulationWidget)
    }))
    bind(SimulationWidget).toSelf()
})