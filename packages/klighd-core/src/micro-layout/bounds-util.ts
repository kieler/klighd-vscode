/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2025 by
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

import { Bounds } from 'sprotty-protocol'

/**
 * Determines component-wise the maximum of the given bounds. The x and y coordinates
 * are taken from {@code b1}, matching the Java implementation.
 *
 * @param b1 the first bounds object
 * @param b2 the second bounds object
 * @return a new bounds object with x,y from b1 and max width/height
 */
export function boundsMax(b1: Bounds, b2: Bounds): Bounds {
    return {
        x: b1.x,
        y: b1.y,
        width: Math.max(b1.width, b2.width),
        height: Math.max(b1.height, b2.height),
    }
}

/**
 * Determines component-wise the minimum of the given bounds. The x and y coordinates
 * are taken from {@code b1}, matching the Java implementation.
 *
 * @param b1 the first bounds object
 * @param b2 the second bounds object
 * @return a new bounds object with x,y from b1 and min width/height
 */
export function boundsMin(b1: Bounds, b2: Bounds): Bounds {
    return {
        x: b1.x,
        y: b1.y,
        width: Math.min(b1.width, b2.width),
        height: Math.min(b1.height, b2.height),
    }
}

/**
 * Constructs empty bounds at origin with zero size.
 *
 * @return empty bounds
 */
export function emptyBounds(): Bounds {
    return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    }
}

/**
 * Compares the widths and heights of two bounds, tolerating the given delta.
 *
 * @param b1 the first bounds object
 * @param b2 the second bounds object
 * @param delta the delta to accept while determining equality of width and height
 * @return a pair indicating width and height equality
 */
export function compare(b1: Bounds, b2: Bounds, delta = 0): { widthEqual: boolean; heightEqual: boolean } {
    const widthEqual = Math.abs(b1.width - b2.width) <= delta
    const heightEqual = Math.abs(b1.height - b2.height) <= delta
    return { widthEqual, heightEqual }
}

/**
 * Returns true if both width and height are zero.
 *
 * @param bounds the bounds to check
 * @return true if empty
 */
export function isEmpty(bounds: Bounds): boolean {
    return bounds.width === 0 && bounds.height === 0
}

/**
 * Returns a new bounds object translated by the given offsets.
 *
 * @param bounds the bounds to move
 * @param horizontalDirection the horizontal translation
 * @param verticalDirection the vertical translation
 * @return a new translated bounds object
 */
export function moveBounds(bounds: Bounds, horizontalDirection: number, verticalDirection: number): Bounds {
    return {
        x: bounds.x + horizontalDirection,
        y: bounds.y + verticalDirection,
        width: bounds.width,
        height: bounds.height,
    }
}

/**
 * Constructs bounds with the given coordinates and dimensions.
 */
export function boundsOf(x: number, y: number, width: number, height: number): Bounds
/**
 * Constructs bounds with the given dimensions at origin.
 */
export function boundsOf(width: number, height: number): Bounds
/**
 * Constructs bounds from the given bounds object.
 */
export function boundsOf(bounds: Bounds): Bounds
/**
 * Constructs bounds from the given parameters.
 *
 * @param xOrWidthOrBounds either x coordinate, width, or bounds object
 * @param yOrHeightOrUndefined either y coordinate or height
 * @param widthOrUndefined width
 * @param heightOrUndefined height
 * @return a new bounds object
 */
export function boundsOf(
    xOrWidthOrBounds: number | Bounds,
    yOrHeightOrUndefined?: number,
    widthOrUndefined?: number,
    heightOrUndefined?: number
): Bounds {
    if (typeof xOrWidthOrBounds === 'number') {
        if (arguments.length === 4) {
            return {
                x: xOrWidthOrBounds,
                y: yOrHeightOrUndefined as number,
                width: widthOrUndefined as number,
                height: heightOrUndefined as number,
            }
        }
        return { x: 0, y: 0, width: xOrWidthOrBounds, height: yOrHeightOrUndefined as number }
    }
    return {
        x: xOrWidthOrBounds.x,
        y: xOrWidthOrBounds.y,
        width: xOrWidthOrBounds.width,
        height: xOrWidthOrBounds.height,
    }
}

/**
 * Creates an immutable copy of the given bounds. Attempts to modify the returned object
 * fail at runtime, mirroring the Java {@code ImmutableBounds}.
 */
export function immutableCopy(bounds: Bounds): Bounds {
    return Object.freeze({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
    })
}
