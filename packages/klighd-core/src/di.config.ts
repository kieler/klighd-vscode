/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2024 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { interactiveModule } from '@kieler/klighd-interactive/lib/interactive-module'
import { Container, ContainerModule, interfaces } from 'inversify'
import {
    configureActionHandler,
    configureModelElement,
    ConsoleLogger,
    defaultModule,
    exportModule,
    hoverModule,
    HoverState,
    HtmlRootImpl,
    HtmlRootView,
    IVNodePostprocessor,
    LogLevel,
    ModelRendererFactory,
    modelSourceModule,
    ModelViewer,
    overrideViewerOptions,
    PreRenderedElementImpl,
    PreRenderedView,
    RenderingTargetKind,
    selectModule,
    SGraphImpl,
    TYPES,
    updateModule,
    viewportModule,
    ViewRegistry,
} from 'sprotty'
import actionModule from './actions/actions-module'
// import bookmarkModule from './bookmarks/bookmark-module';
import { DISymbol } from './di.symbols'
import diagramPieceModule from './diagram-pieces/diagram-pieces-module'
import { KlighdDiagramServer } from './diagram-server'
import { KlighdHoverMouseListener } from './hover/hover'
import { PopupModelProvider } from './hover/popup-provider'
import { KlighdSvgExporter } from './klighd-svg-exporter'
import { KlighdModelViewer } from './model-viewer'
import { ResetPreferencesAction, SetPreferencesAction } from './options/actions'
import { optionsModule } from './options/options-module'
import { PreferencesRegistry } from './preferences-registry'
import { sidebarModule } from './sidebar'
import { SKGraphModelRenderer } from './skgraph-model-renderer'
import { EDGE_TYPE, LABEL_TYPE, NODE_TYPE, PORT_TYPE, SKEdge, SKLabel, SKNode, SKPort } from './skgraph-models'
import { SetSynthesesAction, SetSynthesisAction } from './syntheses/actions'
import { SynthesesRegistry } from './syntheses/syntheses-registry'
import updateDepthMapModule from './update/update-depthmap-module'
import { KEdgeView, KLabelView, KNodeView, KPortView, SKGraphView } from './views'

/**
 * Dependency injection module that adds functionality for diagrams and configures the views for SKGraphElements.
 */
const kGraphDiagramModule = new ContainerModule(
    (bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {
        bind(TYPES.ModelSource).to(KlighdDiagramServer).inSingletonScope()
        rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope()
        rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn)
        rebind(TYPES.CommandStackOptions).toConstantValue({
            // Override the default animation speed to be 500 ms, as the default value is too quick.
            defaultDuration: 500,
            undoHistoryLimit: 50,
        })
        bind(TYPES.MouseListener).to(KlighdHoverMouseListener)
        bind(TYPES.IPopupModelProvider).to(PopupModelProvider)
        rebind<HoverState>(TYPES.HoverState).toDynamicValue(() => ({
            mouseOverTimer: undefined,
            mouseOutTimer: undefined,
            popupOpen: false,
            previousPopupElement: undefined,
        }))
        rebind<ModelRendererFactory>(TYPES.ModelRendererFactory).toFactory<SKGraphModelRenderer>(
            (ctx) => (targetKind: RenderingTargetKind, processors: IVNodePostprocessor[]) => {
                const viewRegistry = ctx.container.get<ViewRegistry>(TYPES.ViewRegistry)
                return new SKGraphModelRenderer(viewRegistry, targetKind, processors)
            }
        )
        // Notes that this rebinds the Service and not the TYPE.ModelViewer intentionally as the type is bound to a dynamic value in Sprotty
        rebind(ModelViewer).to(KlighdModelViewer).inSingletonScope()

        const context = { bind, unbind, isBound, rebind }
        configureModelElement(context, 'html', HtmlRootImpl, HtmlRootView)
        configureModelElement(context, 'pre-rendered', PreRenderedElementImpl, PreRenderedView)
        configureModelElement(context, 'graph', SGraphImpl, SKGraphView)
        configureModelElement(context, NODE_TYPE, SKNode, KNodeView)
        configureModelElement(context, EDGE_TYPE, SKEdge, KEdgeView)
        configureModelElement(context, PORT_TYPE, SKPort, KPortView)
        configureModelElement(context, LABEL_TYPE, SKLabel, KLabelView)

        bind(DISymbol.SynthesesRegistry).to(SynthesesRegistry).inSingletonScope()
        configureActionHandler(context, SetSynthesesAction.KIND, DISymbol.SynthesesRegistry)
        configureActionHandler(context, SetSynthesisAction.KIND, DISymbol.SynthesesRegistry)

        bind(DISymbol.PreferencesRegistry).to(PreferencesRegistry).inSingletonScope()
        configureActionHandler(context, SetPreferencesAction.KIND, DISymbol.PreferencesRegistry)
        configureActionHandler(context, ResetPreferencesAction.KIND, DISymbol.PreferencesRegistry)

        rebind(TYPES.SvgExporter).to(KlighdSvgExporter).inSingletonScope()
    }
)

/**
 * Dependency injection container that bundles all needed sprotty and custom modules to allow SKGraphs to be drawn with sprotty.
 */
export default function createContainer(widgetId: string): Container {
    const container = new Container()
    container.load(
        defaultModule,
        selectModule,
        interactiveModule,
        viewportModule,
        exportModule,
        modelSourceModule,
        updateModule,
        hoverModule,
        // keep the klighd-specific modules at the last positions because of possible binding overrides.
        actionModule,
        optionsModule,
        sidebarModule,
        kGraphDiagramModule,
        updateDepthMapModule,
        /* bookmarkModule, */ diagramPieceModule
    )
    // FIXME: bookmarkModule is currently broken due to wrong usage of Sprotty commands. action handling needs to be reimplemented for this to work.
    overrideViewerOptions(container, {
        needsClientLayout: false,
        needsServerLayout: true,
        baseDiv: widgetId,
        hiddenDiv: `${widgetId}_hidden`,
        // TODO: We should be able to completely deactivate Sprotty's zoom limits to not limit top down layout.
        // This is a workaround to allow quite deep zoom to work for most cases already.
        zoomLimits: {
            min: 0.00000000000001,
            max: 1000000000000000,
        },
    })
    return container
}
