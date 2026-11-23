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

import { Bounds, Point } from 'sprotty-protocol'
import { asDecoratorPlacementData as asDecoratorPlacementDataFromUtil, getPlacementData } from './krendering-util'
import { isRenderingRef, KDecoratorPlacementData, KPlacementData, KRendering, KRenderingRef } from '../skgraph-models'

interface SegmentPoint {
    /** the index of the segment start point */
    index: number
    /** the concrete point on the polyline */
    point: Point
}

export interface Decoration {
    origin: Point
    bounds: Bounds
    rotation: number
}

const DEFAULT_PATH: Point[] = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
]

function angle(p0: Point, p1: Point): number {
    return Math.atan2(p1.y - p0.y, p1.x - p0.x);
}

function distance(p0: Point, p1: Point): number {
    return Math.hypot(p1.x - p0.x, p1.y - p0.y)
}

function getSegmentStartIndexAndPoint(
    points: Point[],
    locationAbsolute: number,
    locationRelative: number
): SegmentPoint {
    if (points.length === 0) {
        return { index: -1, point: { x: 0, y: 0 } }
    }
    if (points.length === 1) {
        return { index: 0, point: { x: points[0].x, y: points[0].y } }
    }

    let totalDistance = 0
    for (let i = 0; i < points.length - 1; i++) {
        totalDistance += distance(points[i], points[i + 1])
    }

    let segmentStart = -1
    const searchDistance = locationRelative * totalDistance + locationAbsolute
    let currentDistance = 0
    let point: Point = { x: 0, y: 0 }

    for (let i = 0; i < points.length - 1; i++) {
        const segmentDistance = distance(points[i], points[i + 1])
        if (segmentDistance <= 0) {
            continue
        }
        if (currentDistance + segmentDistance >= searchDistance) {
            segmentStart = i
            const remainingDistance = searchDistance - currentDistance
            point = {
                x: points[i].x + (remainingDistance * (points[i + 1].x - points[i].x)) / segmentDistance,
                y: points[i].y + (remainingDistance * (points[i + 1].y - points[i].y)) / segmentDistance,
            }
            break
        }
        currentDistance += segmentDistance
    }

    if (segmentStart < 0) {
        if (locationRelative < 0.5) {
            segmentStart = 0
            point = { x: points[0].x, y: points[0].y }
        } else {
            segmentStart = points.length - 2
            point = { x: points[segmentStart].x, y: points[segmentStart].y }
        }
    }

    return { index: segmentStart, point }
}

/**
 * Returns the origin, bounds, and rotation of a decorator placement on the given path.
 *
 * @param dpd the decorator placement data
 * @param path the path points of the edge/polyline
 * @return the decoration information (origin, bounds, rotation)
 */
export function evaluateDecoratorPlacement(
    dpd: KDecoratorPlacementData | null | undefined,
    path: Point[] | null | undefined
): Decoration {
    const points = path ?? DEFAULT_PATH

    if (!dpd) {
        return {
            origin: { x: points[0].x, y: points[0].y },
            bounds: { x: 0, y: 0, width: 0, height: 0 },
            rotation: 0,
        }
    }

    const segmentPoint = getSegmentStartIndexAndPoint(points, dpd.absolute, dpd.relative)
    const bounds = {
        x: dpd.xOffset,
        y: dpd.yOffset,
        width: dpd.width,
        height: dpd.height,
    }

    let rotation = 0
    if (dpd.rotateWithLine && points.length > 1) {
        const segmentStart = segmentPoint.index
        rotation = angle(points[segmentStart], points[segmentStart + 1])
    }

    return {
        origin: segmentPoint.point,
        bounds,
        rotation,
    }
}

/**
 * Returns the given placement data as decorator placement data, if possible.
 *
 * @param data the placement data
 * @return the decorator placement data or null
 */
export function asDecoratorPlacementData(data: KPlacementData | null | undefined): KDecoratorPlacementData | null {
    return asDecoratorPlacementDataFromUtil(data)
}

/**
 * Reveals the decorator placement data of a rendering, following rendering references.
 *
 * @param rendering the rendering to examine
 * @return the decorator placement data or null
 */
export function getDecoratorPlacementData(rendering: KRendering): KDecoratorPlacementData | null {
    const data = asDecoratorPlacementDataFromUtil(getPlacementData(rendering))
    if (data !== null) {
        return data
    }
    if (isRenderingRef(rendering)) {
        const ref = rendering as KRenderingRef
        if (ref.rendering) {
            return getDecoratorPlacementData(ref.rendering)
        }
    }
    return null
}
