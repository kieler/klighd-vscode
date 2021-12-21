/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2021 by
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

import { Bounds, Point, toDegrees } from 'sprotty-protocol';
import { SKGraphModelRenderer } from './skgraph-model-renderer';
import {
    Decoration, HorizontalAlignment, KColoring, KHorizontalAlignment, KLineCap, KLineJoin, KLineStyle, KPolyline, KPosition, KRendering,
    KRotation, KText, KTextUnderline, KVerticalAlignment, K_TEXT, LineCap, LineJoin, LineStyle, SKEdge, SKGraphElement, SKLabel, SKNode, Underline, VerticalAlignment
} from './skgraph-models';
import { KStyles, ColorStyle } from './views-styles';

// ------------- Util Class names ------------- //
const K_LEFT_POSITION = 'KLeftPositionImpl'
const K_RIGHT_POSITION = 'KRightPositionImpl'
const K_TOP_POSITION = 'KTopPositionImpl'
const K_BOTTOM_POSITION = 'KBottomPositionImpl'

// ------------- constants for string building --------------- //
const RGB_START = 'rgb('
const RGB_END = ')'

/**
 * Translates a KLineCap into the text needed for the SVG 'stroke-linecap' attribute.
 * @param lineCap The KLineCap.
 */
export function lineCapText(lineCap: KLineCap): 'butt' | 'round' | 'square' {
    switch (lineCap.lineCap) {
        case LineCap.CAP_FLAT: { // the flat LineCap option is actually called 'butt' in svg and most other usages.
            return 'butt'
        }
        case LineCap.CAP_ROUND: {
            return 'round'
        }
        case LineCap.CAP_SQUARE: {
            return 'square'
        }
    }
}

/**
 * Translates a KLineJoin into the text needed for the SVG 'stroke-linejoin' attribute.
 * @param lineJoin The KLineJoin.
 */
export function lineJoinText(lineJoin: KLineJoin): 'bevel' | 'miter' | 'round' {
    switch (lineJoin.lineJoin) {
        case LineJoin.JOIN_BEVEL: {
            return 'bevel'
        }
        case LineJoin.JOIN_MITER: {
            return 'miter'
        }
        case LineJoin.JOIN_ROUND: {
            return 'round'
        }
    }
}

/**
 * Translates a KLineStyle into the text needed for the SVG 'stroke-dasharray' attribute.
 * If the resulting dasharray would be a solid line, return undefined instead.
 * @param lineStyle The KLineStyle
 * @param lineWidth The width of the drawn line
 */
export function lineStyleText(lineStyle: KLineStyle, lineWidth: number): string | undefined { // TODO: implement dashOffset
    const one: string = (1 * lineWidth).toString()
    const three: string = (3 * lineWidth).toString()
    switch (lineStyle.lineStyle) {
        case LineStyle.CUSTOM: {
            if (lineStyle.dashPattern === undefined) {
                // Draw a solid line if the custom dashPattern is not defined.
                return undefined
            }
            return lineStyle.dashPattern.join(' ')
        }
        case LineStyle.DASH: {
            return [three, one].join(' ')
        }
        case LineStyle.DASHDOT: {
            return [three, one, one, one].join(' ')
        }
        case LineStyle.DASHDOTDOT: {
            return [three, one, one, one, one, one].join(' ')
        }
        case LineStyle.DOT: {
            return one
        }
        case LineStyle.SOLID: {
            return undefined
        }
    }
}

/**
 * Translates a VerticalAlignment into the text needed for the SVG text 'dominant-baseline' attribute.
 * @param verticalAlignment The VerticalAlignment.
 */
export function verticalAlignmentText(verticalAlignment: VerticalAlignment): 'middle' | 'baseline' | 'hanging' {
    switch (verticalAlignment) {
        case VerticalAlignment.CENTER: {
            return 'middle'
        }
        case VerticalAlignment.BOTTOM: {
            return 'baseline'
        }
        case VerticalAlignment.TOP: {
            return 'hanging'
        }
    }
}

/**
 * Translates a KTextUnderline into the text needed for the SVG 'text-decoration-style' attribute.
 * @param underline The KTextUnderline.
 */
export function textDecorationStyleText(underline: KTextUnderline): 'solid' | 'double' | 'wavy' | undefined {
    switch (underline.underline) {
        case Underline.NONE: {
            return undefined
        }
        case Underline.SINGLE: {
            return 'solid'
        }
        case Underline.DOUBLE: {
            return 'double'
        }
        case Underline.ERROR: {
            return 'wavy'
        }
        case Underline.SQUIGGLE: {
            return 'wavy'
        }
        case Underline.LINK: {
            return 'solid'
        }
    }
}

// eslint-disable-next-line
export function textDecorationColor(underline: KTextUnderline): string | undefined {
    return undefined // TODO:
}

/**
 * Calculates the x-coordinate of the text's positioning box when considering its available space and its alignment.
 * @param x The calculated x-coordinate pointing to the left coordinate of the text rendering box.
 * @param width The available width for the text.
 * @param horizontalAlignment The KHorizontalAlignment.
 * @param textWidth The real width the rendered text needs.
 */
export function calculateX(x: number, width: number, horizontalAlignment: KHorizontalAlignment, textWidth?: number): number {
    if (textWidth === undefined) {
        switch (horizontalAlignment.horizontalAlignment) {
            case HorizontalAlignment.CENTER: {
                return x + width / 2
            }
            case HorizontalAlignment.LEFT: {
                return x
            }
            case HorizontalAlignment.RIGHT: {
                return x + width
            }
        }
    } else {
        switch (horizontalAlignment.horizontalAlignment) {
            case HorizontalAlignment.CENTER: {
                return x + width / 2 - textWidth / 2
            }
            case HorizontalAlignment.LEFT: {
                return x
            }
            case HorizontalAlignment.RIGHT: {
                return x + width - textWidth
            }
        }
    }
    console.error('horizontalAlignment is not defined.')
    return 0
}

/**
 * Calculates the y-coordinate of the text's positioning box when considering its alignment.
 * @param y The calculated y-coordinate pointing to the top coordinate of the text rendering box.
 * @param height The available height for the text.
 * @param verticalAlignment The KVerticalAlignment.
 * @param numberOfLines The number of lines in the given text.
 */
export function calculateY(y: number, height: number, verticalAlignment: KVerticalAlignment, numberOfLines: number): number {
    let lineHeight = height / numberOfLines
    if (numberOfLines === 0) {
        lineHeight = height
    }
    switch (verticalAlignment.verticalAlignment) {
        case VerticalAlignment.CENTER: {
            return y + lineHeight / 2
        }
        case VerticalAlignment.BOTTOM: {
            return y + lineHeight
        }
        case VerticalAlignment.TOP: {
            return y
        }
    }
}

/**
 * Evaluates a position inside given parent bounds. Inspired by the java method PlacementUtil.evaluateKPosition.
 * @param position The position.
 * @param parentBounds The parent bounds.
 * @param topLeft In case position is undefined assume a topLeft KPosition, and a bottomRight KPosition otherwise.
 * @returns The evaluated position.
 */
export function evaluateKPosition(position: KPosition, parentBounds: Bounds, topLeft: boolean): Point {
    const width = parentBounds.width
    const height = parentBounds.height
    const point = { x: 0, y: 0 }

    let xPos = position.x
    let yPos = position.y

    if (xPos === undefined) {
        xPos = {
            absolute: 0,
            relative: 0,
            type: topLeft ? K_LEFT_POSITION : K_RIGHT_POSITION
        }
    }
    if (yPos === undefined) {
        yPos = {
            absolute: 0,
            relative: 0,
            type: topLeft ? K_TOP_POSITION : K_BOTTOM_POSITION
        }
    }

    if (xPos.type === K_LEFT_POSITION) {
        point.x = xPos.relative * width + xPos.absolute
    } else {
        point.x = width - xPos.relative * width - xPos.absolute
    }
    if (yPos.type === K_TOP_POSITION) {
        point.y = yPos.relative * height + yPos.absolute
    } else {
        point.y = height - yPos.relative * height - yPos.absolute
    }

    return point
}

/**
 * Tries to find the ID in the given map object.
 * @param map The object containing something under the given ID.
 * @param idString The ID too look up.
 */
export function findById(map: Record<string, unknown>, idString: string): any {
    if (map === undefined) {
        return
    }
    return map[idString]
}

/**
 * Returns if the given coloring is a single color and no gradient.
 * @param coloring The coloring to check.
 */
export function isSingleColor(coloring: KColoring): boolean {
    return coloring.targetColor === undefined || coloring.targetAlpha === undefined
}

/**
 * Returns the SVG fill string representing the given coloring, if it is a single color. Check that with isSingleColor(KColoring) beforehand.
 * @param coloring The coloring.
 */
export function fillSingleColor(coloring: KColoring): ColorStyle {
    return {
        color: RGB_START + coloring.color.red + ','
            + coloring.color.green + ','
            + coloring.color.blue
            + RGB_END,
        opacity: coloring.alpha === undefined || coloring.alpha === 255 ? undefined : (coloring.alpha / 255).toString()
    }
}

/**
 * Transforms any string in 'CamelCaseFormat' to a string in 'kebab-case-format'.
 * @param string The string to transform.
 */
export function camelToKebab(string: string): string {
    return string.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Calculate the bounds of the given rendering and the SVG transformation string that has to be applied to the SVG element for this rendering.
 * @param rendering The rendering to calculate the bounds and transformation for.
 * @param kRotation The KRotation style of the rendering.
 * @param parent The parent SKGraphElement this rendering is contained in.
 * @param context The rendering context used to render this element.
 * @param boundingBox If this method should not return the values to be applied to the SVG but the
 *  box coordinates instead. Required to find the true bounding box of text renderings.
 * @param isEdge If the rendering is for an edge.
 */
export function findBoundsAndTransformationData(rendering: KRendering, styles: KStyles, parent: SKGraphElement,
    context: SKGraphModelRenderer, isEdge?: boolean, boundingBox?: boolean): BoundsAndTransformation | undefined {
    
    if (rendering.type === K_TEXT && !boundingBox) {
        return findTextBoundsAndTransformationData(rendering as KText, styles, parent, context)
    }

    let bounds
    let decoration

    if (rendering.calculatedBounds !== undefined) {
        // Bounds are in the calculatedBounds of the rendering.
        bounds = rendering.calculatedBounds
    }
    // If no bounds have been found yet, they should be in the boundsMap.
    if (bounds === undefined && context.boundsMap !== undefined) {
        bounds = findById(context.boundsMap, rendering.renderingId)
    }
    // If there is a decoration, calculate the bounds and decoration (containing a possible rotation) from that.
    if (rendering.calculatedDecoration !== undefined) {
        decoration = rendering.calculatedDecoration
        bounds = {
            x: decoration.bounds.x + decoration.origin.x,
            y: decoration.bounds.y + decoration.origin.y,
            width: decoration.bounds.width,
            height: decoration.bounds.height
        }
    }
    // Same as above, if the decoration has not been found yet, it should be in the decorationMap.
    if (decoration === undefined && context.decorationMap !== undefined) {
        decoration = findById(context.decorationMap, rendering.renderingId)
        if (decoration !== undefined) {
            bounds = {
                x: decoration.bounds.x + decoration.origin.x,
                y: decoration.bounds.y + decoration.origin.y,
                width: decoration.bounds.width,
                height: decoration.bounds.height
            }
        }
    }
    // Error check: If there are no bounds or decoration, at least try to fall back to possible size and position attributes in the parent element.
    // If the parent element has no bounds either, the object can not be rendered.
    if (decoration === undefined && bounds === undefined && 'size' in parent && 'position' in parent) {
        bounds = {
            x: (parent as any).position.x,
            y: (parent as any).position.y,
            width: (parent as any).size.width,
            height: (parent as any).size.height
        }
    } else if (decoration === undefined && bounds === undefined) {
        return
    }

    if (parent instanceof SKNode && parent.shadow) {
        // bounds of the shadow indicating the old position of the node
        bounds = {
            x: parent.shadowX - parent.position.x,
            y: parent.shadowY - parent.position.y,
            width: parent.size.width,
            height: parent.size.height
        }
    }

    // Calculate the svg transformation function string for this element and all its child elements given the bounds and decoration.
    const transformation = getTransformation(bounds, decoration, styles.kRotation, isEdge)

    return {
        bounds: bounds,
        transformation: transformation
    }
}

/**
 * Calculate the bounds of the given text rendering and the SVG transformation string that has to be applied to the SVG element for this text.
 * @param rendering The text rendering to calculate the bounds and transformation for.
 * @param styles The styles for this text rendering
 * @param parent The parent SKGraphElement this rendering is contained in.
 * @param context The rendering context used to render this element.
 */
export function findTextBoundsAndTransformationData(rendering: KText, styles: KStyles, parent: SKGraphElement | SKLabel, context: SKGraphModelRenderer): BoundsAndTransformation | undefined {
    let bounds: {
        x: number | undefined,
        y: number | undefined,
        height: number | undefined,
        width: number | undefined
    } = {
        x: undefined,
        y: undefined,
        width: undefined,
        height: undefined
    }
    let decoration

    // Find the text to write first.
    let text = undefined
    // KText elements as renderings of labels have their text in the KLabel, not the KText
    if ('text' in parent) { // if parent is KLabel
        text = parent.text
    } else {
        text = rendering.text
    }

    // The text split into an array for each individual line
    const lines = text?.split('\n')?.length ?? 1

    if (rendering.calculatedTextBounds !== undefined) {
        const textWidth = rendering.calculatedTextBounds.width
        const textHeight = rendering.calculatedTextBounds.height

        if (rendering.calculatedBounds !== undefined) {
            const foundBounds = rendering.calculatedBounds
            bounds.x = calculateX(foundBounds.x, foundBounds.width, styles.kHorizontalAlignment, textWidth)
            bounds.y = calculateY(foundBounds.y, foundBounds.height, styles.kVerticalAlignment, lines)
            bounds.width = textWidth
            bounds.height = textHeight
        }
        // if no bounds have been found yet, they should be in the boundsMap
        if (bounds.x === undefined && context.boundsMap !== undefined) {
            const foundBounds = findById(context.boundsMap, rendering.renderingId)
            if (bounds !== undefined) {
                bounds.x = calculateX(foundBounds.x, foundBounds.width, styles.kHorizontalAlignment, textWidth)
                bounds.y = calculateY(foundBounds.y, foundBounds.height, styles.kVerticalAlignment, lines)
                bounds.width = textWidth
                bounds.height = textHeight
            }
        }
        // If there is a decoration, calculate the bounds and decoration (containing a possible rotation) from that.
        if (rendering.calculatedDecoration !== undefined) {
            decoration = rendering.calculatedDecoration
            bounds.x = calculateX(decoration.bounds.x + decoration.origin.x, textWidth, styles.kHorizontalAlignment, textWidth)
            bounds.y = calculateY(decoration.bounds.y + decoration.origin.y, textHeight, styles.kVerticalAlignment, lines)
            bounds.width = decoration.bounds.width
            bounds.height = decoration.bounds.height
        }
        // Same as above, if the decoration has not been found yet, it should be in the decorationMap.
        if (decoration === undefined && context.decorationMap !== undefined) {
            decoration = findById(context.decorationMap, rendering.renderingId)
            if (decoration !== undefined) {
                bounds.x = calculateX(decoration.bounds.x + decoration.origin.x, textWidth, styles.kHorizontalAlignment, textWidth)
                bounds.y = calculateY(decoration.bounds.y + decoration.origin.y, textHeight, styles.kVerticalAlignment, lines)
                bounds.width = decoration.bounds.width
                bounds.height = decoration.bounds.height
            }
        }
        // Error check: If there are no bounds or decoration, at least try to fall back to possible size and position attributes in the parent element.
        // If the parent element has no bounds either, the object can not be rendered.
        if (decoration === undefined && bounds.x === undefined && 'size' in parent && 'position' in parent) {
            bounds.x = (parent as any).position.x
            bounds.y = (parent as any).position.y
            bounds.width = (parent as any).size.width
            bounds.height = (parent as any).size.height
        } else if (decoration === undefined && bounds.x === undefined) {
            return
        }
    }


    // If still no bounds are found, set all by default to 0.
    if (bounds.x === undefined) {
        bounds = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }
        // Do not apply any rotation style in that case either, as the bounds estimation may get confused then.
        styles.kRotation = undefined
    }
    // Calculate the svg transformation function string for this element given the bounds and decoration.
    const transformation = getTransformation(bounds as Bounds, decoration, styles.kRotation, false, true)
    return {
        bounds: bounds as Bounds,
        transformation: transformation
    }
}

/**
 * Simple container interface to hold bounds and a SVG transformation string.
 */
export interface BoundsAndTransformation {
    bounds: Bounds,
    transformation: string | undefined
}

/**
 * Calculates the SVG transformation string that has to be applied to the SVG element.
 * @param bounds The bounds of the rendering.
 * @param decoration The decoration of the rendering.
 * @param rotation The KRotation style of the rendering.
 * @param isEdge If the rendering is for an edge.
 * @param isText If the rendering is a text.
 */
export function getTransformation(bounds: Bounds, decoration: Decoration, rotation: KRotation | undefined, isEdge?: boolean, isText?: boolean): string | undefined {
    if (isEdge === undefined) {
        isEdge = false
    }
    if (isText === undefined) {
        isText = false
    }
    let transform = ''
    let isTransform = false
    // Do the rotation for the element only if the decoration itself exists and is not 0.
    if (decoration !== undefined && toDegrees(decoration.rotation) !== 0) {
        // The rotation itself
        transform += `rotate(${toDegrees(decoration.rotation)}`
        isTransform = true
        // If the rotation is around a point other than (0,0), add the additional parameters to the rotation.
        if (decoration.origin.x !== 0 || decoration.origin.y !== 0) {
            transform += `,${decoration.origin.x},${decoration.origin.y}`
        }
        transform += ')'
    }

    // Translate if there are bounds and if the transformation is not for an edge or a text. This replicates the behavior of KIELER as edges don't really define bounds.
    if (!isEdge && !isText && bounds !== undefined && (bounds.x !== 0 || bounds.y !== 0)) {
        isTransform = true
        transform += `translate(${bounds.x},${bounds.y})`
    }

    // Rotate the element also if a KRotation style has to be applied
    if (rotation !== undefined && rotation.rotation !== 0) {
        // The rotation itself
        transform += `rotate(${rotation.rotation}`
        isTransform = true
        // Rotate around a defined point other than (0,0) of the object only for non-edges. This replicates the behavior of KIELER as edges don't really define bounds.
        if (!isEdge) {
            if (rotation.rotationAnchor === undefined) {
                // If the rotation anchor is undefined, rotate around the center by default.
                const CENTER = {
                    x: {
                        type: K_LEFT_POSITION,
                        absolute: 0,
                        relative: 0.5
                    },
                    y: {
                        type: K_TOP_POSITION,
                        absolute: 0,
                        relative: 0.5
                    }
                }
                rotation.rotationAnchor = CENTER
            }
            const rotationAnchor = evaluateKPosition(rotation.rotationAnchor, bounds, true)

            // If the rotation is around a point other than (0,0), add the additional parameters to the rotation.
            if (rotationAnchor.x !== 0 || rotationAnchor.y !== 0) {
                transform += `,${rotationAnchor.x},${rotationAnchor.y}`
            }
        }
        transform += ')'
    }
    return (isTransform ? transform : undefined)
}

/**
 * calculates an array of all points that the polyline rendering should follow.
 * @param parent The parent element containing this rendering.
 * @param rendering The polyline rendering.
 * @param boundsAndTransformation The bounds and transformation data calculated by findBoundsAndTransformation(...).
 */
export function getPoints(parent: SKGraphElement | SKEdge, rendering: KPolyline, boundsAndTransformation: BoundsAndTransformation): Point[] {
    let points: Point[] = []
    // If the rendering has points defined, use them for the rendering.
    if ('points' in rendering) {
        const kPositions = rendering.points
        kPositions.forEach(kPosition => {
            const pos = evaluateKPosition(kPosition, boundsAndTransformation.bounds, true)
            points.push({
                x: pos.x + boundsAndTransformation.bounds.x,
                y: pos.y + boundsAndTransformation.bounds.y
            })
        });
    } else if ('routingPoints' in parent) {
        // If no points for the rendering are specified, the parent has to be and edge and have routing points.
        points = parent.routingPoints
    } else {
        console.error('The rendering does not have any points for its routing.')
    }

    // If the array is empty, do not continue trying to modify the points.
    if (points.length === 0) {
        return points
    }
    const firstPoint = points[0]
    let minX, maxX, minY, maxY: number

    minX = firstPoint.x
    maxX = firstPoint.x
    minY = firstPoint.y
    maxY = firstPoint.y
    for (let i = 1; i < points.length - 1; i++) {
        const p = points[i]
        if (p.x < minX) {
            minX = p.x
        }
        if (p.x > maxX) {
            maxX = p.x
        }
        if (p.y < minY) {
            minY = p.y
        }
        if (p.y > maxY) {
            maxY = p.y
        }
    }
    // hack to avoid paths with no width / height. These paths will not get drawn by chrome due to a bug in their svg renderer TODO: find a fix if there is any better way
    const EPSILON = 0.001
    if (points.length > 1) {
        const lastPoint = points[points.length - 1]
        let lastX = lastPoint.x
        let lastY = lastPoint.y
        // if this path has no width and the last point does not add anything to that, we need to shift one value by a tiny, invisible value so the width will now be bigger than 0.
        if (maxX - minX === 0 && lastX === maxX) {
            lastX += EPSILON
            points[points.length - 1] = { x: lastX, y: lastY }
        }
        // same for Y
        if (maxY - minY === 0 && lastY === maxY) {
            lastY += EPSILON
            points[points.length - 1] = { x: lastX, y: lastY }
        }
    }
    return points
}