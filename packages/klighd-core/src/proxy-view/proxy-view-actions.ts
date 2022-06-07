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
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer, ICommand, MouseListener, SetUIExtensionVisibilityAction, SModelElement, SModelRoot } from "sprotty";
import { Action, Bounds, SelectAction, SelectAllAction, SetModelAction, UpdateModelAction, Viewport } from "sprotty-protocol";
import { SendModelContextAction } from "../actions/actions";
import { DISymbol } from "../di.symbols";
import { OptionsRegistry } from "../options/options-registry";
import { RenderOptionsRegistry } from "../options/render-options-registry";
import { SKEdge, SKGraphElement, SKLabel, SKNode, SKPort } from "../skgraph-models";
import { getElementByID } from "../skgraph-utils";
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

    handle(action: Action): void | Action | ICommand {
        if (action.kind === SendProxyViewAction.KIND) {
            // Save the proxy-view instance
            const sPVAction = action as SendProxyViewAction;
            this.proxyView = sPVAction.proxyView;
            // this.mouseListener.setProxyView(sPVAction.proxyView);

            // Register to receive updates on registry changes
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
    private static selectedElements: SKGraphElement[];
    /** Cache of {@link selectedElements} containing only selected nodes. */
    private static nodeCache?: SKNode[];
    /** Cache of {@link selectedElements} containing only selected edges. */
    private static edgeCache?: SKEdge[];
    /** Cache of {@link selectedElements} containing only selected labels. */
    private static labelCache?: SKLabel[];
    /** Cache of {@link selectedElements} containing only selected ports. */
    private static portCache?: SKPort[];

    /**
     * Clears all caches if the lengths of `nextSelectedElements` and {@link selectedElements} are not equal.
     * `nextSelectedElements` should equal {@link selectedElements} with some elements possibly either removed or added, not both.
     * Therefore this should always be called before changing {@link selectedElements}.
     */
    private static clearCaches(nextSelectedElements: SKGraphElement[]): void {
        if (this.selectedElements && nextSelectedElements.length !== this.selectedElements.length) {
            this.nodeCache = undefined;
            this.edgeCache = undefined;
            this.labelCache = undefined;
            this.portCache = undefined;
        }
    }

    //// Set methods ////

    /** Resets the selected elements. */
    static resetSelection(): void {
        this.clearCaches([]);
        this.selectedElements = [];
    }

    /** Sets the current root. */
    static setRoot(root: SModelRoot): void {
        this.currRoot = root;
    }

    /** Filters the currently selected elements by checking if they can be reached from the current root. */
    static filterSelectionByRoot(): void {
        if (!this.currRoot || !this.selectedElements) {
            // Hasn't been initialized yet
            return;
        }

        // Using filter() is insufficient as the nodes may have changed though the ids didn't
        // Also, selectedElementsIDs may have ids that correspond to non-existing nodes under currRoot
        // which is not a problem as these just won't be added
        const selectedElementsIDs = this.selectedElements.map(node => node.id);
        this.resetSelection();
        this.setSelection(selectedElementsIDs, []);
    }

    /** Uses the selected and deselected elements' IDs to set the currently selected elements. */
    static setSelection(selectedElementsIDs: string[], deselectedElementsIDs: string[]): void {
        if (!this.currRoot || !this.selectedElements) {
            // Hasn't been initialized yet
            return;
        } else if (selectedElementsIDs.length <= 0 && deselectedElementsIDs.length <= 0) {
            // Nothing to do
            return;
        }

        // Remove deselected
        const deselectedRemoved = this.selectedElements.filter(node => !deselectedElementsIDs.includes(node.id));
        this.clearCaches(deselectedRemoved);
        this.selectedElements = deselectedRemoved;

        // selectedElementsIDs may have ids of already selected elements, don't select twice
        selectedElementsIDs = selectedElementsIDs.filter(id => !this.selectedElements.some(node => node.id === id));

        // Add selected
        const selectedAdded = this.selectedElements.concat(selectedElementsIDs
            .map(id => getElementByID(this.currRoot, id, true))
            .filter((node): node is SKGraphElement => !!node)); // Type guard since getNodeByID() can return undefined
        this.clearCaches(selectedAdded);
        this.selectedElements = selectedAdded;
    }

    /** Sets all elements as currently selected. */
    static setSelectAll(): void {
        if (!this.currRoot || !this.selectedElements) {
            // Hasn't been initialized yet
            return;
        }

        // BFS to select all
        const queue: SKGraphElement[] = [this.currRoot as unknown as SKGraphElement];
        const allSelectedElements = [];
        let next = queue.pop();
        while (next) {
            allSelectedElements.push(next);
            queue.push(...(next.children as unknown as SKGraphElement[]));
            next = queue.pop();
        }
        this.clearCaches(allSelectedElements);
        this.selectedElements = allSelectedElements;
    }

    //// Util methods ////

    /** Returns the currently selected elements. */
    static getSelectedElements(): SKGraphElement[] {
        return this.selectedElements;
    }

    /** Returns whether there are any currently selected elements. */
    static areElementsSelected(): boolean {
        return this.getSelectedElements().length > 0;
    }

    /** Returns the currently selected nodes. */
    static getSelectedNodes(): SKNode[] {
        this.nodeCache = this.nodeCache ?? this.selectedElements.filter(node => node instanceof SKNode) as SKNode[];
        return this.nodeCache;
    }

    /** Returns whether there are any currently selected nodes. */
    static areNodesSelected(): boolean {
        return this.getSelectedNodes().length > 0;
    }

    /** Returns the currently selected edges. */
    static getSelectedEdges(): SKEdge[] {
        this.edgeCache = this.edgeCache ?? this.selectedElements.filter(node => node instanceof SKEdge) as SKEdge[];
        return this.edgeCache;
    }

    /** Returns whether there are any currently selected edges. */
    static areEdgesSelected(): boolean {
        return this.getSelectedEdges().length > 0;
    }

    /** Returns the currently selected labels. */
    static getSelectedLabels(): SKLabel[] {
        this.labelCache = this.labelCache ?? this.selectedElements.filter(node => node instanceof SKLabel) as SKLabel[];
        return this.labelCache;
    }

    /** Returns whether there are any currently selected labels. */
    static areLabelsSelected(): boolean {
        return this.getSelectedLabels().length > 0;
    }

    /** Returns the currently selected ports. */
    static getSelectedPorts(): SKPort[] {
        this.portCache = this.portCache ?? this.selectedElements.filter(node => node instanceof SKPort) as SKPort[];
        return this.portCache;
    }

    /** Returns whether there are any currently selected ports. */
    static arePortsSelected(): boolean {
        return this.getSelectedPorts().length > 0;
    }
}

/** Handles all actions regarding the {@link SelectedElementsUtil}. */
@injectable()
export class SelectedElementsUtilActionHandler implements IActionHandler, IActionHandlerInitializer {
    /**
     * Whether the selection should be filtered to only include elements of the current root
     * once the next {@link SendModelContextAction} is received.
     */
    private filterSelectionByRoot: boolean;

    handle(action: Action): void | Action | ICommand {
        if (action.kind === SetModelAction.KIND) {
            // Reset
            SelectedElementsUtil.resetSelection();
        } else if (action.kind === UpdateModelAction.KIND) {
            // Set new root + filter previously selected nodes that aren't part of newRoot
            const updateModelAction = action as UpdateModelAction;
            this.filterSelectionByRoot ||= !!updateModelAction.newRoot;
        } else if (action.kind === SendModelContextAction.KIND) {
            // Set new root
            const sMCAction = action as SendModelContextAction;
            SelectedElementsUtil.setRoot(sMCAction.model.root);
            if (this.filterSelectionByRoot) {
                SelectedElementsUtil.filterSelectionByRoot();
                this.filterSelectionByRoot = false;
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
        registry.register(SendModelContextAction.KIND, this);
        // Selected elements
        registry.register(SelectAction.KIND, this);
        registry.register(SelectAllAction.KIND, this);
    }
}