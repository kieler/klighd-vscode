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
import {
    K_AREA_PLACEMENT_DATA,
    K_BOTTOM_POSITION,
    K_CHILD_AREA,
    K_CONTAINER_RENDERING,
    K_DECORATOR_PLACEMENT_DATA,
    K_GRID_PLACEMENT,
    K_GRID_PLACEMENT_DATA,
    K_IMAGE,
    K_LEFT_POSITION,
    K_POINT_PLACEMENT_DATA,
    K_POLYLINE,
    K_RECTANGLE,
    K_RENDERING_REF,
    K_RIGHT_POSITION,
    K_TEXT,
    K_TOP_POSITION,
    KAreaPlacementData,
    KContainerRendering,
    KDecoratorPlacementData,
    KGridPlacement,
    KGridPlacementData,
    KImage,
    KPlacementData,
    KPointPlacementData,
    KPolyline,
    KPosition,
    KRendering,
    KRenderingRef,
    KText,
    KXPosition,
    KYPosition,
} from '../../../src/skgraph-models'

let nextRenderingId = 0

function renderingId(prefix: string): string {
    return `${prefix}-${nextRenderingId++}`
}

export function bounds(x: number, y: number, width: number, height: number): Bounds {
    return { x, y, width, height }
}

export function point(x: number, y: number): Point {
    return { x, y }
}

export function left(absolute = 0, relative = 0): KXPosition {
    return { type: K_LEFT_POSITION, absolute, relative }
}

export function right(absolute = 0, relative = 0): KXPosition {
    return { type: K_RIGHT_POSITION, absolute, relative }
}

export function top(absolute = 0, relative = 0): KYPosition {
    return { type: K_TOP_POSITION, absolute, relative }
}

export function bottom(absolute = 0, relative = 0): KYPosition {
    return { type: K_BOTTOM_POSITION, absolute, relative }
}

export function position(x: KXPosition = left(), y: KYPosition = top()): KPosition {
    return { x, y }
}

export function topLeftPosition(x: number, y: number, relativeX = 0, relativeY = 0): KPosition {
    return position(left(x, relativeX), top(y, relativeY))
}

export function bottomRightPosition(x: number, y: number, relativeX = 0, relativeY = 0): KPosition {
    return position(right(x, relativeX), bottom(y, relativeY))
}

export function areaPlacementData(
    topLeft: KPosition = topLeftPosition(0, 0),
    bottomRight: KPosition = bottomRightPosition(0, 0)
): KAreaPlacementData {
    return {
        type: K_AREA_PLACEMENT_DATA,
        topLeft,
        bottomRight,
    }
}

export function gridPlacementData(options: Partial<KGridPlacementData> = {}): KGridPlacementData {
    return {
        type: K_GRID_PLACEMENT_DATA,
        topLeft: options.topLeft ?? topLeftPosition(0, 0),
        bottomRight: options.bottomRight ?? bottomRightPosition(0, 0),
        minCellWidth: options.minCellWidth ?? 0,
        minCellHeight: options.minCellHeight ?? 0,
        flexibleWidth: options.flexibleWidth ?? true,
        flexibleHeight: options.flexibleHeight ?? true,
    }
}

export function pointPlacementData(options: Partial<KPointPlacementData> = {}): KPointPlacementData {
    return {
        type: K_POINT_PLACEMENT_DATA,
        referencePoint: options.referencePoint ?? topLeftPosition(0, 0),
        horizontalAlignment: options.horizontalAlignment ?? 0,
        verticalAlignment: options.verticalAlignment ?? 0,
        horizontalMargin: options.horizontalMargin ?? 0,
        verticalMargin: options.verticalMargin ?? 0,
        minWidth: options.minWidth ?? 0,
        minHeight: options.minHeight ?? 0,
    }
}

export function decoratorPlacementData(options: Partial<KDecoratorPlacementData> = {}): KDecoratorPlacementData {
    return {
        type: K_DECORATOR_PLACEMENT_DATA,
        absolute: options.absolute ?? 0,
        relative: options.relative ?? 0,
        xOffset: options.xOffset ?? 0,
        yOffset: options.yOffset ?? 0,
        width: options.width ?? 0,
        height: options.height ?? 0,
        rotateWithLine: options.rotateWithLine ?? false,
    }
}

export function gridPlacement(
    numColumns: number,
    topLeft: KPosition = topLeftPosition(0, 0),
    bottomRight: KPosition = bottomRightPosition(0, 0)
): KGridPlacement {
    return {
        type: K_GRID_PLACEMENT,
        numColumns,
        topLeft,
        bottomRight,
    }
}

interface ContainerOptions {
    id?: string
    children?: KRendering[]
    childPlacement?: KGridPlacement
    placementData?: KPlacementData
    properties?: Record<string, unknown>
}

function containerOfType(type: string, options: ContainerOptions = {}): KContainerRendering {
    return {
        id: options.id ?? renderingId(type),
        type,
        styles: [],
        actions: [],
        properties: options.properties ?? {},
        children: options.children ?? [],
        childPlacement: options.childPlacement,
        placementData: options.placementData,
    } as unknown as KContainerRendering
}

export function rectangle(options: ContainerOptions = {}): KContainerRendering {
    return containerOfType(K_RECTANGLE, options)
}

export function container(options: ContainerOptions = {}): KContainerRendering {
    return containerOfType(K_CONTAINER_RENDERING, options)
}

export function childArea(options: ContainerOptions = {}): KRendering {
    return {
        id: options.id ?? renderingId(K_CHILD_AREA),
        type: K_CHILD_AREA,
        styles: [],
        actions: [],
        properties: options.properties ?? {},
        placementData: options.placementData,
    } as unknown as KRendering
}

export function text(value: string, properties: Record<string, unknown> = {}): KText {
    return {
        id: renderingId(K_TEXT),
        type: K_TEXT,
        styles: [],
        actions: [],
        properties,
        text: value,
        cursorSelectable: false,
        editable: false,
    } as unknown as KText
}

export function polyline(points: KPosition[], options: ContainerOptions = {}): KPolyline {
    return {
        ...containerOfType(K_POLYLINE, options),
        points,
    } as unknown as KPolyline
}

export function image(
    options: {
        placementData?: KPlacementData
        clipShape?: KRendering
        properties?: Record<string, unknown>
    } = {}
): KImage {
    return {
        id: renderingId(K_IMAGE),
        type: K_IMAGE,
        styles: [],
        actions: [],
        properties: options.properties ?? {},
        children: [],
        placementData: options.placementData,
        clipShape: options.clipShape,
        bundleName: '',
        imagePath: '',
        imageObject: {},
    } as unknown as KImage
}

export function renderingRef(rendering: KRendering): KRenderingRef {
    return {
        id: renderingId(K_RENDERING_REF),
        type: K_RENDERING_REF,
        styles: [],
        actions: [],
        properties: {},
        rendering,
    } as unknown as KRenderingRef
}

export function kTextSizeProperties(width: number, height: number): Record<string, unknown> {
    return {
        'klighd.testing.width': width,
        'klighd.testing.height': height,
    }
}
