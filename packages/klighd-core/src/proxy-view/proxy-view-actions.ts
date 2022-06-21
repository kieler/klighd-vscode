/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

import { inject, injectable, postConstruct } from "inversify";
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer, ICommand, MouseListener, SetUIExtensionVisibilityAction, SModelElement } from "sprotty";
import { Action, SetModelAction, UpdateModelAction } from "sprotty-protocol";
import { SendModelContextAction } from "../actions/actions";
import { DISymbol } from "../di.symbols";
import { OptionsRegistry } from "../options/options-registry";
import { RenderOptionsRegistry } from "../options/render-options-registry";
import { SynthesesRegistry } from "../syntheses/syntheses-registry";
import { ProxyView } from "./proxy-view";
import { ProxyViewActionsEnabled, ProxyViewAlongEdgeRouting, ProxyViewCapProxyToParent, ProxyViewCapScaleToOne, ProxyViewCategory, ProxyViewClusteringCascading, ProxyViewClusteringEnabled, ProxyViewClusteringSweepLine, ProxyViewClusterTransparent, ProxyViewDebugCategory, ProxyViewDrawEdgesAboveNodes, ProxyViewEdgesToOffScreenPoint, ProxyViewEnabled, ProxyViewHighlightSelected, ProxyViewOpacityByDistance, ProxyViewOpacityBySelected, ProxyViewSize, ProxyViewStackingOrderByDistance, ProxyViewStackingOrderByOpacity, ProxyViewStackingOrderBySelected, ProxyViewStraightEdgeRouting, ProxyViewTitleScaling, ProxyViewTransparentEdges, ProxyViewUseDetailLevel, ProxyViewUsePositionsCache, ProxyViewUseSynthesisProxyRendering } from "./proxy-view-options";

/**
 * Wrapper action around {@link SetUIExtensionVisibilityAction} which shows the proxy.
 * Otherwise the proxy-view would be invisible.
 */
export type ShowProxyViewAction = SetUIExtensionVisibilityAction;

export namespace ShowProxyViewAction {
    export function create(): ShowProxyViewAction {
        return SetUIExtensionVisibilityAction.create({
            extensionId: ProxyView.ID,
            visible: true,
        })
    }
}

/** An action containing the {@link ProxyView}. */
// Sent from the proxy-view to the action handler to avoid stackoverflows
export interface SendProxyViewAction extends Action {
    kind: typeof SendProxyViewAction.KIND;
    proxyView: ProxyView;
}

export namespace SendProxyViewAction {
    export const KIND = "sendProxyViewAction";

    export function create(proxyView: ProxyView): SendProxyViewAction {
        return {
            kind: KIND,
            proxyView
        }
    }
}

/** Handles all actions and mouse events regarding the {@link ProxyView}. */
@injectable()
export class ProxyViewActionHandler extends MouseListener implements IActionHandler, IActionHandlerInitializer {
    /** The proxy-view. */
    private proxyView: ProxyView;
    // Sidebar registries
    @inject(DISymbol.SynthesesRegistry) private synthesesRegistry: SynthesesRegistry;
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;
    @inject(DISymbol.OptionsRegistry) private optionsRegistry: OptionsRegistry;
    /** Whether the proxy-view was registered in the registries' onchange() method. Prevents registering multiple times. */
    private onChangeRegistered: boolean;

    //// Mouse events ////

    mouseDown(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        if (this.proxyView) {
            this.proxyView.setMouseDown(event);
        }
        return super.mouseDown(target, event);
    }

    mouseUp(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        if (this.proxyView) {
            this.proxyView.setMouseUp(event);
        }
        return super.mouseUp(target, event);
    }

    //// Actions ////

    @postConstruct()
    init(): void {
        //// Register options
        // Proxy-view
        this.renderOptionsRegistry.registerAll(
            ProxyViewCategory,
            ProxyViewEnabled,
            ProxyViewSize,
            ProxyViewClusteringEnabled,
            ProxyViewOpacityByDistance,
            ProxyViewActionsEnabled,
            ProxyViewStraightEdgeRouting,
            ProxyViewAlongEdgeRouting,
            ProxyViewTitleScaling
        );

        // Proxy-view debug
        this.renderOptionsRegistry.registerAll(
            ProxyViewDebugCategory,
            ProxyViewHighlightSelected,
            ProxyViewOpacityBySelected,
            ProxyViewUseSynthesisProxyRendering,
            ProxyViewCapProxyToParent,
            ProxyViewStackingOrderByDistance,
            ProxyViewStackingOrderByOpacity,
            ProxyViewStackingOrderBySelected,
            ProxyViewUseDetailLevel,
            ProxyViewDrawEdgesAboveNodes,
            ProxyViewEdgesToOffScreenPoint,
            ProxyViewTransparentEdges,
            ProxyViewCapScaleToOne,
            ProxyViewClusterTransparent,
            ProxyViewClusteringCascading,
            ProxyViewClusteringSweepLine,
            ProxyViewUsePositionsCache
        );
    }

    handle(action: Action): void | Action | ICommand {
        if (action.kind === SendProxyViewAction.KIND) {
            // Save the proxy-view instance
            const sPVAction = action as SendProxyViewAction;
            this.proxyView = sPVAction.proxyView;

            // Register to receive updates on registry changes
            // Do this here instead of in init() to ensure proxyView isn't undefined
            if (!this.onChangeRegistered) {
                // Make sure the rendering cache is cleared when the renderings change
                this.synthesesRegistry.onChange(() => this.proxyView.reset());
                this.optionsRegistry.onChange(() => this.proxyView.clearRenderings());
                // Make sure to be notified when rendering options are changed
                this.renderOptionsRegistry.onChange(() => this.proxyView.updateOptions(this.renderOptionsRegistry));
                this.onChangeRegistered = true;
            }
        } else if (this.proxyView) {
            if (action.kind === SendModelContextAction.KIND) {
                // Redirect the content to the proxy-view
                const { model, context } = action as SendModelContextAction;
                this.proxyView.update(model, context);
            } else if (action.kind === SetModelAction.KIND || action.kind === UpdateModelAction.KIND) {
                // Layout has changed, new model
                this.proxyView.reset();
            }
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        // Register as a handler to receive the actions
        registry.register(SendModelContextAction.KIND, this);
        registry.register(SendProxyViewAction.KIND, this);
        // Layout changes
        registry.register(SetModelAction.KIND, this);
        registry.register(UpdateModelAction.KIND, this);
    }
}
