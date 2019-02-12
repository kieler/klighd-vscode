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
import { Container, ContainerModule } from "inversify"
import { ConsoleLogger, LogLevel, SGraph,
        TYPES, boundsModule,
        buttonModule, configureModelElement, defaultModule, expandModule,
        exportModule, fadeModule, hoverModule, modelSourceModule, moveModule,
        openModule, overrideViewerOptions, selectModule, undoRedoModule,
        viewportModule, SGraphFactory} from 'sprotty/lib'
import { KEdgeView,  KNodeView, KPortView, KLabelView, SGraphView} from "./views"
import { KNode, KPort, KLabel, KEdge } from "./kgraph-models"
import actionModule from "./actions/actions-module";
import textBoundsModule from "./textbounds/textbounds-module";

const kGraphDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope()
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn)
    rebind(TYPES.IModelFactory).to(SGraphFactory).inSingletonScope()
    const context = { bind, unbind, isBound, rebind };
    configureModelElement(context, 'graph', SGraph, SGraphView);
    configureModelElement(context, 'node', KNode, KNodeView)
    configureModelElement(context, 'edge', KEdge, KEdgeView)
    configureModelElement(context, 'port', KPort, KPortView)
    configureModelElement(context, 'label', KLabel, KLabelView)
})

export default function createContainer(widgetId: string): Container {
    const container = new Container()
    container.load(defaultModule, selectModule, moveModule, boundsModule, undoRedoModule, viewportModule,
        hoverModule, fadeModule, exportModule, expandModule, openModule, buttonModule, modelSourceModule,
        kGraphDiagramModule, textBoundsModule, actionModule)
    overrideViewerOptions(container, {
        needsClientLayout: false,
        needsServerLayout: true,
        baseDiv: widgetId
    })
    return container
}