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
import { VNode } from "snabbdom";
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer, ICommand, SetUIExtensionVisibilityAction } from "sprotty";
import { Action, Bounds, SelectAction, SelectAllAction, SetModelAction, SModelRoot, UpdateModelAction, Viewport } from "sprotty-protocol";
import { SendModelContextAction } from "../actions/actions";
import { DISymbol } from "../di.symbols";
import { OptionsRegistry } from "../options/options-registry";
import { RenderOptionsRegistry } from "../options/render-options-registry";
import { SKNode } from "../skgraph-models";
import { getNodeByID } from "../skgraph-utils";
import { SynthesesRegistry } from "../syntheses/syntheses-registry";
import { ProxyView } from "./proxy-view";

//////// Actions ////////

/**
 * Wrapper action around {@link SetUIExtensionVisibilityAction} which shows the proxy.
 * Otherwise the proxy-view would be invisible.
 */
export type ShowProxyViewAction = SetUIExtensionVisibilityAction

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

/** Handles all actions regarding the {@link ProxyView}. */
@injectable()
export class ProxyViewActionHandler implements IActionHandler, IActionHandlerInitializer {
    private proxyView: ProxyView;
    @inject(DISymbol.SynthesesRegistry) private synthesesRegistry: SynthesesRegistry;
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;
    @inject(DISymbol.OptionsRegistry) private optionsRegistry: OptionsRegistry;
    /** Whether the proxy-view was registered in the registries' onchange() method. Prevents registering multiple times. */
    private onChangeRegistered: boolean;

    handle(action: Action): void | Action | ICommand {
        if (action.kind === SendProxyViewAction.KIND) {
            // Save the proxy-view instance
            const sPVAction = action as SendProxyViewAction;
            this.proxyView = sPVAction.proxyView;

            // Register to receive updates on registry changes
            if (!this.onChangeRegistered) {
                // Make sure the rendering cache is cleared when the renderings change
                this.synthesesRegistry.onChange(() => this.proxyView.reset());
                this.optionsRegistry.onChange(() => this.proxyView.clearRenderings());
                // Make sure to be notified when rendering options are changed
                this.renderOptionsRegistry.onChange(() => this.proxyView.updateOptions(this.renderOptionsRegistry));
                this.onChangeRegistered = true;
            }
        } else if (this.proxyView !== undefined) {
            if (action.kind === SendModelContextAction.KIND) {
                // Redirect the content to the proxy-view
                const sMCAction = action as SendModelContextAction;
                this.proxyView.update(sMCAction.model, sMCAction.context);
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

//////// Other helpers ////////

/**
 * Contains all attributes used in defining a VNode's transform attribute.
 * @example (x, y, width, height, scale, rotation)
 */
export interface TransformAttributes extends Bounds {
    readonly scale?: number;
    readonly rotation?: number;
}

/** 
 * Contains all canvas-related attributes - though `x` and `y` are unused.
 * @example (x, y, width, height, scroll, zoom)
 */
export interface CanvasAttributes extends Viewport, Bounds { }

/** A VNode containing some additional information to be used only by the {@link ProxyView}. */
export interface ProxyVNode extends VNode {
    selected?: boolean;
}

/** Util class for easyily accessing the currently selected elements. */
export class SelectedElementsUtil {
    /** The current root. */
    private static currRoot: SModelRoot;
    /** The currently selected elements. */
    private static selectedElements: SKNode[];

    //// Set methods ////

    /** Resets the selected elements. */
    static resetSelection(): void {
        this.selectedElements = [];
    }

    /** Sets the current root. */
    static setRoot(root: SModelRoot): void {
        this.currRoot = root;
    }

    // TODO: only allows for selecting nodes yet

    /** Filters the currently selected elements by checking if they can be reached from the current root. */
    static filterSelectionByRoot(): void {
        if (!this.currRoot || !this.selectedElements) {
            // Hasn't been initialized yet
            return;
        }

        // Remove all nodes that cannot be reached by currRoot
        // TODO: doing this works but results in the console logging an error
        this.selectedElements = this.selectedElements.filter(node => getNodeByID(this.currRoot, node.id));
    }

    /** Uses the selected and deselected elements' IDs to set the currently selected elements. */
    static setSelection(selectedElementsIDs: string[], deselectedElementsIDs: string[]): void {
        if (!this.currRoot || !this.selectedElements) {
            // Hasn't been initialized yet
            return;
        }

        // Remove deselected
        this.selectedElements = this.selectedElements.filter(node => node instanceof SKNode && !deselectedElementsIDs.includes(node.id));
        // Add selected
        this.selectedElements.push(...(selectedElementsIDs
            .map(id => getNodeByID(this.currRoot, id))
            .filter((node): node is SKNode => !!node))); // Type guard since getNodeByID() can return undefined
    }

    /** Sets all elements as currently selected. */
    static setSelectAll(): void {
        if (!this.currRoot || !this.selectedElements) {
            // Hasn't been initialized yet
            return;
        }
        this.selectedElements = [];

        // BFS to select all
        const queue = [this.currRoot as unknown as SKNode];
        let next = queue.pop();
        while (next) {
            this.selectedElements.push(next);
            queue.push(...(next.children as SKNode[]));
            next = queue.pop();
        }
    }

    //// Util methods ////

    /** Returns the currently selected elements. */
    static getSelectedElements(): SKNode[] {
        return this.selectedElements;
    }

    /** Returns whether there are any currently selected elements. */
    static areElementsSelected(): boolean {
        return this.selectedElements.length > 0;
    }
}

/** Handles all actions regarding the {@link SelectedElementsUtil}. */
@injectable()
export class SelectedElementsUtilActionHandler implements IActionHandler, IActionHandlerInitializer {
    handle(action: Action): void | Action | ICommand {
        if (action.kind === SetModelAction.KIND) {
            // Reset + set new root
            const setModelAction = action as SetModelAction;
            SelectedElementsUtil.resetSelection();
            SelectedElementsUtil.setRoot(setModelAction.newRoot);
        } else if (action.kind === UpdateModelAction.KIND) {
            // Set new root + filter previously selected nodes that aren't part of newRoot
            const updateModelAction = action as UpdateModelAction;
            if (updateModelAction.newRoot) {
                SelectedElementsUtil.setRoot(updateModelAction.newRoot);
                SelectedElementsUtil.filterSelectionByRoot();
            }
        } else if (action.kind === SelectAction.KIND) {
            // Set selection
            const selectAction = action as SelectAction;
            SelectedElementsUtil.setSelection(selectAction.selectedElementsIDs, selectAction.deselectedElementsIDs);
        } else if (action.kind === SelectAllAction.KIND) {
            const selectAllAction = action as SelectAllAction;
            if (selectAllAction.select) {
                // Selected all
                SelectedElementsUtil.setSelectAll();
            } else {
                // Deselected all
                SelectedElementsUtil.resetSelection();
            }
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        // New model
        registry.register(SetModelAction.KIND, this);
        registry.register(UpdateModelAction.KIND, this);
        // Selected elements
        registry.register(SelectAction.KIND, this);
        registry.register(SelectAllAction.KIND, this);
    }
}