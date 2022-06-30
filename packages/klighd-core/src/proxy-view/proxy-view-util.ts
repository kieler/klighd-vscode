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

import { KGraphData } from "@kieler/klighd-interactive/lib/constraint-classes";
import { injectable } from "inversify";
import { VNode } from "snabbdom";
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer, ICommand, SModelRoot } from "sprotty";
import { Action, Bounds, isBounds, Dimension, Point, SelectAction, SelectAllAction, SetModelAction, UpdateModelAction, Viewport } from "sprotty-protocol";
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
 * Contains all canvas-related attributes.
 * @acronym CRF - Canvas Reference Frame.
 * @acronym LRF - Local Reference Frame.
 * @example (x, y, width, height, scroll, zoom)
 */
export interface Canvas extends Viewport, Bounds {
    /**
     * Whether the canvas is in LRF, e.g. not in CRF.
     * Usually doesn't need to be set explicitly - handled by translation methods.
     * When the canvas hasn't been translated yet, this should be `undefined` or `false`,
     * as the canvas should be in the CRF.
     */
    isInLRF?: boolean;
}

export namespace Canvas {

    //// Translation ////

    /**
     * Returns the bounds translated from the LRF to the CRF.
     * E.g. calculates its position & width/height according to scroll and zoom.
     * Inverse to {@link translateToLRF()}.
     * @param bpd The bounds/point/dimension in the LRF.
     * @param canvas The canvas.
     * @returns The bounds translated to the CRF.
     */
    export function translateToCRF(bpd: Bounds | Point | Dimension, canvas: Canvas): Bounds {
        const b = toBounds(bpd);
        console.log("Bounds LRF -> CRF");

        const s = canvas.scroll;
        const z = canvas.zoom;
        return { x: (b.x - s.x) * z, y: (b.y - s.y) * z, width: b.width * z, height: b.height * z };
    }

    /**
     * Returns the bounds translated from the CRF to the LRF.
     * Inverse to {@link translateToCRF()}.
     * @param bpd The bounds/point/dimension in the CRF.
     * @param canvas The canvas.
     * @returns The bounds translated to the LRF.
     */
    export function translateToLRF(bpd: Bounds | Point | Dimension, canvas: Canvas): Bounds {
        const b = toBounds(bpd);
        console.log("Bounds CRF -> LRF");

        const s = canvas.scroll;
        const z = canvas.zoom;
        return { x: b.x / z + s.x, y: b.y / z + s.y, width: b.width / z, height: b.height / z };
    }

    /**
     * Convenience function.
     * Adds `p1` and `p2` and translates the result to the CRF.
     * @param p1 The first point.
     * @param p2 The second point.
     * @param canvas The canvas.
     */
    export function translateToCRFAdd(p1: Point, p2: Point, canvas: Canvas): Point {
        return translateToCRF(Point.add(p1, p2), canvas);
    }

    /**
     * Convenience function.
     * Translates the canvas from the LRF to the CRF, if not already in CRF.
     * Inverse to {@link translateCanvasToLRF()}.
     * @param canvas The canvas.
     * @returns The canvas translated to the CRF.
     */
    export function translateCanvasToCRF(canvas: Canvas): Canvas {
        if (canvas.isInLRF) {
            return { ...canvas, ...translateToCRF(canvas, canvas), isInLRF: false };
        } else {
            return canvas;
        }
    }

    /**
     * Convenience function.
     * Translates the canvas from the CRF to the LRF, if not already in LRF.
     * Inverse to {@link translateCanvasToCRF()}.
     * @param canvas The canvas.
     * @returns The canvas translated to the LRF.
     */
    export function translateCanvasToLRF(canvas: Canvas): Canvas {
        if (canvas.isInLRF) {
            return canvas;
        } else {
            return { ...canvas, ...translateToLRF(canvas, canvas), isInLRF: true };
        }
    }

    //// Functions invariant to Reference Frame ////

    /**
     * Checks if `b` is (partially) on-screen.
     * Note that `b` and `canvas` need to be in the same Reference Frame.
     * @returns `true` if `b` is (partially) on-screen.
     */
    export function isOnScreen(b: Bounds, canvas: Canvas): boolean {
        return isInBounds(b, canvas);
    }

    /**
     * Returns the distance between the bounds and the canvas.
     * @see {@link distanceBetweenBounds()} for an explanation on how the distance is calculated.
     * Note that `bp` and `canvas` need to be in the same Reference Frame.
     * 
     * @param bp The bounds/point to calculate the distance to the canvas for.
     * @param canvas The canvas.
     * @returns The distance between the bounds and the canvas.
     */
    export function distance(bp: Bounds | Point, canvas: Canvas): number {
        const dist = distanceBetweenBounds(bp, canvas);
        return dist * (canvas.isInLRF ? canvas.zoom : 1);
    }

    //// CRF Functions ////

    /**
     * Returns the given bounds capped to the canvas border w.r.t. the sidebar.
     * Note that `bp` and `canvas` need to be in CRF.
     * Also, `bp` has to contain the absolute position (not relative to parent).
     * @param bp The bounds/point to cap to the canvas border, absolute.
     * @param canvas The canvas.
     * @param offset An optional offset. Values `>0` reduce the canvas size.
     * @returns The given bounds capped to the canvas border w.r.t. the sidebar.
     */
    export function capToCanvas(bp: Bounds | Point, canvas: Canvas, offset = Rect.EMPTY): Bounds {
        const bounds = toBounds(bp);

        // Cap proxy at canvas border
        let x = capNumber(bounds.x, canvas.x + offset.left, canvas.x + canvas.width - bounds.width - offset.right);
        const y = capNumber(bounds.y, canvas.y + offset.top, canvas.y + canvas.height - bounds.height - offset.bottom);

        // Make sure the proxies aren't rendered behind the sidebar buttons at the top right
        // Don't reposition proxies with an open sidebar since it closes as soon as the diagram is moved (onMouseDown)
        const rect = document.querySelector(".sidebar__toggle-container")?.getBoundingClientRect();
        const isSidebarOpen = document.querySelector(".sidebar--open");
        if (!isSidebarOpen && rect && y < rect.bottom + offset.top && x > rect.left - bounds.width - offset.right) {
            x = rect.left - bounds.width - offset.right;
        }

        return { x, y, width: bounds.width, height: bounds.height };
    }
}

/** Like {@link Bounds} but contains coordinates instead of width and height. */
export interface Rect {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
}

export namespace Rect {
    /** A Rect with all coordinates as zeros. */
    export const EMPTY: Rect = Object.freeze({ left: 0, right: 0, top: 0, bottom: 0 });

    /**
     * Returns `b` as a Rect.
     * @param b The Bounds to transform into a Rect.
     * @returns The Rect corresponding to `b`.
     */
    export function fromBounds(b: Bounds): Rect {
        return { left: b.x, right: b.x + b.width, top: b.y, bottom: b.y + b.height };
    }

    /**
     * Returns `r` as Bounds.
     * @param r The Rect to transform into Bounds.
     * @returns The Bounds corresponding to `r`.
     */
    export function toBounds(r: Rect): Bounds {
        return { x: r.left, y: r.top, width: r.right - r.left, height: r.bottom - r.top };
    }
}

/** A VNode containing some additional information to be used only by the {@link ProxyView}. */
export interface ProxyVNode extends VNode {
    /** Whether this vnode is selected. */
    selected?: boolean;
}

/** KGraphData containing some additional information to be used only by the {@link ProxyView}. */
export interface ProxyKGraphData extends KGraphData {
    /** The proxy's scale. */
    proxyScale: number;
    /** Whether title scaling should be used if smart zoom is enabled. */
    useTitleScaling: boolean;
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
 * Returns `bpd` if given bounds, otherwise fills the empty attributes with {@link Bounds.EMPTY}.
 * @param bpd The bounds/point/dimension.
 */
export function toBounds(bpd: Bounds | Point | Dimension): Bounds {
    return isBounds(bpd) ? bpd : { ...Bounds.EMPTY, ...bpd };
}

/**
 * Returns `n` capped to the range given by `min` and `max` (inclusive), e.g. `n` in `[min, max]`.
 * @param n The number to cap.
 * @param min The lower bound of the range.
 * @param max The upper bound of the range.
 * @returns `n` capped to the given range or `NaN` if `min > max`.
 */
export function capNumber(n: number, min: number, max: number): number {
    if (min > max) {
        return Number.NaN;
    }
    return Math.max(min, Math.min(max, n));
}

/**
 * Returns the distance between two bounds. If given two points, this
 * basically just calculates the euclidean distance between the two.
 * Explanation on how the distance is calculated:
 * 
 * Partition the plane into 9 segments (as in tic-tac-toe):
 * 
 * 1 | 2 | 3
 * 
 * --+---+--
 * 
 * 4 | 5 | 6
 * 
 * --+---+--
 * 
 * 7 | 8 | 9
 * 
 * Now 5 correlates to b2.
 * 
 * Using the other segments we can figure out the distance from b1 to b2:
 * 
 * 1,3,7,9: calculate euclidean distance to nearest corner of 5
 * 
 * 2,8: only take y-coordinate into consideration for calculating the distance
 * 
 * 4,6: only take x-coordinate into consideration for calculating the distance
 * 
 * @param bp1 The first bounds/point to calculate the distance for.
 * @param bp2 The second bounds/point to calculate the distance for.
 * @returns The distance between the two bounds.
 */
export function distanceBetweenBounds(bp1: Bounds | Point, bp2: Bounds | Point): number {
    const b1 = toBounds(bp1);
    const b2 = toBounds(bp2);

    const b1Left = b1.x;
    const b1Right = b1Left + b1.width;
    const b1Top = b1.y;
    const b1Bottom = b1Top + b1.height;
    const b2Left = b2.x;
    const b2Right = b2Left + b2.width;
    const b2Top = b2.y;
    const b2Bottom = b2Top + b2.height;

    let dist = 0;
    if (b1Bottom < b2Top) {
        // b1 above b2 (1,2,3)
        if (b1Right < b2Left) {
            // b1 top left of b2 (1)
            dist = Point.euclideanDistance({ y: b1Bottom, x: b1Right }, { y: b2Top, x: b2Left });
        } else if (b1Left > b2Right) {
            // b1 top right of b2 (3)
            dist = Point.euclideanDistance({ y: b1Bottom, x: b1Left }, { y: b2Top, x: b2Right });
        } else {
            // b1 top middle of b2 (2)
            dist = b2Top - b1Bottom;
        }
    } else if (b1Top > b2Bottom) {
        // b1 below b2 (7,8,9)
        if (b1Right < b2Left) {
            // b1 bottom left of b2 (7)
            dist = Point.euclideanDistance({ y: b1Top, x: b1Right }, { y: b2Bottom, x: b2Left });
        } else if (b1Left > b2Right) {
            // b1 bottom right of b2 (9)
            dist = Point.euclideanDistance({ y: b1Top, x: b1Left }, { y: b2Bottom, x: b2Right });
        } else {
            // b1 bottom middle of b2 (8)
            dist = b1Top - b2Bottom;
        }
    } else {
        // b1 same height as b2 (4,5,6)
        if (b1Right < b2Left) {
            // b1 left of b2 (4)
            dist = b2Left - b1Right;
        } else if (b1Left > b2Right) {
            // b1 right of b2 (6)
            dist = b1Left - b2Right;
        } else {
            // b1 on b2 (overlap) (5)
            dist = 0;
        }
    }
    return dist;
}

/**
 * Returns the intersection between the line spanned from `p1` to `p2` and `b`.
 * @param p1 The start of the line.
 * @param p2 The end of the line.
 * @param b The bounds.
 * @param offset An optional offset. Values `>0` reduce `b`'s size.
 * @returns The intersection between the line and bounds or `undefined` if there is none.
 */
export function getIntersection(p1: Point, p2: Point, b: Bounds, offset = Rect.EMPTY): Point | undefined {
    // Intersection iff one of [p1, p2] in bounds and the other one out of bounds
    const r = {left: b.x + offset.left, right: b.x + b.width - offset.right, top: b.y + offset.top, bottom: b.y + b.height - offset.bottom};

    if (p1.x >= r.left && p1.x <= r.right && p1.y >= r.top && p1.y <= r.bottom) {
        // Intersection if p2 out of bounds
        if (p2.x < r.left || p2.x > r.right) {
            // Intersection at x, find y
            const leftOrRight = p2.x < r.left ? r.left : r.right;

            // Scalar of line equation, must be in [0,1] as to not be before p1 or after p2, could be ±inf
            const scalar = capNumber((leftOrRight - p1.x) / (p2.x - p1.x), 0, 1);

            // Intersection point, cap to canvas with offset (and to sidebar aswell)
            const intersectY = p1.y + scalar * (p2.y - p1.y);
            return { x: leftOrRight, y: intersectY };
        } else if (p2.y < r.top || p2.y > r.bottom) {
            // Intersection at y, find x
            const topOrBottom = p2.y < r.top ? r.top : r.bottom;

            // Scalar of line equation, must be in [0,1] as to not be before p1 or after p2, could be ±inf
            const scalar = capNumber((topOrBottom - p1.y) / (p2.y - p1.y), 0, 1);

            // Intersection point
            const intersectX = p1.x + scalar * (p2.x - p1.x);
            return { x: intersectX, y: topOrBottom };
        }
    } else if (p2.x >= r.left && p2.x <= r.right && p2.y >= r.top && p2.y <= r.bottom) {
        // p1 out of bounds and p2 in bounds, definitely an intersection
        if (p1.x < r.left || p1.x > r.right) {
            // Intersection at x, find y
            const leftOrRight = p1.x < r.left ? r.left : r.right;

            // Scalar of line equation, must be in [0,1] as to not be before p2 or after p1, could be ±inf
            const scalar = capNumber((leftOrRight - p2.x) / (p1.x - p2.x), 0, 1);

            // Intersection point, cap to canvas with offset (and to sidebar aswell)
            const intersectY = p2.y + scalar * (p1.y - p2.y);
            return { x: leftOrRight, y: intersectY };
        } else {
            // Intersection at y, find x
            const topOrBottom = p1.y < r.top ? r.top : r.bottom;

            // Scalar of line equation, must be in [0,1] as to not be before p2 or after p1, could be ±inf
            const scalar = capNumber((topOrBottom - p2.y) / (p1.y - p2.y), 0, 1);

            // Intersection point
            const intersectX = p2.x + scalar * (p1.x - p2.x);
            return { x: intersectX, y: topOrBottom };
        }
    }

    // No intersection
    return undefined;
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
