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

import { Container, injectable } from 'inversify';
import { createKeithDiagramContainer } from 'keith-sprotty/lib';
import { KeyTool, TYPES } from 'sprotty/lib';
import { DiagramConfiguration, TheiaKeyTool } from 'theia-sprotty/lib';
import { KeithDiagramServer } from './keith-diagram-server';

/**
 * Dependency injection container for KEITH diagram configuration.
 * Based on the theia-yang-extension implementation by TypeFox.
 * @see https://github.com/theia-ide/yangster/blob/master/theia-yang-extension/src/frontend/yangdiagram/di.config.ts
 */
@injectable()
export class KeithDiagramConfiguration implements DiagramConfiguration {
    diagramType: string = 'keith-diagram'

    createContainer(widgetId: string): Container {
        const container = createKeithDiagramContainer(widgetId)
        container.bind(TYPES.ModelSource).to(KeithDiagramServer).inSingletonScope()
        container.rebind(KeyTool).to(TheiaKeyTool).inSingletonScope()
        return container
    }
}