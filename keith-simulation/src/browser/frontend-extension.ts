/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { ContainerModule, interfaces } from 'inversify'
import { SimulationContribution } from './simulation-contribution'
import { KeybindingContext, WidgetFactory, FrontendApplicationContribution, bindViewContribution } from '@theia/core/lib/browser'
import '../../src/browser/style/index.css'
import { SimulationKeybindingContext } from './simulation-keybinding-context'
import { SimulationWidget } from './simulation-widget'
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { simulationWidgetId } from '../common';
import { SelectSimulationTypeCommand } from './select-simulation-type-command';

export default new ContainerModule((bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {

    // added for keybinding and commands
    bind(SimulationKeybindingContext).toSelf()
    bind(KeybindingContext).toDynamicValue(context => context.container.get(SimulationKeybindingContext));
    bind(SimulationWidget).toSelf()
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: simulationWidgetId,
        createWidget: () => ctx.container.get<SimulationWidget>(SimulationWidget)
    }))

    bindViewContribution(bind, SimulationContribution)
    bind(FrontendApplicationContribution).toService(SimulationContribution);
    bind(TabBarToolbarContribution).toService(SimulationContribution);

    bind(SelectSimulationTypeCommand).toSelf().inSingletonScope()
})