/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2025 by
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

import { KGraphData, SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes'
import { Bounds, Point, toDegrees, Viewport } from 'sprotty-protocol'
import { FullDetailRelativeThreshold, FullDetailScaleThreshold } from './options/render-options-registry'
import { SKGraphModelRenderer } from './skgraph-model-renderer'
import {
    Decoration,
    HorizontalAlignment,
    isRendering,
    KColoring,
    KHorizontalAlignment,
    KLineCap,
    KLineJoin,
    KLineStyle,
    KPolyline,
    KPosition,
    KRendering,
    KRenderingRef,
    KRotation,
    KText,
    KTextUnderline,
    KVerticalAlignment,
    K_RENDERING_REF,
    K_TEXT,
    LineCap,
    LineJoin,
    LineStyle,
    SKEdge,
    SKLabel,
    SKNode,
    Underline,
    VerticalAlignment,
} from './skgraph-models'
import { ColorStyle, DEFAULT_K_HORIZONTAL_ALIGNMENT, DEFAULT_K_VERTICAL_ALIGNMENT, KStyles } from './views-styles'

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
        case LineCap.CAP_FLAT: {
            // the flat LineCap option is actually called 'butt' in svg and most other usages.
            return 'butt'
        }
        case LineCap.CAP_ROUND: {
            return 'round'
        }
        case LineCap.CAP_SQUARE: {
            return 'square'
        }
        default: {
            console.error('error in views.common.ts, unexpected LineCap in switch')
            return 'butt'
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
        default: {
            console.error('error in views.common.ts, unexpected LineJoin in switch')
            return 'miter'
        }
    }
}

/**
 * Translates a KLineStyle into the text needed for the SVG 'stroke-dasharray' attribute.
 * If the resulting dasharray would be a solid line, return undefined instead.
 * @param lineStyle The KLineStyle
 * @param lineWidth The width of the drawn line
 */
export function lineStyleText(lineStyle: KLineStyle, lineWidth: number): string | undefined {
    // TODO: implement dashOffset
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
        default: {
            console.error('error in views.common.ts, unexpected LineStyle in switch')
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
        default: {
            console.error('error in views.common.ts, unexpected VerticalAlignment in switch')
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
        default: {
            console.error('error in views.common.ts, unexpected Underline in switch')
            return undefined
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
export function calculateX(
    x: number,
    width: number,
    horizontalAlignment: KHorizontalAlignment,
    textWidth?: number
): number {
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
            default: {
                console.error('error in views.common.ts, unexpected HorizontalAlignment in switch')
                return x
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
            default: {
                console.error('error in views.common.ts, unexpected HorizontalAlignment in switch')
                return x
            }
        }
    }
}

/**
 * Calculates the y-coordinate of the text's positioning box when considering its alignment.
 * @param y The calculated y-coordinate pointing to the top coordinate of the text rendering box.
 * @param height The available height for the text.
 * @param verticalAlignment The KVerticalAlignment.
 * @param numberOfLines The number of lines in the given text.
 */
export function calculateY(
    y: number,
    height: number,
    verticalAlignment: KVerticalAlignment,
    numberOfLines: number
): number {
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
        default: {
            console.error('error in views.common.ts, unexpected VerticalAlignment in switch')
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
    const { width, height } = parentBounds
    const point = { x: 0, y: 0 }

    let xPos = position.x
    let yPos = position.y

    if (xPos === undefined) {
        xPos = {
            absolute: 0,
            relative: 0,
            type: topLeft ? K_LEFT_POSITION : K_RIGHT_POSITION,
        }
    }
    if (yPos === undefined) {
        yPos = {
            absolute: 0,
            relative: 0,
            type: topLeft ? K_TOP_POSITION : K_BOTTOM_POSITION,
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
        return undefined
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
        color: `${RGB_START}${coloring.color.red},${coloring.color.green},${coloring.color.blue}${RGB_END}`,
        opacity: coloring.alpha === undefined || coloring.alpha === 255 ? undefined : (coloring.alpha / 255).toString(),
    }
}

/**
 * Transforms any string in 'CamelCaseFormat' to a string in 'kebab-case-format'.
 * @param string The string to transform.
 */
export function camelToKebab(string: string): string {
    return string.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
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
export function findBoundsAndTransformationData(
    rendering: KRendering,
    styles: KStyles,
    parent: SKGraphElement,
    context: SKGraphModelRenderer,
    isEdge?: boolean,
    boundingBox?: boolean
): BoundsAndTransformation | undefined {
    if (rendering.type === K_TEXT && !boundingBox) {
        return findTextBoundsAndTransformationData(rendering as KText, styles, parent, context)
    }

    let bounds
    let decoration

    if ((rendering.properties['klighd.lsp.calculated.bounds'] as Bounds) !== undefined) {
        // Bounds are in the calculatedBounds of the rendering.
        bounds = rendering.properties['klighd.lsp.calculated.bounds'] as Bounds
    }
    // If no bounds have been found yet, they should be in the boundsMap.
    if (bounds === undefined && context.boundsMap !== undefined) {
        bounds = findById(context.boundsMap, rendering.properties['klighd.lsp.rendering.id'] as string)
    }
    // If there is a decoration, calculate the bounds and decoration (containing a possible rotation) from that.
    if ((rendering.properties['klighd.lsp.calculated.decoration'] as Decoration) !== undefined) {
        decoration = rendering.properties['klighd.lsp.calculated.decoration'] as Decoration
        bounds = {
            x: decoration.bounds.x + decoration.origin.x,
            y: decoration.bounds.y + decoration.origin.y,
            width: decoration.bounds.width,
            height: decoration.bounds.height,
        }
    }
    // Same as above, if the decoration has not been found yet, it should be in the decorationMap.
    if (decoration === undefined && context.decorationMap !== undefined) {
        decoration = findById(context.decorationMap, rendering.properties['klighd.lsp.rendering.id'] as string)
        if (decoration !== undefined) {
            bounds = {
                x: decoration.bounds.x + decoration.origin.x,
                y: decoration.bounds.y + decoration.origin.y,
                width: decoration.bounds.width,
                height: decoration.bounds.height,
            }
        }
    }
    // Error check: If there are no bounds or decoration, at least try to fall back to possible position attributes in the parent element.
    // If the parent element has no bounds either, the object can not be rendered.
    if (decoration === undefined && bounds === undefined && 'bounds' in parent) {
        bounds = {
            x: 0,
            y: 0,
            width: (parent as any).bounds.width,
            height: (parent as any).bounds.height,
        }
    } else if (decoration === undefined && bounds === undefined) {
        return undefined
    }

    if (parent instanceof SKNode && parent.shadow) {
        // bounds of the shadow indicating the old position of the node
        bounds = {
            x: parent.shadowX - parent.position.x,
            y: parent.shadowY - parent.position.y,
            width: parent.size.width,
            height: parent.size.height,
        }
    }

    // Calculate the svg transformation function string for this element and all its child elements given the bounds and decoration.
    const transformation = getTransformation(bounds, decoration, styles.kRotation, isEdge)

    return {
        bounds,
        transformation,
    }
}

/**
 * Calculate the bounds of the given text rendering and the SVG transformation string that has to be applied to the SVG element for this text.
 * @param rendering The text rendering to calculate the bounds and transformation for.
 * @param styles The styles for this text rendering
 * @param parent The parent SKGraphElement this rendering is contained in.
 * @param context The rendering context used to render this element.
 */
export function findTextBoundsAndTransformationData(
    rendering: KText,
    styles: KStyles,
    parent: SKGraphElement | SKLabel,
    context: SKGraphModelRenderer
): BoundsAndTransformation | undefined {
    let bounds: {
        x: number | undefined
        y: number | undefined
        height: number | undefined
        width: number | undefined
    } = {
        x: undefined,
        y: undefined,
        width: undefined,
        height: undefined,
    }
    let decoration

    // Find the text to write first.
    let text
    // KText elements as renderings of labels have their text in the KLabel, not the KText
    if ('text' in parent) {
        // if parent is KLabel
        text = parent.text
    } else {
        text = rendering.text
    }
    if (parent.properties['de.cau.cs.kieler.klighd.labels.textOverride'] !== undefined) {
        text = parent.properties['de.cau.cs.kieler.klighd.labels.textOverride'] as string
    }

    // The text split into an array for each individual line
    const lines = text?.split('\n')?.length ?? 1

    if ((rendering.properties['klighd.calculated.text.bounds'] as Bounds) !== undefined) {
        const textWidth = (rendering.properties['klighd.calculated.text.bounds'] as Bounds).width
        const textHeight = (rendering.properties['klighd.calculated.text.bounds'] as Bounds).height

        if ((rendering.properties['klighd.lsp.calculated.bounds'] as Bounds) !== undefined) {
            const foundBounds = rendering.properties['klighd.lsp.calculated.bounds'] as Bounds
            bounds.x = calculateX(
                foundBounds.x,
                foundBounds.width,
                styles.kHorizontalAlignment ?? DEFAULT_K_HORIZONTAL_ALIGNMENT,
                textWidth
            )
            bounds.y = calculateY(
                foundBounds.y,
                foundBounds.height,
                styles.kVerticalAlignment ?? DEFAULT_K_VERTICAL_ALIGNMENT,
                lines
            )
            bounds.width = textWidth
            bounds.height = textHeight
        }
        // if no bounds have been found yet, they should be in the boundsMap
        if (bounds.x === undefined && context.boundsMap !== undefined) {
            const foundBounds = findById(context.boundsMap, rendering.properties['klighd.lsp.rendering.id'] as string)
            if (bounds !== undefined) {
                bounds.x = calculateX(
                    foundBounds.x,
                    foundBounds.width,
                    styles.kHorizontalAlignment ?? DEFAULT_K_HORIZONTAL_ALIGNMENT,
                    textWidth
                )
                bounds.y = calculateY(
                    foundBounds.y,
                    foundBounds.height,
                    styles.kVerticalAlignment ?? DEFAULT_K_VERTICAL_ALIGNMENT,
                    lines
                )
                bounds.width = textWidth
                bounds.height = textHeight
            }
        }
        // If there is a decoration, calculate the bounds and decoration (containing a possible rotation) from that.
        if ((rendering.properties['klighd.lsp.calculated.decoration'] as Decoration) !== undefined) {
            decoration = rendering.properties['klighd.lsp.calculated.decoration'] as Decoration
            bounds.x = calculateX(
                decoration.bounds.x + decoration.origin.x,
                textWidth,
                styles.kHorizontalAlignment ?? DEFAULT_K_HORIZONTAL_ALIGNMENT,
                textWidth
            )
            bounds.y = calculateY(
                decoration.bounds.y + decoration.origin.y,
                textHeight,
                styles.kVerticalAlignment ?? DEFAULT_K_VERTICAL_ALIGNMENT,
                lines
            )
            bounds.width = decoration.bounds.width
            bounds.height = decoration.bounds.height
        }
        // Same as above, if the decoration has not been found yet, it should be in the decorationMap.
        if (decoration === undefined && context.decorationMap !== undefined) {
            decoration = findById(context.decorationMap, rendering.properties['klighd.lsp.rendering.id'] as string)
            if (decoration !== undefined) {
                bounds.x = calculateX(
                    decoration.bounds.x + decoration.origin.x,
                    textWidth,
                    styles.kHorizontalAlignment ?? DEFAULT_K_HORIZONTAL_ALIGNMENT,
                    textWidth
                )
                bounds.y = calculateY(
                    decoration.bounds.y + decoration.origin.y,
                    textHeight,
                    styles.kVerticalAlignment ?? DEFAULT_K_VERTICAL_ALIGNMENT,
                    lines
                )
                bounds.width = decoration.bounds.width
                bounds.height = decoration.bounds.height
            }
        }
    }
    // Error check: If there are no bounds or decoration, at least try to fall back to possible size attributes in the parent element.
    // If the parent element has no bounds either, the object can not be rendered.
    if (decoration === undefined && bounds.x === undefined && 'bounds' in parent) {
        const parentBounds = {
            x: 0,
            y: 0,
            width: (parent as any).bounds.width,
            height: (parent as any).bounds.height,
        }

        bounds.x = calculateX(
            parentBounds.x,
            parentBounds.width,
            styles.kHorizontalAlignment ?? DEFAULT_K_HORIZONTAL_ALIGNMENT,
            parentBounds.width
        )
        bounds.y = calculateY(
            parentBounds.y,
            parentBounds.height,
            styles.kVerticalAlignment ?? DEFAULT_K_VERTICAL_ALIGNMENT,
            lines
        )
        bounds.width = parent.bounds.width
        bounds.height = parent.bounds.height
    } else if (decoration === undefined && bounds.x === undefined) {
        return undefined
    }

    // If still no bounds are found, set all by default to 0.
    if (bounds.x === undefined) {
        bounds = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        }
        // Do not apply any rotation style in that case either, as the bounds estimation may get confused then.
        styles.kRotation = undefined
    }
    // Calculate the svg transformation function string for this element given the bounds and decoration.
    const transformation = getTransformation(bounds as Bounds, decoration, styles.kRotation, false, true)
    return {
        bounds: bounds as Bounds,
        transformation,
    }
}

/**
 * Simple container interface to hold bounds and transformation data.
 */
export interface BoundsAndTransformation {
    bounds: Bounds
    transformation: Transformation[]
}

/**
 * Transformation data to be easily converted to SVG transformation strings. Data contained in sub-hierarchies.
 */
export interface Transformation {
    kind: 'rotate' | 'scale' | 'translate'
}

/**
 * A rotation, possibly around a center point. Can be converted to SVG transformation string as `rotate(angle[, x, y])`.
 */
export interface Rotation extends Transformation {
    kind: 'rotate'
    angle: number
    x?: number
    y?: number
}

export function isRotation(transformation: Transformation): transformation is Rotation {
    return transformation.kind === 'rotate'
}

/**
 * A scale. Can be converted to SVG transformation string as `scale(factor)`.
 */
export interface Scale extends Transformation {
    kind: 'scale'
    factor: number
}

export function isScale(transformation: Transformation): transformation is Scale {
    return transformation.kind === 'scale'
}

/**
 * A translation. Can be converted to SVG transformation string as `translate(x, y)`.
 */
export interface Translation extends Transformation {
    kind: 'translate'
    x: number
    y: number
}

export function isTranslation(transformation: Transformation): transformation is Translation {
    return transformation.kind === 'translate'
}

/**
 * Converts the transformation into a String, that can be used for the SVG transformation attribute.
 * @param transformation The transformation to convert.
 * @returns An SVG transformation string.
 */
export function transformationToSVGString(transformation: Transformation): string {
    if (isRotation(transformation)) {
        if (transformation.x === undefined && transformation.y === undefined) {
            return `${transformation.kind}(${transformation.angle})`
        }
        return `${transformation.kind}(${transformation.angle}, ${transformation.x}, ${transformation.y})`
    }
    if (isTranslation(transformation)) {
        return `${transformation.kind}(${transformation.x}, ${transformation.y})`
    }
    if (isScale(transformation)) {
        return `${transformation.kind}(${transformation.factor})`
    }
    console.error(
        `A transformation has to be a rotation, scale, or translation, but is: ${transformation}. Error in code detected!`
    )
    return ''
}

/**
 * Reverses an array of transformations such that applying the transformation and its reverse counterpart will result in the identity transformation.
 * @param transformations The transformations to reverse.
 * @returns The reversed transformations.
 */
export function reverseTransformations(transformations: Transformation[]): Transformation[] {
    return transformations.map((transformation) => reverseTransformation(transformation)).reverse()
}

/**
 * Reverses a transformation such that applying the transformation and its reverse counterpart will result in the identity transformation.
 * @param transformation The transformation to reverse.
 * @returns The reversed transformation.
 */
export function reverseTransformation(transformation: Transformation): Transformation {
    if (isTranslation(transformation)) {
        return {
            kind: 'translate',
            x: -transformation.x,
            y: -transformation.y,
        } as Translation
    }
    if (isRotation(transformation)) {
        return {
            kind: 'rotate',
            angle: -transformation.angle,
            x: transformation.x,
            y: transformation.y,
        } as Rotation
    }
    return {
        kind: 'scale',
        factor: 1 / (transformation as Scale).factor,
    } as Scale
}

/**
 * Calculates the SVG transformation string that has to be applied to the SVG element.
 * @param bounds The bounds of the rendering.
 * @param decoration The decoration of the rendering.
 * @param kRotation The KRotation style of the rendering.
 * @param isEdge If the rendering is for an edge.
 * @param isText If the rendering is a text.
 */
export function getTransformation(
    bounds: Bounds,
    decoration: Decoration,
    kRotation: KRotation | undefined,
    isEdge?: boolean,
    isText?: boolean
): Transformation[] {
    if (isEdge === undefined) {
        isEdge = false
    }
    if (isText === undefined) {
        isText = false
    }
    const transform: Transformation[] = []
    // Do the rotation for the element only if the decoration itself exists and is not 0.
    if (decoration !== undefined && toDegrees(decoration.rotation) !== 0) {
        // The rotation itself
        const rotation: Rotation = { kind: 'rotate', angle: toDegrees(decoration.rotation) }
        // If the rotation is around a point other than (0,0), add the additional parameters to the rotation.
        if (decoration.origin.x !== 0 || decoration.origin.y !== 0) {
            rotation.x = decoration.origin.x
            rotation.y = decoration.origin.y
        }
        transform.push(rotation)
    }

    // Translate if there are bounds and if the transformation is not for an edge or a text. This replicates the behavior of KIELER as edges don't really define bounds.
    if (!isEdge && !isText && bounds !== undefined && (bounds.x !== 0 || bounds.y !== 0)) {
        transform.push({ kind: 'translate', x: bounds.x, y: bounds.y } as Translation)
    }

    // Rotate the element also if a KRotation style has to be applied
    if (kRotation !== undefined && kRotation.rotation !== 0) {
        // The rotation itself
        const rotation: Rotation = { kind: 'rotate', angle: kRotation.rotation }
        // Rotate around a defined point other than (0,0) of the object only for non-edges. This replicates the behavior of KIELER as edges don't really define bounds.
        if (!isEdge) {
            if (kRotation.rotationAnchor === undefined) {
                // If the rotation anchor is undefined, rotate around the center by default.
                const CENTER = {
                    x: {
                        type: K_LEFT_POSITION,
                        absolute: 0,
                        relative: 0.5,
                    },
                    y: {
                        type: K_TOP_POSITION,
                        absolute: 0,
                        relative: 0.5,
                    },
                }
                kRotation.rotationAnchor = CENTER
            }
            const rotationAnchor = evaluateKPosition(kRotation.rotationAnchor, bounds, true)

            // If the rotation is around a point other than (0,0), add the additional parameters to the rotation.
            if (rotationAnchor.x !== 0 || rotationAnchor.y !== 0) {
                rotation.x = rotationAnchor.x
                rotation.y = rotationAnchor.y
            }
        }
        transform.push(rotation)
    }
    return transform
}

/**
 * calculates an array of all points that the polyline rendering should follow.
 * @param parent The parent element containing this rendering.
 * @param rendering The polyline rendering.
 * @param boundsAndTransformation The bounds and transformation data calculated by findBoundsAndTransformation(...).
 */
export function getPoints(
    parent: SKGraphElement | SKEdge,
    rendering: KPolyline,
    boundsAndTransformation: BoundsAndTransformation
): Point[] {
    let points: Point[] = []
    // If the rendering has points defined, use them for the rendering.
    if ('points' in rendering) {
        const kPositions = rendering.points
        kPositions.forEach((kPosition) => {
            const pos = evaluateKPosition(kPosition, boundsAndTransformation.bounds, true)
            points.push({
                x: pos.x + boundsAndTransformation.bounds.x,
                y: pos.y + boundsAndTransformation.bounds.y,
            })
        })
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
    let minX = firstPoint.x
    let maxX = firstPoint.x
    let minY = firstPoint.y
    let maxY = firstPoint.y
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

/**
 * Looks up the first KRendering in the list of data and returns it. KRenderingReferences are handled and dereferenced as well, so only 'real' renderings are returned.
 * @param datas The list of possible renderings.
 * @param context The rendering context for this rendering.
 */
export function getKRendering(datas: KGraphData[], context: SKGraphModelRenderer): KRendering | undefined {
    for (const data of datas) {
        if (data !== null && data.type === K_RENDERING_REF) {
            if (context.kRenderingLibrary) {
                let id = (data as KRenderingRef).properties['klighd.lsp.rendering.id'] as string
                // trim the ID to remove the leading parent graph element ID that is prefixed in rendering refs
                id = id.substring(id.indexOf('$$lib$$$'))
                for (const rendering of context.kRenderingLibrary.renderings) {
                    if (((rendering as KRendering).properties['klighd.lsp.rendering.id'] as string) === id) {
                        context.boundsMap = (data as KRenderingRef).properties[
                            'klighd.lsp.calculated.bounds.map'
                        ] as Record<string, unknown>
                        context.decorationMap = (data as KRenderingRef).properties[
                            'klighd.lsp.calculated.decoration.map'
                        ] as Record<string, unknown>
                        return rendering as KRendering
                    }
                }
            } else {
                console.log('No KRenderingLibrary for KRenderingRef in context')
            }
        }
        if (data !== null && isRendering(data)) {
            return data
        }
    }
    return undefined
}

/**
 * Compares the size of a node to the viewport and returns the largest fraction of either height or width.
 *
 * @param node The KNode in question
 * @param viewport The current viewport
 * @returns the relative size of the KNodes longest dimension
 */
export function sizeRelativeToViewport(node: SKNode, viewport: Viewport): number {
    const horizontal = node.bounds.width / (node.root.canvasBounds.width / viewport.zoom)
    const vertical = node.bounds.height / (node.root.canvasBounds.height / viewport.zoom)
    const absoluteScale = (node.properties.absoluteScale as number) ?? 1
    const scaleMeasure = Math.max(horizontal, vertical)
    return scaleMeasure * absoluteScale
}

/**
 * Determines if the given node should be drawn in full detail according to the
 * {@link FullDetailRelativeThreshold} and {@link FullDetailScaleThreshold} options.
 * This means that the rendering should be drawn and all its children should at
 * least be drawn with minimal details.
 *
 * @param node The node to check the options for
 * @param ctx The rendering context
 * @returns if the node should be drawn in full detail.
 */
export function isFullDetail(node: SKNode, ctx: SKGraphModelRenderer): boolean {
    const relativeThreshold = ctx.renderOptionsRegistry.getValueOrDefault(FullDetailRelativeThreshold)

    const scaleThreshold = ctx.renderOptionsRegistry.getValueOrDefault(FullDetailScaleThreshold)

    const sizeRelative = sizeRelativeToViewport(node, ctx.viewport)

    const scale = ctx.viewport.zoom * ((node.properties.absoluteScale as number) ?? 1)
    // change to full detail when relative size threshold is reached or the scaling within the region is big enough to be readable.
    return sizeRelative >= relativeThreshold || scale > scaleThreshold
}
