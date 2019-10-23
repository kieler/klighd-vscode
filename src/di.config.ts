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
import { Container, ContainerModule, interfaces } from 'inversify';
import {
    configureModelElement, ConsoleLogger, defaultModule, exportModule, hoverModule, HoverState, HtmlRoot, HtmlRootView, LogLevel, modelSourceModule,
     overrideViewerOptions, PreRenderedElement, PreRenderedView, selectModule, SGraph, SGraphFactory, TYPES, updateModule, viewportModule
} from 'sprotty/lib';
import actionModule from './actions/actions-module';
import { KeithHoverMouseListener } from './hover/hover';
import { SKEdge, SKLabel, SKNode, SKPort } from './skgraph-models';
import textBoundsModule from './textbounds/textbounds-module';
import { KEdgeView, KLabelView, KNodeView, KPortView, SKGraphView } from './views';
import { interactiveModule } from '@kieler/keith-interactive/lib/interactive-module'
import { RenderOptions } from './options'

/**
 * Dependency injection module that adds functionality for diagrams and configures the views for SKGraphElements.
 */
const kGraphDiagramModule = new ContainerModule((bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope()
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn)
    rebind(TYPES.IModelFactory).to(SGraphFactory).inSingletonScope()
    rebind(TYPES.CommandStackOptions).toConstantValue({
        // Override the default animation speed to be 500 ms, as the default value is too quick.
        defaultDuration: 500,
        undoHistoryLimit: 50
    })
    bind(TYPES.MouseListener).to(KeithHoverMouseListener)
    rebind<HoverState>(TYPES.HoverState).toDynamicValue(ctx => ({
        mouseOverTimer: undefined,
        mouseOutTimer: undefined,
        popupOpen: false,
        previousPopupElement: undefined
    }));
    const context = { bind, unbind, isBound, rebind }
    configureModelElement(context, 'html', HtmlRoot, HtmlRootView)
    configureModelElement(context, 'pre-rendered', PreRenderedElement, PreRenderedView)
    configureModelElement(context, 'graph', SGraph, SKGraphView);
    configureModelElement(context, 'node', SKNode, KNodeView)
    configureModelElement(context, 'edge', SKEdge, KEdgeView)
    configureModelElement(context, 'port', SKPort, KPortView)
    configureModelElement(context, 'label', SKLabel, KLabelView)
    bind(RenderOptions).toSelf().inSingletonScope()
})

/**
 * Dependency injection container that bundles all needed sprotty and custom modules to allow SKGraphs to be drawn with sprotty.
 */
export default function createContainer(widgetId: string): Container {
    const container = new Container()
    container.load(defaultModule, selectModule, interactiveModule, viewportModule, exportModule, modelSourceModule, updateModule, hoverModule,
        // keep the keith-specific modules at the last positions because of possible binding overrides.
        textBoundsModule, actionModule, kGraphDiagramModule)
    overrideViewerOptions(container, {
        needsClientLayout: false,
        needsServerLayout: true,
        baseDiv: widgetId,
        hiddenDiv: widgetId + '_hidden'
    })
    return container
}