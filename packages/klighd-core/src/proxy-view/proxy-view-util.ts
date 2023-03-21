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
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer, ICommand, isSelectable, ModelIndexImpl, SModelRoot } from "sprotty";
import { Action, Bounds, isBounds, Dimension, Point, SetModelAction, UpdateModelAction, Viewport } from "sprotty-protocol";
import { SendModelContextAction } from "../actions/actions";
import { isSKGraphElement, SKEdge, SKGraphElement, SKLabel, SKNode, SKPort } from "../skgraph-models";

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
 * CRF - Canvas Reference Frame.
 * The canvas reference frames is the coordinate system defined by the viewport bounds.
 * The position (0,0) is in the top left corner of the viewport on the canvas. This means
 * that scroll and zoom are already accounted for.
 * GRF - Global Reference Frame.
 * The global reference frame is the coordinate system defined by the svg bounds. The 
 * position (0,0) is the top left corner of the svg. All coordinates are absolute
 * positions in the svg.
 * @example (x, y, width, height, scroll, zoom)
 */
export interface Canvas extends Viewport, Bounds {
    /**
     * Whether the canvas is in GRF, i.e. not in CRF.
     * Usually doesn't need to be set explicitly - handled by translation methods.
     * When the canvas hasn't been translated yet, this should be `undefined` or `false`,
     * as the canvas should be in the CRF.
     */
    isInGRF?: boolean;
}

export namespace Canvas {
    //// Get Canvas ////
    /**
     * Creates a canvas in CRF.
     * @param boundsOrRoot The canvas' bounds or the root element.
     * @param viewport The viewport.
     * @returns The canvas.
     */
    export function of(boundsOrRoot: Bounds | SModelRoot, viewport: Viewport): Canvas {
        const canvasBounds = isBounds(boundsOrRoot) ? boundsOrRoot : boundsOrRoot.canvasBounds;
        return { ...canvasBounds, scroll: viewport.scroll, zoom: viewport.zoom };
    }

    //// Translation ////

    /**
     * Returns the bounds translated from the GRF to the CRF.
     * E.g. calculates its position & width/height according to scroll and zoom.
     * Inverse to {@link translateToGRF()}.
     * @param originalBounds The bounds/point/dimension in the GRF.
     * @param canvas The canvas.
     * @returns The bounds translated to the CRF.
     */
    export function translateToCRF(originalBounds: Bounds | Point | Dimension, canvas: Canvas): Bounds {
        const bounds = asBounds(originalBounds);

        const scroll = canvas.scroll;
        const zoom = canvas.zoom;
        return {
            x: (bounds.x - scroll.x) * zoom,
            y: (bounds.y - scroll.y) * zoom,
            width: bounds.width * zoom,
            height: bounds.height * zoom
        };
    }

    /**
     * Returns the bounds translated from the CRF to the GRF.
     * Inverse to {@link translateToCRF()}.
     * @param originalBounds The bounds/point/dimension in the CRF.
     * @param canvas The canvas.
     * @returns The bounds translated to the GRF.
     */
    export function translateToGRF(originalBounds: Bounds | Point | Dimension, canvas: Canvas): Bounds {
        const bounds = asBounds(originalBounds);

        const scroll = canvas.scroll;
        const zoom = canvas.zoom;
        return {
            x: bounds.x / zoom + scroll.x,
            y: bounds.y / zoom + scroll.y,
            width: bounds.width / zoom,
            height: bounds.height / zoom
        };
    }

    /**
     * Adds `p1` and `p2` and translates the result to the CRF.
     * @param p1 The first point.
     * @param p2 The second point.
     * @param canvas The canvas.
     */
    export function translateToCRFAdd(p1: Point, p2: Point, canvas: Canvas): Point {
        return translateToCRF(Point.add(p1, p2), canvas);
    }

    /**
     * Translates the canvas from the GRF to the CRF, if not already in CRF.
     * Inverse to {@link translateCanvasToGRF()}.
     * @param canvas The canvas.
     * @returns The canvas translated to the CRF.
     */
    export function translateCanvasToCRF(canvas: Canvas): Canvas {
        if (canvas.isInGRF) {
            return { ...canvas, ...translateToCRF(canvas, canvas), isInGRF: false };
        } else {
            return canvas;
        }
    }

    /**
     * Translates the canvas from the CRF to the GRF, if not already in GRF.
     * Inverse to {@link translateCanvasToCRF()}.
     * @param canvas The canvas.
     * @returns The canvas translated to the GRF.
     */
    export function translateCanvasToGRF(canvas: Canvas): Canvas {
        if (canvas.isInGRF) {
            return canvas;
        } else {
            return { ...canvas, ...translateToGRF(canvas, canvas), isInGRF: true };
        }
    }

    //// Functions invariant to Reference Frame ////

    /**
     * Checks if `bounds` is (partially) on-screen.
     * Note that `bounds` and `canvas` need to be in the same Reference Frame.
     * @param bounds The bounds to check.
     * @returns `true` if `b` is (partially) on-screen.
     */
    export function isOnScreen(bounds: Bounds, canvas: Canvas): boolean {
        return isInBounds(bounds, canvas);
    }

    /**
     * Returns the distance between the bounds and the canvas.
     * @see {@link distanceBetweenBounds()} for an explanation on how the distance is calculated.
     * Note that `bounds` and `canvas` need to be in the same Reference Frame.
     * 
     * @param bounds The bounds/point to calculate the distance to the canvas for.
     * @param canvas The canvas.
     * @returns The distance between the bounds and the canvas.
     */
    export function distance(bounds: Bounds | Point, canvas: Canvas): number {
        const dist = distanceBetweenBounds(bounds, canvas);
        return dist * (canvas.isInGRF ? canvas.zoom : 1);
    }

    /**
     * Performs along-border-routing from `from` to `to`, both of which need to be at their respective border already.
     * Note that `from` and `to` are not part of the returned path.
     * @param from The bounds/point to route along the border from.
     * @param fromBorder The border for `from`.
     * @param to The bounds/point to route along the border to.
     * @param toBorder The border for `to`.
     * @param preferLeft Whether routing left should be preferred when `from` and `to` are vertically opposite of each other.
     * @param preferTop Whether routing top should be preferred when `from` and `to` are horizontally opposite of each other.
     * @returns A path along the border from `from` to `to`. Exclusive, e.g. (from, to).
     */
    export function routeAlongBorder(from: Bounds | Point, fromBorder: Bounds, to: Bounds | Point, toBorder: Bounds, preferLeft = true, preferTop = false): Point[] {
        const res = [];

        const toRect = Rect.fromBounds(asBounds(to));
        const toBorderRect = Rect.fromBounds(toBorder);
        const fromRect = Rect.fromBounds(asBounds(from));
        const fromBorderRect = Rect.fromBounds(fromBorder);
        let x, y;
        if (fromRect.left === fromBorderRect.left) {
            // from at the left
            x = fromBorderRect.left;
            if (toRect.left === toBorderRect.left) {
                // to at the left
                // Nothing to do
            } else if (toRect.right === toBorderRect.right) {
                // to at the right
                if (toRect.top === toBorderRect.top) {
                    // to at the top, add a point to top left
                    y = fromBorderRect.top;
                } else if (toRect.bottom === toBorderRect.bottom) {
                    // to at the bottom, add a point to bottom left
                    y = fromBorderRect.bottom;
                } else {
                    // to in between top and bottom
                    // Need 2 routing points, choose the preferred one
                    y = preferTop ? fromBorderRect.top : fromBorderRect.bottom;
                    res.push({ x, y });
                    // 2nd routing point
                    x = fromBorderRect.right;
                }
            } else {
                // to in between left and right
                if (toRect.top === toBorderRect.top) {
                    // to at the top, add a point to top left
                    y = fromBorderRect.top;
                } else if (toRect.bottom === toBorderRect.bottom) {
                    // to at the bottom, add a point to bottom left
                    y = fromBorderRect.bottom;
                } else {
                    // Should never be the case, would be hovering somewhere
                    throw new Error('Invalid case in routeAlongBorder reached.');
                }
            }
        } else if (fromRect.right === fromBorderRect.right) {
            // from at the right
            x = fromBorderRect.right;
            if (toRect.left === toBorderRect.left) {
                // to at the left
                if (toRect.top === toBorderRect.top) {
                    // to at the top, add a point to top right
                    y = fromBorderRect.top;
                } else if (toRect.bottom === toBorderRect.bottom) {
                    // to at the bottom, add a point to bottom right
                    y = fromBorderRect.bottom;
                } else {
                    // to in between top and bottom
                    // Need 2 routing points, choose the preferred one
                    y = preferTop ? fromBorderRect.top : fromBorderRect.bottom;
                    res.push({ x, y });
                    // 2nd routing point
                    x = fromBorderRect.left;
                }
            } else if (toRect.right === toBorderRect.right) {
                // to at the right
                // Nothing to do
            } else {
                // to in between left and right
                if (toRect.top === toBorderRect.top) {
                    // to at the top, add a point to top right
                    y = fromBorderRect.top;
                } else if (toRect.bottom === toBorderRect.bottom) {
                    // to at the bottom, add a point to bottom right
                    y = fromBorderRect.bottom;
                } else {
                    // Should never be the case, would be hovering somewhere
                    throw new Error('Invalid case in routeAlongBorder reached.');
                }
            }
        } else if (fromRect.top === fromBorderRect.top) {
            // from at the top
            y = fromBorderRect.top;
            if (toRect.top === toBorderRect.top) {
                // to at the top
                // Nothing to do
            } else if (toRect.bottom === toBorderRect.bottom) {
                // to at the bottom
                if (toRect.left === toBorderRect.left) {
                    // to at the left, add a point to top left
                    x = fromBorderRect.left;
                } else if (toRect.right === toBorderRect.right) {
                    // to at the right, add a point to top right
                    x = fromBorderRect.right;
                } else {
                    // to in between left and right
                    // Need 2 routing points, choose the preferred one
                    x = preferLeft ? fromBorderRect.left : fromBorderRect.right;
                    res.push({ x, y });
                    // 2nd routing point
                    y = fromBorderRect.bottom;
                }
            } else {
                // to in between top and bottom
                if (toRect.left === toBorderRect.left) {
                    // to at the left, add a point to top left
                    x = fromBorderRect.left;
                } else if (toRect.right === toBorderRect.right) {
                    // to at the right, add a point to top right
                    x = fromBorderRect.right;
                } else {
                    // Should never be the case, would be hovering somewhere
                    throw new Error('Invalid case in routeAlongBorder reached.');
                }
            }
        } else if (fromRect.bottom === fromBorderRect.bottom) {
            // from at the bottom
            y = fromBorderRect.bottom;
            if (toRect.top === toBorderRect.top) {
                // to at the top
                if (toRect.left === toBorderRect.left) {
                    // to at the left, add a point to bottom left
                    x = fromBorderRect.left;
                } else if (toRect.right === toBorderRect.right) {
                    // to at the right, add a point to bottom right
                    x = fromBorderRect.right;
                } else {
                    // to in between left and right
                    // Need 2 routing points, choose the preferred one
                    x = preferLeft ? fromBorderRect.left : fromBorderRect.right;
                    res.push({ x, y });
                    // 2nd routing point
                    y = fromBorderRect.top;
                }
            } else if (toRect.bottom === toBorderRect.bottom) {
                // to at the bottom
                // Nothing to do
            } else {
                // to in between top and bottom
                if (toRect.left === toBorderRect.left) {
                    // to at the left, add a point to top left
                    x = fromBorderRect.left;
                } else if (toRect.right === toBorderRect.right) {
                    // to at the right, add a point to top right
                    x = fromBorderRect.right;
                } else {
                    // Should never be the case, would be hovering somewhere
                    throw new Error('Invalid case in routeAlongBorder reached.');
                }
            }
        }

        if (x && y) {
            // Add the border routing point
            res.push({ x, y });
        }

        return res;
    }

    /**
     * Offsets the canvas by the given values.
     * @param canvas The canvas.
     * @param offset The offset. Values `>0` reduce the canvas size.
     * @returns An offset canvas.
     */
    export function offsetCanvas(canvas: Canvas, offset: number | Rect): Canvas {
        const rectOffset = typeof offset === "number" ? { left: offset, right: offset, top: offset, bottom: offset } : offset;
        const x = canvas.x + rectOffset.left;
        const width = canvas.width - rectOffset.right - rectOffset.left;
        const y = canvas.y + rectOffset.top;
        const height = canvas.height - rectOffset.bottom - rectOffset.top;
        return { ...canvas, x, y, width, height };
    }

    //// CRF Functions ////

    /**
     * Returns the given bounds capped to the canvas border w.r.t. the sidebar if enabled.
     * Note that `bounds` and `canvas` need to be in CRF.
     * Also, `bounds` has to contain the absolute position (not relative to parent).
     * @param bounds The bounds/point to cap to the canvas border, absolute.
     * @param canvas The canvas.
     * @param capToSidebar Whether the bounds should also be capped to the sidebar.
     * @returns The given bounds capped to the canvas border w.r.t. the sidebar if enabled.
     */
    export function capToCanvas(bounds: Bounds | Point, canvas: Bounds, capToSidebar = true): Bounds {
        const originalBounds = asBounds(bounds);

        // Cap bounds at canvas border
        let x = capNumber(originalBounds.x, canvas.x, canvas.x + canvas.width - originalBounds.width);
        const y = capNumber(originalBounds.y, canvas.y, canvas.y + canvas.height - originalBounds.height);

        if (capToSidebar) {
            // TODO: May be useful to cache the sidebar, since calling document.querySelector()
            // can cause overhead if this function is called often

            // Make sure the proxies aren't rendered behind the sidebar buttons at the top right
            // If the sidebar is locked open, the proxies are also capped to its edge
            // TODO: The logic for checking whether proxies should be displayed at all still doesn't 
            //       consider the edge of the sidebar but rather the edge of the viewport which can 
            //       be underneath the sidebar. This should probably be changed in the future.
            const rect = document.querySelector(".sidebar__toggle-container")?.getBoundingClientRect();
            const sidebarRect = document.querySelector(".sidebar__content")?.getBoundingClientRect();
            const isSidebarOpen = document.querySelector(".sidebar--open");
            if (rect) {
                if (y < rect.y + rect.height && x > rect.x - originalBounds.width) {
                    x = rect.x - originalBounds.width;
                } else if (sidebarRect && isSidebarOpen && x > sidebarRect.x - originalBounds.width) {
                    x = sidebarRect.x - originalBounds.width;
                }
            }
        }

        return { x, y, width: originalBounds.width, height: originalBounds.height };
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
     * Returns `bounds` as a Rect.
     * @param bounds The Bounds/Dimension to transform into a Rect.
     * @returns The Rect corresponding to `bounds`.
     */
    export function fromBounds(bounds: Bounds | Dimension): Rect {
        const b = asBounds(bounds);
        return { left: b.x, right: b.x + b.width, top: b.y, bottom: b.y + b.height };
    }

    /**
     * Returns `rect` as Bounds.
     * @param rect The Rect to transform into Bounds.
     * @returns The Bounds corresponding to `rect`.
     */
    export function toBounds(rect: Rect): Bounds {
        return { x: rect.left, y: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top };
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
 * Returns `bpd` if given bounds, otherwise fills the empty attributes with zeros.
 * @param bpd The bounds/point/dimension.
 */
export function asBounds(bpd: Bounds | Point | Dimension): Bounds {
    return isBounds(bpd) ? bpd : { x: 0, y: 0, width: 0, height: 0, ...bpd };
}

/**
 * Returns `n` capped to the range given by `rangeExtreme1` and `rangeExtreme2` 
 * (inclusive), e.g. `n` in `[rangeExtreme1, rangeExtreme2]`.
 * @param n The number to cap.
 * @param rangeExtreme1 The lower bound of the range.
 * @param rangeExtreme2 The upper bound of the range.
 * @returns `n` capped to the given range. If `rangeExtreme1 > rangeExtreme2`, 
 * the two are swapped.
 */
export function capNumber(n: number, rangeExtreme1: number, rangeExtreme2: number): number {
    if (rangeExtreme1 > rangeExtreme2) {
        return capNumber(n, rangeExtreme2, rangeExtreme1);
    }
    return Math.max(rangeExtreme1, Math.min(rangeExtreme2, n));
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
 * @param bounds1 The first bounds/point to calculate the distance for.
 * @param bounds2 The second bounds/point to calculate the distance for.
 * @returns The distance between the two bounds.
 */
export function distanceBetweenBounds(bounds1: Bounds | Point, bounds2: Bounds | Point): number {
    const b1 = asBounds(bounds1);
    const b2 = asBounds(bounds2);

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
 * Returns the intersection between the line spanning from `p1` to `p2` and `bounds`.
 * @param p1 The start of the line.
 * @param p2 The end of the line.
 * @param bounds The bounds.
 * @returns The intersection between the line and bounds or `undefined` if there is none.
 */
export function getIntersection(p1: Point, p2: Point, bounds: Bounds): Point | undefined {
    // Intersection iff one of [p1, p2] in bounds and the other one out of bounds

    if (Bounds.includes(bounds, p1)) {
        // Intersection if p2 out of bounds
        if (p2.x < bounds.x || p2.x > bounds.x + bounds.width) {
            // Intersection at x, find y
            const leftOrRight = p2.x < bounds.x ? bounds.x : bounds.x + bounds.width;

            // Scalar of line equation, must be in [0,1] as to not be before p1 or after p2, could be ±inf
            const scalar = capNumber((leftOrRight - p1.x) / (p2.x - p1.x), 0, 1);

            // Intersection point, cap to canvas with offset (and to sidebar aswell)
            const intersectY = p1.y + scalar * (p2.y - p1.y);
            return { x: leftOrRight, y: intersectY };
        } else if (p2.y < bounds.y || p2.y > bounds.y + bounds.height) {
            // Intersection at y, find x
            const topOrBottom = p2.y < bounds.y ? bounds.y : bounds.y + bounds.height;

            // Scalar of line equation, must be in [0,1] as to not be before p1 or after p2, could be ±inf
            const scalar = capNumber((topOrBottom - p1.y) / (p2.y - p1.y), 0, 1);

            // Intersection point
            const intersectX = p1.x + scalar * (p2.x - p1.x);
            return { x: intersectX, y: topOrBottom };
        }
    } else if (Bounds.includes(bounds, p2)) {
        // p1 out of bounds and p2 in bounds, definitely an intersection
        if (p1.x < bounds.x || p1.x > bounds.x + bounds.width) {
            // Intersection at x, find y
            const leftOrRight = p1.x < bounds.x ? bounds.x : bounds.x + bounds.width;

            // Scalar of line equation, must be in [0,1] as to not be before p2 or after p1, could be ±inf
            const scalar = capNumber((leftOrRight - p2.x) / (p1.x - p2.x), 0, 1);

            // Intersection point, cap to canvas with offset (and to sidebar aswell)
            const intersectY = p2.y + scalar * (p1.y - p2.y);
            return { x: leftOrRight, y: intersectY };
        } else {
            // Intersection at y, find x
            const topOrBottom = p1.y < bounds.y ? bounds.y : bounds.y + bounds.height;

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

/** Util class for easily accessing the currently selected elements. */
export class SelectedElementsUtil {
    /** The model index for looking up elements. */
    private static index?: ModelIndexImpl;
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
     * Clears all caches for stored element types.
     */
    private static clearCaches(): void {
        this.nodeCache = undefined;
        this.edgeCache = undefined;
        this.labelCache = undefined;
        this.portCache = undefined;

    }

    /**
     * Recalculates the selected elements.
     */
    static recalculateSelection(): void {
        this.clearCaches()
        this.selectedElements = [];
        this.index?.all().forEach(element => {
            if (isSelectable(element) && element.selected && isSKGraphElement(element)) {
                this.selectedElements.push(element)
            }
        })
    }

    /** Checks if the current index is reset. */
    static isReset(): boolean {
        return this.index === undefined;
    }

    /** Resets the current index elements. */
    static resetModel(): void {
        this.index = undefined;
        this.selectedElements = [];
    }

    /** Sets the current root. */
    static setRoot(root: SModelRoot): void {
        // this.currRoot = root;
        this.index = new ModelIndexImpl()
        this.index.add(root)

        // calculate the selected elements.
        this.recalculateSelection()
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

    handle(action: Action): void | Action | ICommand {
        if (action.kind === SetModelAction.KIND || action.kind === UpdateModelAction.KIND) {
            // Reset
            SelectedElementsUtil.resetModel();
        } else if (action.kind === SendModelContextAction.KIND) {
            SelectedElementsUtil.recalculateSelection();
            if (SelectedElementsUtil.isReset()) {
                // Set new root
                const sMCAction = action as SendModelContextAction;
                SelectedElementsUtil.setRoot(sMCAction.model.root);
            }
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        // New model
        registry.register(SetModelAction.KIND, this);
        registry.register(UpdateModelAction.KIND, this);
        registry.register(SendModelContextAction.KIND, this);
    }
}
