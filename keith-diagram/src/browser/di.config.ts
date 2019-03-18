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
import {
    CompletionLabelEditor, DeleteWithWorkspaceEditCommand, DiagramConfiguration, LSTheiaDiagramServer, LSTheiaDiagramServerProvider, RenameLabelEditor, TheiaDiagramServer,
    TheiaKeyTool, WorkspaceEditCommand
} from 'sprotty-theia/lib';
import { configureCommand, KeyTool, TYPES } from 'sprotty/lib';
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
        container.bind(KeithDiagramServer).toSelf().inSingletonScope()
        container.bind(TheiaDiagramServer).toService(KeithDiagramServer)
        container.bind(LSTheiaDiagramServer).toService(KeithDiagramServer)
        container.bind(TYPES.ModelSource).toService(TheiaDiagramServer)
        container.rebind(KeyTool).to(TheiaKeyTool).inSingletonScope()

        container.bind(LSTheiaDiagramServerProvider).toProvider<LSTheiaDiagramServer>((context) => {
            return () => {
                return new Promise<LSTheiaDiagramServer>((resolve) => {
                    resolve(context.container.get(LSTheiaDiagramServer))
                })
            }
        })

        configureCommand(container, DeleteWithWorkspaceEditCommand)
        configureCommand(container, WorkspaceEditCommand)

        container.bind(CompletionLabelEditor).toSelf().inSingletonScope();
        container.bind(RenameLabelEditor).toSelf().inSingletonScope();

        return container
    }
}