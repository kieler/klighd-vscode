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

import { FrontendApplicationContribution, OpenHandler } from '@theia/core/lib/browser';
import { ContainerModule } from 'inversify';
import 'sprotty/css/sprotty.css';
import 'theia-sprotty/css/theia-sprotty.css';
import { DiagramConfiguration, DiagramManager, DiagramManagerProvider, DiagramWidgetRegistry } from 'theia-sprotty/lib';
import { KeithDiagramConfiguration } from './di.config';
import { KeithDiagramManager } from './keith-diagram-manager';
import { KeithDiagramWidgetRegistry } from './keith-diagram-widget-registry';

/**
 * Dependency injection container for the KEITH frontend part of diagram functionality.
 * Based on the theia-yang-extension implementation by TypeFox.
 * @see https://github.com/theia-ide/yangster/blob/master/theia-yang-extension/src/frontend/language/frontend-extension.ts
 */
export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(DiagramConfiguration).to(KeithDiagramConfiguration).inSingletonScope()
    bind(DiagramManagerProvider).toProvider<DiagramManager>(context => {
        return () => {
            return new Promise<DiagramManager>((resolve) =>
                resolve(context.container.get(KeithDiagramManager))
            )
        }
    }).whenTargetNamed('keith-diagram')
    bind(KeithDiagramManager).toSelf().inSingletonScope()
    bind(FrontendApplicationContribution).toDynamicValue(context => context.container.get(KeithDiagramManager))
    bind(OpenHandler).toDynamicValue(context => context.container.get(KeithDiagramManager))

    rebind(DiagramWidgetRegistry).to(KeithDiagramWidgetRegistry).inSingletonScope()
    bind(KeithDiagramWidgetRegistry).toSelf().inSingletonScope()
})