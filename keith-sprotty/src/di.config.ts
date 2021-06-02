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

import { interactiveModule } from '@kieler/keith-interactive/lib/interactive-module';
import { Container, ContainerModule, interfaces } from 'inversify';
import {
    configureModelElement, ConsoleLogger, defaultModule, exportModule, hoverModule, HoverState, HtmlRoot, HtmlRootView, IVNodePostprocessor,
    LogLevel, ModelRendererFactory, modelSourceModule, ModelViewer, overrideViewerOptions, PreRenderedElement, PreRenderedView, RenderingTargetKind, selectModule, SGraph, SGraphFactory,
    TYPES, updateModule, viewportModule, ViewRegistry, configureActionHandler
} from 'sprotty/lib';
import actionModule from './actions/actions-module';
import { DISymbol } from './di.symbols';
import { KeithDiagramServer } from './diagram-server';
import { KeithHoverMouseListener } from './hover/hover';
import { KeithModelViewer } from './model-viewer';
import { RenderOptions } from './options';
import { optionsModule } from './options/options-module';
import { sidebarModule } from './sidebar';
import { SKGraphModelRenderer } from './skgraph-model-renderer';
import { EDGE_TYPE, LABEL_TYPE, NODE_TYPE, PORT_TYPE, SKEdge, SKLabel, SKNode, SKPort } from './skgraph-models';
import { SetSynthesesAction, SetSynthesisAction } from './syntheses/actions';
import { SynthesesRegistry } from './syntheses/syntheses-registry';
import textBoundsModule from './textbounds/textbounds-module';
import { KEdgeView, KLabelView, KNodeView, KPortView, SKGraphView } from './views';

/**
 * Dependency injection module that adds functionality for diagrams and configures the views for SKGraphElements.
 */
const kGraphDiagramModule = new ContainerModule((bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {
    bind(TYPES.ModelSource).to(KeithDiagramServer).inSingletonScope();
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
    rebind<ModelRendererFactory>(TYPES.ModelRendererFactory).toFactory<SKGraphModelRenderer>(ctx => {
        return (targetKind: RenderingTargetKind, processors: IVNodePostprocessor[]) => {
            const viewRegistry = ctx.container.get<ViewRegistry>(TYPES.ViewRegistry);
            return new SKGraphModelRenderer(viewRegistry, targetKind, processors);
        };
    });
    // Notes that this rebinds the Service and not the TYPE.ModelViewer intentionally as the type is bound to a dynamic value in Sprotty
    rebind(ModelViewer).to(KeithModelViewer).inSingletonScope()


    const context = { bind, unbind, isBound, rebind }
    configureModelElement(context, 'html', HtmlRoot, HtmlRootView)
    configureModelElement(context, 'pre-rendered', PreRenderedElement, PreRenderedView)
    configureModelElement(context, 'graph', SGraph, SKGraphView);
    configureModelElement(context, NODE_TYPE, SKNode, KNodeView)
    configureModelElement(context, EDGE_TYPE, SKEdge, KEdgeView)
    configureModelElement(context, PORT_TYPE, SKPort, KPortView)
    configureModelElement(context, LABEL_TYPE, SKLabel, KLabelView)
    bind(RenderOptions).toSelf().inSingletonScope()

    bind(DISymbol.SynthesesRegistry).to(SynthesesRegistry).inSingletonScope();
    configureActionHandler(context, SetSynthesesAction.KIND, DISymbol.SynthesesRegistry);
    configureActionHandler(context, SetSynthesisAction.KIND, DISymbol.SynthesesRegistry);
})

/**
 * Dependency injection container that bundles all needed sprotty and custom modules to allow SKGraphs to be drawn with sprotty.
 */
export default function createContainer(widgetId: string): Container {
    const container = new Container()
    container.load(defaultModule, selectModule, interactiveModule, viewportModule, exportModule, modelSourceModule, updateModule, hoverModule,
        // keep the keith-specific modules at the last positions because of possible binding overrides.
        textBoundsModule, actionModule, optionsModule, sidebarModule, kGraphDiagramModule)
    overrideViewerOptions(container, {
        needsClientLayout: false,
        needsServerLayout: true,
        baseDiv: widgetId,
        hiddenDiv: widgetId + '_hidden'
    })
    return container
}