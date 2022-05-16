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

import { inject, injectable } from "inversify";
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer, ICommand, SetUIExtensionVisibilityAction } from "sprotty";
import { Action, Bounds } from "sprotty-protocol";
import { SendModelContextAction } from "../actions/actions";
import { DISymbol } from "../di.symbols";
import { OptionsRegistry } from "../options/options-registry";
import { RenderOptionsRegistry } from "../options/render-options-registry";
import { SynthesesRegistry } from "../syntheses/syntheses-registry";
import { ProxyView } from "./proxy-view";

//////// Actions ////////

/** Wrapper action around {@link SetUIExtensionVisibilityAction} which shows the proxy.
  * Otherwise the proxy-view would be invisible. */
export type ShowProxyViewAction = SetUIExtensionVisibilityAction

export namespace ShowProxyViewAction {
    export function create(): ShowProxyViewAction {
        return SetUIExtensionVisibilityAction.create({
            extensionId: ProxyView.ID,
            visible: true,
        })
    }
}

/** Sent from the {@link ProxyView} to the action handler to avoid Stackoverflows. */
export interface SendProxyViewAction extends Action {
    kind: typeof SendProxyViewAction.KIND
    proxyView: ProxyView
}

export namespace SendProxyViewAction {
    export const KIND = 'sendProxyViewAction'

    export function create(proxyView: ProxyView): SendProxyViewAction {
        return {
            kind: KIND,
            proxyView
        }
    }
}

/**
 * Handles {@link SendProxyViewAction}s to get the {@link ProxyView} instance
 * aswell as {@link SendModelContextAction}s to redirect the content to the {@link ProxyView}.
 */
@injectable()
export class ProxyViewActionHandler implements IActionHandler, IActionHandlerInitializer {
    private proxyView: ProxyView;
    @inject(DISymbol.SynthesesRegistry) private synthesesRegistry: SynthesesRegistry;
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;
    @inject(DISymbol.OptionsRegistry) private optionsRegistry: OptionsRegistry;
    private onChangeRegistered: boolean;

    handle(action: Action): void | Action | ICommand {
        if (action.kind === SendProxyViewAction.KIND) {
            const sPVAction = action as SendProxyViewAction;
            this.proxyView = sPVAction.proxyView;

            // Register to receive updates on registry changes
            if (!this.onChangeRegistered) {
                // Make sure the rendering cache is cleared when the renderings change
                this.synthesesRegistry.onChange(() => { this.proxyView.clearRenderings(); this.proxyView.clearPositions() });
                this.optionsRegistry.onChange(() => this.proxyView.clearRenderings());
                // Make sure to be notified when rendering options are changed
                this.renderOptionsRegistry.onChange(() => this.proxyView.updateOptions(this.renderOptionsRegistry));
                this.onChangeRegistered = true;
            }
        } else if (action.kind === SendModelContextAction.KIND && this.proxyView !== undefined) {
            const sMCAction = action as SendModelContextAction;
            this.proxyView.update(sMCAction.model, sMCAction.context);
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        // Register as a handler to receive the actions
        registry.register(SendModelContextAction.KIND, this);
        registry.register(SendProxyViewAction.KIND, this);
    }
}

//////// Other helpers ////////

/** Contains all attributes used in defining a VNode's transform attribute. */
export interface TransformAttributes extends Bounds {
    // Inherited by Bounds
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    // Self-defined
    readonly scale?: number;
    readonly rotation?: number;
}
