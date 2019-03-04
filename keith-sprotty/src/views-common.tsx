/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import { KLineCap, LineCap, KLineJoin, LineJoin, KLineStyle, LineStyle, HorizontalAlignment,
    VerticalAlignment, KHorizontalAlignment, KVerticalAlignment, KPosition, KRenderingLibrary,
    KColoring, KRendering, KGraphElement, Decoration, KRotation, KEdge, KPolyline, KText, KTextUnderline, Underline } from "./kgraph-models"
import { Bounds, Point, toDegrees, ModelRenderer } from "sprotty/lib"
import { VNode } from "snabbdom/vnode";
import { KStyles } from "./views-styles";

// ------------- Util Class names ------------- //
const K_LEFT_POSITION = 'KLeftPositionImpl'
const K_RIGHT_POSITION = 'KRightPositionImpl'
const K_TOP_POSITION = 'KTopPositionImpl'
const K_BOTTOM_POSITION = 'KBottomPositionImpl'

// ------------- constants for string building --------------- //
const RGB_START = 'rgb('
const RGB_END = ')'
const RGBA_START = 'rgba('
const RGBA_END = ')'

export class KGraphRenderingContext extends ModelRenderer {
    boundsMap: any
    decorationMap: any
    kRenderingLibrary: KRenderingLibrary
    renderingDefs: Map<string, VNode>
}

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
 * Calculates the formatting string to define the given lineStyle. If the resulting lineStyle would be a solid line, return undefined instead.
 * @param lineStyle The line style to format
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

export function horizontalAlignmentText(horizontalAlignment: HorizontalAlignment): 'middle' | 'start' | 'end' {
    switch (horizontalAlignment) {
        case HorizontalAlignment.CENTER: {
            return 'middle'
        }
        case HorizontalAlignment.LEFT: {
            return 'start'
        }
        case HorizontalAlignment.RIGHT: {
            return 'end'
        }
    }
}

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

export function textDecorationColor(underline: KTextUnderline): string | undefined {
    return undefined // TODO:
}

// This will now always return the left coordinate of the text's bounding box.
export function calculateX(x: number, width: number, horizontalAlignment: KHorizontalAlignment, textWidth: number | undefined): number {
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
    console.error("horizontalAlignment is not defined.")
    return 0
}

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
 * Evaluates a position inside given parent bounds. Inspired by the java method PlacementUtil.evaluateKPosition
 * @param position the position
 * @param parentBounds the parent bounds
 * @param topLeft in case position is undefined assume a topLeft KPosition, and a bottomRight KPosition otherwise
 * @returns the evaluated position
 */
export function evaluateKPosition(position: KPosition, parentBounds: Bounds, topLeft: boolean): Point {
    const width = parentBounds.width
    const height = parentBounds.height
    let point = {x: 0, y: 0}

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

export function findById(map: any, idString: string): any {
    if (map === undefined) {
        return
    }
    return map[idString]
    // TODO: why did I first implement this variant? Can there be renderings not on top level of the boundsMap?
    // const ids = idString.split(ID_SEPARATOR)
    // let obj = boundsMap
    // for (let id of ids) {
    //     obj = obj[id]
    //     if (obj === undefined) {
    //         return
    //     }
    // }
    // return obj
}

export function isSingleColor(coloring: KColoring) {
    return coloring.targetColor === undefined || coloring.targetAlpha === undefined
}

export function fillSingleColor(coloring: KColoring) {
    if (coloring.alpha === undefined || coloring.alpha === 255) {
        return RGB_START + coloring.color.red   + ','
                         + coloring.color.green + ','
                         + coloring.color.blue
             + RGB_END
    } else {
        return RGBA_START + coloring.color.red + ','
                          + coloring.color.green + ','
                          + coloring.color.blue + ','
                          + coloring.alpha / 255
             + RGBA_END
    }
}

export function angle(x0: Point, x1: Point): number {
    return toDegrees(Math.atan2(x1.y - x0.y, x1.x - x0.x))
}

/**
 * transforms any string in 'CamelCaseFormat' to a string in 'kebab-case-format'.
 * @param string the string to transform
 */
export function camelToKebab(string: string): string {
    return string.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function findBoundsAndTransformationData(rendering: KRendering, kRotation: KRotation | undefined, parent: KGraphElement,
    context: KGraphRenderingContext, isEdge?: boolean): BoundsAndTransformation | undefined {
    let bounds
    let decoration

    if (rendering.calculatedBounds !== undefined) {
        // Bounds are in the calculatedBounds of the rendering.
        bounds = rendering.calculatedBounds
    }
    // If no bounds have been found yet, they should be in the boundsMap.
    if (bounds === undefined && context.boundsMap !== undefined) {
        bounds = findById(context.boundsMap, rendering.id)
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
        decoration = findById(context.decorationMap, rendering.id)
        if (decoration !== undefined) {
            bounds = {
                x: decoration.bounds.x + decoration.origin.x,
                y: decoration.bounds.y + decoration.origin.y,
                width: decoration.bounds.width,
                height: decoration.bounds.height
            }
        }
    }
    // Error check: If there are no bounds or decoration, at least try to fall back to a possible size attribute in the parent element.
    // If the parent element has no bounds either, the object can not be rendered.
    if (decoration === undefined && bounds === undefined && !('size' in parent)) {
        console.error('could not find bounds or decoration data to render this element: ' + rendering + ' for this parent: ' + parent)
        return
    } else if (decoration === undefined && bounds === undefined) {
        console.error('could not find bounds or decoration data to render this element. Using parent bounds as a fallback.')
        bounds = (parent as any).size
    }
    // Calculate the svg transformation function string for this element and all its child elements given the bounds and decoration.
    const transformation = getTransformation(bounds, decoration, kRotation, isEdge)

    return {
        bounds: bounds,
        transformation: transformation
    }
}

export function findTextBoundsAndTransformationData(rendering: KText, styles: KStyles, parent: KGraphElement, context: KGraphRenderingContext, lines: number) {
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
    if (rendering.calculatedTextBounds !== undefined) {
        const textWidth = rendering.calculatedTextBounds.width
        const textHeight = rendering.calculatedTextBounds.height

        if (rendering.calculatedBounds !== undefined) {
            const foundBounds = rendering.calculatedBounds
            bounds.x = calculateX(foundBounds.x, foundBounds.width, styles.kHorizontalAlignment, textWidth)
            bounds.y = calculateY(foundBounds.y, foundBounds.height, styles.kVerticalAlignment, lines)
            bounds.width = foundBounds.width
            bounds.height = foundBounds.height
        }
        // if no bounds have been found yet, they should be in the boundsMap
        if (bounds.x === undefined && context.boundsMap !== undefined) {
            const foundBounds = findById(context.boundsMap, rendering.id)
            if (bounds !== undefined) {
                bounds.x = calculateX(foundBounds.x, foundBounds.width, styles.kHorizontalAlignment, textWidth)
                bounds.y = calculateY(foundBounds.y, foundBounds.height, styles.kVerticalAlignment, lines)
                bounds.width = foundBounds.width
                bounds.height = foundBounds.height
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
            decoration = findById(context.decorationMap, rendering.id)
            if (decoration !== undefined) {
                bounds.x = calculateX(decoration.bounds.x + decoration.origin.x, textWidth, styles.kHorizontalAlignment, textWidth)
                bounds.y = calculateY(decoration.bounds.y + decoration.origin.y, textHeight, styles.kVerticalAlignment, lines)
                bounds.width = decoration.bounds.width
                bounds.height = decoration.bounds.height
            }
        }
        // Error check: If there are no bounds or decoration, at least try to fall back to a possible size attribute in the parent element.
        // If the parent element has no bounds either, the object can not be rendered.
        if (decoration === undefined && bounds.x === undefined && !('size' in parent)) {
            console.error('could not find bounds or decoration data to render this element: ' + rendering + ' for this parent: ' + parent)
            return
        } else if (decoration === undefined && bounds.x === undefined) {
            console.error('could not find bounds or decoration data to render this element. Using parent bounds as a fallback.')
            bounds.x = (parent as any).size.x
            bounds.y = (parent as any).size.y
            bounds.width = (parent as any).size.width
            bounds.height = (parent as any).size.height
        }
    }


    // If still no bounds are found, set all by default to 0. This will be the case when the texts are drawn first to estimate their sizes.
    if (bounds.x === undefined) {
        bounds = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }
        // Do not apply any rotation style in that case either, as the bounds estimation may get confused then.
        // TODO: really, the rotation style should not even be sent as a style on texts when estimating their sizes.
        styles.kRotation = undefined
    }
    // Calculate the svg transformation function string for this element given the bounds and decoration.
    const transformation = getTransformation(bounds as Bounds, decoration, styles.kRotation, false, true)
    return {
        bounds: bounds,
        transformation: transformation
    }
}

export interface BoundsAndTransformation {
    bounds: Bounds,
    transformation: string | undefined
}

export function getTransformation(bounds: Bounds, decoration: Decoration, rotation: KRotation | undefined, isEdge?: boolean, isText?: boolean) {
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
                        absolute:  0,
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

export function getPoints(parent: KGraphElement | KEdge, rendering: KPolyline, boundsAndTransformation: BoundsAndTransformation): Point[] {
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
        let lastPoint = points[points.length - 1]
        let lastX = lastPoint.x
        let lastY = lastPoint.y
        // if this path has no width and the last point does not add anything to that, we need to shift one value by a tiny, invisible value so the width will now be bigger than 0.
        if (maxX - minX === 0 && lastX === maxX) {
            lastX += EPSILON
            points[points.length - 1] = {x: lastX, y: lastY}
        }
        // same for Y
        if (maxY - minY === 0 && lastY === maxY) {
            lastY += EPSILON
            points[points.length - 1] = {x: lastX, y: lastY}
        }
    }
    return points
}