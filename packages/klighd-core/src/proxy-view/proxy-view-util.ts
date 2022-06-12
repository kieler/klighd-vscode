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

import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer, ICommand, SModelRoot } from "sprotty";
import { Action, Bounds, isBounds, Point, SelectAction, SelectAllAction, SetModelAction, UpdateModelAction, Viewport } from "sprotty-protocol";
import { SendModelContextAction } from "../actions/actions";
import { SKEdge, SKGraphElement, SKLabel, SKNode, SKPort } from "../skgraph-models";
import { getElementByID } from "../skgraph-utils";

//////// Interfaces ////////

/**
 * Contains all attributes used in defining a VNode's transform attribute.
 * @example (x, y, width, height, scale, rotation)
 */
export interface TransformAttributes extends Bounds {
    readonly scale?: number;
    readonly rotation?: number;
    readonly rotationPoint?: Point;
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

//////// Functions ////////

/**
 * Checks if `b1` is (partially) in `b2`.
 * @returns `true` if `b1` is (partially) in `b2`.
 */
export function isInBounds(b1: Bounds, b2: Bounds): boolean {
    const horizontalOverlap = b1.x + b1.width >= b2.x && b1.x <= b2.x + b2.width;
    const verticalOverlap = b1.y + b1.height >= b2.y && b1.y <= b2.y + b2.height
    return horizontalOverlap && verticalOverlap;
}

/**
 * Checks if the given bounds overlap.
 * @returns `true` if there is overlap.
 */
export function checkOverlap(b1: Bounds, b2: Bounds): boolean {
    return isInBounds(b1, b2) || isInBounds(b2, b1);
}

/**
 * Returns the translated bounds, e.g. calculates its position & width/height according to scroll and zoom.
 * @param b The bounds/point to translate.
 * @param canvas The canvas' attributes.
 * @returns The translated bounds.
 */
export function getTranslatedBounds(b: Bounds | Point, canvas: CanvasAttributes): Bounds {
    if (!isBounds(b)) {
        // Actually a point, just set width and height to 0
        b = { ...b, width: 0, height: 0 };
    }

    const s = canvas.scroll;
    const z = canvas.zoom;
    return { x: (b.x - s.x) * z, y: (b.y - s.y) * z, width: b.width * z, height: b.height * z };
}

/**
 * Returns the given bounds capped to the canvas border w.r.t. the sidebar.
 * Note that the bounds need to be translated and contain the absolute position (not relative to parent).
 * @param bounds The bounds/point to cap to the canvas border, absolute and translated.
 * @param canvas The canvas' attributes.
 * @returns The given bounds capped to the canvas border w.r.t. the sidebar.
 */
export function capToCanvas(bounds: Bounds | Point, canvas: CanvasAttributes): Bounds {
    if (!isBounds(bounds)) {
        // Actually a point, just set width and height to 0
        bounds = { ...bounds, width: 0, height: 0 };
    }

    // Cap proxy at canvas border
    let x = Math.max(0, Math.min(canvas.width - bounds.width, bounds.x));
    const y = Math.max(0, Math.min(canvas.height - bounds.height, bounds.y));

    // Make sure the proxies aren't rendered behind the sidebar buttons at the top right
    // Don't reposition proxies with an open sidebar since it closes as soon as the diagram is moved (onMouseDown)
    const rect = document.querySelector(".sidebar__toggle-container")?.getBoundingClientRect();
    const isSidebarOpen = document.querySelector(".sidebar--open");
    if (!isSidebarOpen && rect && y < rect.bottom && x > rect.left - bounds.width) {
        x = rect.left - bounds.width;
    }

    return { x, y, width: bounds.width, height: bounds.height };
}

/**
 * Returns the distance between the bounds and the canvas.
 * @param bounds The bounds/point to calculate the distance for.
 * @param canvas The canvas' attributes.
 * @returns The distance between the bounds and the canvas.
 */
export function getDistanceToCanvas(bounds: Bounds | Point, canvas: CanvasAttributes): number {
    if (!isBounds(bounds)) {
        // Actually a point, just set width and height to 0
        bounds = { ...bounds, width: 0, height: 0 };
    }

    const nodeLeft = bounds.x;
    const nodeRight = nodeLeft + bounds.width;
    const nodeTop = bounds.y;
    const nodeBottom = nodeTop + bounds.height;
    const canvasLeft = 0;
    const canvasRight = canvas.width;
    const canvasTop = 0;
    const canvasBottom = canvas.height;

    /* Partition the screen plane into 9 segments (as in tic-tac-toe):
     * 1 | 2 | 3
     * --+---+--
     * 4 | 5 | 6
     * --+---+--
     * 7 | 8 | 9
     * Now 5 correlates to the canvas, e.g. the 'on-screen area'.
     * Using the other segments we can figure out the distance to the canvas:
     * 1,3,7,9: calculate euclidean distance to nearest corner of 5
     * 2,8: only take y-coordinate into consideration for calculating the distance
     * 4,6: only take x-coordinate into consideration for calculating the distance
     */
    let dist = 0;
    if (nodeBottom < canvasTop) {
        // Above canvas (1,2,3)
        if (nodeRight < canvasLeft) {
            // Top left (1)
            dist = Point.euclideanDistance({ y: nodeBottom, x: nodeRight }, { y: canvasTop, x: canvasLeft });
        } else if (nodeLeft > canvasRight) {
            // Top right (3)
            dist = Point.euclideanDistance({ y: nodeBottom, x: nodeLeft }, { y: canvasTop, x: canvasRight });
        } else {
            // Top middle (2)
            dist = canvasTop - nodeBottom;
        }
    } else if (nodeTop > canvasBottom) {
        // Below canvas (7,8,9)
        if (nodeRight < canvasLeft) {
            // Bottom left (7)
            dist = Point.euclideanDistance({ y: nodeTop, x: nodeRight }, { y: canvasBottom, x: canvasLeft });
        } else if (nodeLeft > canvasRight) {
            // Bottom right (9)
            dist = Point.euclideanDistance({ y: nodeTop, x: nodeLeft }, { y: canvasBottom, x: canvasRight });
        } else {
            // Bottom middle (8)
            dist = nodeTop - canvasBottom;
        }
    } else {
        // Same height as canvas (4,5,6)
        if (nodeRight < canvasLeft) {
            // Left of canvas (4)
            dist = canvasLeft - nodeRight;
        } else if (nodeLeft > canvasRight) {
            // Right of canvas (6)
            dist = nodeLeft - canvasRight;
        } else {
            // On the canvas (5)
            dist = 0;
        }
    }

    return dist;
}

/**
 * Updates a VNode's transform attribute.
 * @param vnode The VNode.
 * @param transform The TransformAttributes.
 */
export function updateTransform(vnode: VNode, transform: TransformAttributes): void {
    // Just changing the VNode's transform attribute is insufficient
    // as it doesn't change the document's transform attribute while on the canvas
    if (vnode.data) {
        if (!vnode.data.attrs) {
            vnode.data.attrs = {};
        }
        let transformString = `translate(${transform.x}, ${transform.y})`;
        if (transform.scale) {
            transformString += ` scale(${transform.scale})`;
        }
        if (transform.rotation) {
            transformString += ` rotate(${transform.rotation}`;
            if (transform.rotationPoint) {
                transformString += `, ${transform.rotationPoint.x}, ${transform.rotationPoint.y}`;
            }
            transformString += ")";
        }

        // Update transform while off the canvas
        vnode.data.attrs["transform"] = transformString;

        // Update transform while on the canvas
        document.getElementById(`keith-diagram_sprotty_${vnode.key?.toString()}`)?.setAttribute("transform", transformString);
    }
}

/**
 * Updates a VNode's opacity.
 * @param vnode The VNode.
 * @param opacity The new opacity.
 */
export function updateOpacity(vnode: VNode, opacity: number): void {
    // Just changing the VNode's opacity is insufficient
    // as it doesn't change the document's opacity while on the canvas
    if (vnode.data) {
        if (!vnode.data.style) {
            vnode.data.style = {};
        }
        // Update opacity while off the canvas
        vnode.data.style["opacity"] = opacity.toString();

        // Update opacity while on the canvas
        const element = document.getElementById(`keith-diagram_sprotty_${vnode.key?.toString()}`);
        if (element) {
            element.style.opacity = opacity.toString();
        }
    }
}

/**
 * Updates a VNode's pointer-events to make it click-through.
 * @param vnode The VNode.
 * @param clickThrough Whether the VNode should be click-through.
 */
export function updateClickThrough(vnode: VNode, clickThrough: boolean): void {
    // Just changing the VNode's pointer-events is insufficient
    // as it doesn't change the document's pointer-events while on the canvas
    if (vnode.data) {
        if (!vnode.data.style) {
            vnode.data.style = {};
        }
        const pointerEvent = clickThrough ? "none" : "auto";
        // Update pointer-events while off the canvas
        vnode.data.style["pointer-events"] = pointerEvent;

        // Update pointer-events while on the canvas
        const element = document.getElementById(`keith-diagram_sprotty_${vnode.key?.toString()}`);
        if (element) {
            element.style.pointerEvents = pointerEvent;
        }
    }
}

/**
 * Checks if `item` is contained in any (nested) group, e.g. if `item` is contained in a flattened version of `groups`.
 * @returns `true` if `item` is contained in any (nested) group.
 * @example anyContains([[0, 1], [1, 2]], 2) === true
 */
export function anyContains<T>(groups: T[][], item: T): boolean {
    return groups.reduce((acc, group) => acc.concat(group), []).includes(item);
}

/**
 * Join groups containing at least 1 same element. Transitive joining applies:
 * @example joinTransitiveGroups([[0, 1], [1, 2], [2, 3]]) === [[0, 1, 2, 3]]
 */
export function joinTransitiveGroups<T>(groups: T[][]): T[][] {
    const res = [];
    while (groups.length > 0) {
        // Use a set for removing duplicates
        let firstGroup = Array.from(new Set(groups.shift()));
        let remainingGroups = [...groups];

        let prevLength = -1;
        while (firstGroup.length > prevLength) {
            // Iterate until no group can be joined with firstGroup anymore
            prevLength = firstGroup.length;
            const nextRemainingGroups = [];
            for (const group of remainingGroups) {
                if (new Set([...firstGroup].filter(x => group.includes(x))).size > 0) {
                    // Intersection of firstGroup and group is not empty, join both groups
                    firstGroup = Array.from(new Set(firstGroup.concat(group)));
                } else {
                    // firstGroup and group share no element
                    nextRemainingGroups.push(group);
                }
            }
            remainingGroups = nextRemainingGroups;
        }

        // firstGroup has been fully joined, add to res and continue with remainingGroups
        res.push(Array.from(new Set(firstGroup)));
        groups = remainingGroups;
    }
    return res;
}

/**
 * Checks if `node` has an incoming edge to at least one of the other given `nodes`.
 * @returns `true` if `node` has an incoming edge to at least one of the other given `nodes`.
 */
export function isIncomingToAny(node: SKNode, nodes: SKNode[]): boolean {
    const ids = nodes.map(node => node.id);
    return ids.length > 0 && (node.incomingEdges as SKEdge[])
        .some(edge => ids.includes(edge.sourceId));
}

/**
 * Checks if `node` has an outgoing edge to at least one of the other given `nodes`.
 * @returns `true` if `node` has an outgoing edge to at least one of the other given `nodes`.
 */
export function isOutgoingToAny(node: SKNode, nodes: SKNode[]): boolean {
    const ids = nodes.map(node => node.id);
    return ids.length > 0 && (node.outgoingEdges as SKEdge[])
        .some(edge => ids.includes(edge.targetId));
}

/**
 * Checks if `node` is connected to at least one of the other given `nodes`.
 * @returns `true` if `node` is connected to at least one of the other given `nodes`.
 */
export function isConnectedToAny(node: SKNode, nodes: SKNode[]): boolean {
    return isIncomingToAny(node, nodes) || isOutgoingToAny(node, nodes);
}

/** Checks if `node` is selected or connected to any selected element. */
export function isSelectedOrConnectedToSelected(node: SKNode): boolean {
    const selectedNodes = SelectedElementsUtil.getSelectedNodes();
    return node.selected || isConnectedToAny(node, selectedNodes);
}

//////// Classes ////////

// TODO: GetSelectionAction
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
