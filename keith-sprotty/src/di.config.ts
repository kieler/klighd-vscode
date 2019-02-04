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
        SGraphView, TYPES, boundsModule,
        buttonModule, configureModelElement, defaultModule, expandModule,
        exportModule, fadeModule, hoverModule, modelSourceModule, moveModule,
        openModule, overrideViewerOptions, selectModule, undoRedoModule,
        viewportModule, SGraphFactory} from 'sprotty/lib'
import { KEdgeView,  KNodeView, KPortView, KLabelView} from "./views"
import { KNode, KPort, KLabel, KEdge } from "./kgraph-models"
import { RequestTextBoundsCommand } from "./actions"
import { HiddenTextBoundsUpdater } from "./hidden-text-bounds-updater"

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

const textBoundsModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    // TODO:
    // This should really first unbind the RequestBoundsCommand from the TYPES.ICommand registry
    // and the HiddenBoundsUpdater from the TYPES.HiddenVNodeDecorator registry, but inversify
    // does not support such a feature.
    // See the ticket https://github.com/inversify/InversifyJS/issues/1035
    // I would like some syntax such as:
    // unbind(Types.HiddenVNodeDecorator).from(HiddenBoundsUpdater)
    // to remove only that specific binding, not all of the bindings registered for the Types.HiddenVNodeDecorator.
    // With that, the HiddenBoundsUpdater should not be called anymore and not issue any CalculatedBoundsAction,
    // which is currently only ignored by the overwritten handle method for that action in the KeithDiagramServer.
    bind(TYPES.ICommand).toConstructor(RequestTextBoundsCommand)
    bind(TYPES.HiddenVNodeDecorator).to(HiddenTextBoundsUpdater).inSingletonScope()
});

export default function createContainer(widgetId: string): Container {
    const container = new Container()
    container.load(defaultModule, selectModule, moveModule, boundsModule, undoRedoModule, viewportModule,
        hoverModule, fadeModule, exportModule, expandModule, openModule, buttonModule, modelSourceModule,
        kGraphDiagramModule, textBoundsModule)
    overrideViewerOptions(container, {
        needsClientLayout: false,
        needsServerLayout: true,
        baseDiv: widgetId
    })
    return container
}