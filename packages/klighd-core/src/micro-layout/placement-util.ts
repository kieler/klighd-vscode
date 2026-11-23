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

import { Bounds, isBounds, Point } from 'sprotty-protocol'
import {
    HorizontalAlignment,
    isAreaPlacementData,
    isChildArea,
    isContainerRendering,
    isGridPlacement,
    isGridPlacementData,
    isImage,
    isKText,
    isLeftPosition,
    isPointPlacementData,
    isPolyline,
    isRendering,
    isRenderingRef,
    isTopPosition,
    K_AREA_PLACEMENT_DATA,
    K_BOTTOM_POSITION,
    K_LEFT_POSITION,
    K_POINT_PLACEMENT_DATA,
    K_RIGHT_POSITION,
    K_TOP_POSITION,
    KAreaPlacementData,
    KContainerRendering,
    KGridPlacement,
    KImage,
    KPlacement,
    KPlacementData,
    KPointPlacementData,
    KPolyline,
    KPosition,
    KRendering,
    KRenderingRef,
    KText,
    VerticalAlignment,
} from '../skgraph-models'
import { boundsMax, boundsOf, emptyBounds, moveBounds } from './bounds-util'
import {
    asAreaPlacementData,
    asGridPlacement,
    asPointPlacementData,
    getPlacementData,
    toNonNullBottomPosition,
    toNonNullLeftPosition,
    toNonNullRightPosition,
    toNonNullTopPosition,
} from './krendering-util'
import { estimateGridSize, evaluateGridPlacement } from './gridplacement-util'

/**
 * Insets around a node's child area. Mirrors the Java KGraph {@code KInsets}.
 */
export interface KInsets {
    /** left inset */
    left: number
    /** right inset */
    right: number
    /** top inset */
    top: number
    /** bottom inset */
    bottom: number
}

export const LABELS_TEXT_OVERRIDE = 'de.cau.cs.kieler.klighd.labels.textOverride'
const LEGACY_LABELS_TEXT_OVERRIDE = 'klighd.labels.textOverride'
export const TESTING_TEXT_HEIGHT = 'klighd.testing.height'
export const TESTING_TEXT_WIDTH = 'klighd.testing.width'
export const CALCULATED_TEXT_BOUNDS = 'klighd.calculated.text.bounds'
export const CALCULATED_TEXT_LINE_WIDTHS = 'klighd.calculated.text.line.widths'
export const CALCULATED_TEXT_LINE_HEIGHTS = 'klighd.calculated.text.line.heights'
const CALCULATED_BOUNDS = 'klighd.lsp.calculated.bounds'

/**
 * Estimates the minimal size of a KRendering.<br>
 * The the previous defined size is incorporated while resolving relative placement/size
 * constraints.
 *
 * @param rendering the {@link KRendering} to be evaluated
 * @param givenBounds the size that is currently assigned to 'rendering's container or the related
 *            {@link KShapeLayout} respectively
 * @return the minimal size
 */
export function estimateSize(rendering: KRendering, givenBounds: Bounds): Bounds {
    let bounds = emptyBounds()
    const placementData = getPlacementData(rendering)

    if (placementData && (isAreaPlacementData(placementData) || isGridPlacementData(placementData))) {
        bounds = estimateAreaPlacedChildSize(rendering, placementData as KAreaPlacementData, givenBounds)
    } else if (placementData && isPointPlacementData(placementData)) {
        bounds = estimatePointPlacedChildSize(rendering, placementData as KPointPlacementData)
    } else {
        bounds = basicEstimateSize(rendering, givenBounds)
    }

    if (isImage(rendering)) {
        bounds = estimateImageSize(rendering as KImage, bounds)
    }

    return bounds
}

/**
 * Estimates the pure minimal size of a {@link KRendering} without evaluating its
 * {@link KPlacementData} w.r.t. minimal size constraints.<br>
 * The previous determined size is incorporated while resolving relative placement/size
 * constraints.
 *
 * @param rendering the {@link KRendering} to be evaluated
 * @param givenBounds the size that is currently assigned to 'rendering's container or the related
 *            {@link KShapeLayout} respectively
 * @return the minimal size
 */
export function basicEstimateSize(rendering: KRendering, givenBounds: Bounds): Bounds {
    if (isKText(rendering)) {
        return estimateKTextSize(rendering as KText)
    }
    if (isChildArea(rendering)) {
        return emptyBounds()
    }
    if (isRenderingRef(rendering)) {
        const retrievedRendering = (rendering as KRenderingRef).rendering
        if (retrievedRendering) {
            return basicEstimateSize(retrievedRendering, givenBounds)
        }
        return boundsOf(givenBounds)
    }
    if (isContainerRendering(rendering)) {
        const placement = (rendering as KContainerRendering).childPlacement
        if (placement && isGridPlacement(placement)) {
            return estimateGridSize(rendering as KContainerRendering, givenBounds)
        }
        let maxSize = boundsOf(givenBounds)
        const { children } = rendering as KContainerRendering
        if (children) {
            for (const childRendering of children) {
                const childSize = estimateSize(childRendering, givenBounds)
                maxSize = boundsMax(maxSize, childSize)
            }
        }
        if (isPolyline(rendering)) {
            maxSize = boundsMax(maxSize, evaluatePolylineBounds(rendering as KPolyline, maxSize))
        }
        return maxSize
    }
    return boundsOf(givenBounds)
}

/**
 * Searches a rendering for a child area and records the path to it.
 */
export function findChildArea(rendering: KRendering, path: KRendering[]): boolean {
    path.push(rendering)
    if (isChildArea(rendering)) {
        return true
    }
    if (isRenderingRef(rendering)) {
        const referencedRendering = (rendering as KRenderingRef).rendering
        if (referencedRendering && findChildArea(referencedRendering, path)) {
            return true
        }
    } else if (isContainerRendering(rendering)) {
        for (const childRendering of (rendering as KContainerRendering).children) {
            if (findChildArea(childRendering, path)) {
                return true
            }
        }
    }
    path.pop()
    return false
}

/**
 * Returns the minimal bounds for a KText.
 *
 * @param kText the text rendering
 * @return the estimated text bounds
 */
function estimateKTextSize(kText: KText): Bounds {
    if (kText.text === null || kText.text === undefined) {
        const properties = kText.properties ?? {}
        const textOverride = properties[LABELS_TEXT_OVERRIDE] ?? properties[LEGACY_LABELS_TEXT_OVERRIDE]
        if (textOverride !== null && textOverride !== undefined) {
            return estimateTextSize(kText, String(textOverride))
        }
        return estimateTextSize(kText, '')
    }
    return estimateTextSize(kText, kText.text)
}

/**
 * Returns the testing size assigned to the given KText, or null if no such size exists.
 */
export function getTestingTextSize(kText: KText | null | undefined): Bounds | null {
    if (!kText) {
        return null
    }
    const properties = kText.properties ?? {}
    const testHeight = properties[TESTING_TEXT_HEIGHT]
    const testWidth = properties[TESTING_TEXT_WIDTH]

    if (testHeight !== undefined || testWidth !== undefined) {
        const height = testHeight !== undefined ? Number.parseFloat(String(testHeight)) : 0
        const width = testWidth !== undefined ? Number.parseFloat(String(testWidth)) : 0
        if (height !== 0 || width !== 0) {
            return boundsOf(width, height)
        }
    }
    return null
}

/**
 * Returns the minimal bounds for a string based on configurations of a KText.
 *
 * @param kText the text rendering (may be null)
 * @param text the text to measure
 * @return the estimated text bounds
 */
export function estimateTextSize(kText: KText | null | undefined, text: string | null | undefined): Bounds {
    const testingSize = getTestingTextSize(kText)
    if (testingSize) {
        return testingSize
    }

    // Reuse server-side measurements when they are available. The dedicated text bounds
    // are preferred, but some clients only receive the general calculated bounds.
    const properties = kText?.properties
    const previouslyCalculated = properties?.[CALCULATED_TEXT_BOUNDS] ?? properties?.[CALCULATED_BOUNDS]
    if (isBounds(previouslyCalculated) && previouslyCalculated.width >= 0 && previouslyCalculated.height > 0) {
        return boundsOf(previouslyCalculated)
    }

    const actualText = text ?? ''
    const lines = actualText.split('\n')
    const textWidths = new Array<number>(lines.length)
    const textHeights = new Array<number>(lines.length)
    let maxWidth = 0
    let totalHeight = 0
    let firstLineY = 0

    let fontSizePt = 10
    let fontName = 'Overpass, sans-serif'
    let fontBold = false
    let fontItalic = false
    if (kText?.styles) {
        for (const style of kText.styles as any[]) {
            if (!style) continue
            if (style.type === 'KFontSizeImpl' && typeof style.size === 'number') {
                fontSizePt = style.size
            } else if (style.type === 'KFontNameImpl' && typeof style.name === 'string') {
                fontName = style.name
            } else if (style.type === 'KFontBoldImpl' && typeof style.bold === 'boolean') {
                fontBold = style.bold
            } else if (style.type === 'KFontItalicImpl' && typeof style.italic === 'boolean') {
                fontItalic = style.italic
            }
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const lineSize = estimateTextLineSize(lines[i], fontSizePt, fontName, fontBold, fontItalic)
        if (i === 0) {
            firstLineY = lineSize.y
        }
        maxWidth = Math.max(maxWidth, lineSize.width)
        totalHeight += lineSize.height
        textWidths[i] = lineSize.width
        textHeights[i] = lineSize.height
    }

    const size = boundsOf(0, firstLineY, maxWidth, totalHeight)

    if (kText) {
        const properties = kText.properties ?? (kText.properties = {})
        properties[CALCULATED_TEXT_BOUNDS] = boundsOf(size)
        properties[CALCULATED_TEXT_LINE_WIDTHS] = textWidths
        properties[CALCULATED_TEXT_LINE_HEIGHTS] = textHeights
    }

    return size
}

let measureCanvas: HTMLCanvasElement | undefined

/**
 * Estimates the size of a single text line with the same pt-to-px conversion as rendering.
 */
function estimateTextLineSize(
    text: string,
    fontSizePt = 10,
    fontName = 'Overpass, sans-serif',
    fontBold = false,
    fontItalic = false
): Bounds {
    const fontSizePx = (fontSizePt * 96) / 72
    if (typeof document !== 'undefined') {
        try {
            if (!measureCanvas) {
                measureCanvas = document.createElement('canvas')
            }
            const ctx = measureCanvas.getContext('2d')
            if (ctx) {
                const style = fontItalic ? 'italic ' : ''
                const weight = fontBold ? 'bold ' : ''
                ctx.font = `${style}${weight}${fontSizePx}px ${fontName}`
                const metrics = ctx.measureText(text.length === 0 ? ' ' : text)
                const ascent = Number.isFinite(metrics.fontBoundingBoxAscent)
                    ? metrics.fontBoundingBoxAscent
                    : metrics.actualBoundingBoxAscent
                const descent = Number.isFinite(metrics.fontBoundingBoxDescent)
                    ? metrics.fontBoundingBoxDescent
                    : metrics.actualBoundingBoxDescent
                const width = text.length === 0 ? 0 : metrics.width
                return { x: 0, y: -ascent, width, height: ascent + descent }
            }
        } catch {
            // fall through to heuristic
        }
    }
    const width = text.length * fontSizePt * 0.625
    const height = fontSizePt * 2
    return { x: 0, y: 0, width, height }
}

/**
 * Computes the minimal bounds of a KImage, especially in case a clip shape is configured.
 *
 * @param image the image rendering
 * @param imageSize the estimated image size
 * @return the minimal bounds
 */
export function estimateImageSize(image: KImage, imageSize: Bounds): Bounds {
    const { clipShape } = image
    if (!clipShape) {
        return boundsOf(imageSize)
    }

    const pd = image.placementData
    const pdType = pd ? pd.type : ''

    switch (pdType) {
        case K_POINT_PLACEMENT_DATA: {
            const cpd = clipShape.placementData
            const cpdType = cpd ? cpd.type : ''
            switch (cpdType) {
                case K_POINT_PLACEMENT_DATA:
                    return estimatePointPlacedChildSize(clipShape, cpd as KPointPlacementData)
                case K_AREA_PLACEMENT_DATA: {
                    const ppd = pd as KPointPlacementData
                    return calculateBounds(null, boundsOf(ppd.minWidth, ppd.minHeight), null, clipShape)
                }
                default:
                    return boundsOf(imageSize)
            }
        }
        case K_AREA_PLACEMENT_DATA: {
            const apd = pd as KAreaPlacementData
            const { topLeft } = apd
            const { bottomRight } = apd
            let { x } = imageSize
            let { y } = imageSize
            let { width } = imageSize
            let { height } = imageSize

            const widthModEnabled = topLeft && bottomRight && topLeft.x.type === bottomRight.x.type
            const heightModEnabled = topLeft && bottomRight && topLeft.y.type === bottomRight.y.type

            if (widthModEnabled) {
                x = 0
                if (topLeft.x.type === K_LEFT_POSITION) {
                    width -= topLeft.x.absolute
                } else {
                    width -= bottomRight.x.absolute
                }
            }

            if (heightModEnabled) {
                y = 0
                if (topLeft.y.type === K_TOP_POSITION) {
                    height -= topLeft.y.absolute
                } else {
                    height -= bottomRight.y.absolute
                }
            }

            return calculateBounds(null, boundsOf(x, y, width, height), null, clipShape)
        }
        default:
            return boundsOf(imageSize)
    }
}

/**
 * Calculates the bounds of a child rendering inside a parent with the given placement
 * and bounds.
 *
 * @param placement the placement of children
 * @param parentBounds the parent bounds
 * @param children the children list
 * @param child the child rendering
 * @return the bounds of the child
 */
function calculateBounds(
    placement: KPlacement | null,
    parentBounds: Bounds,
    children: KRendering[] | null,
    child: KRendering
): Bounds {
    let bounds: Bounds

    if (!placement) {
        const pd = getPlacementData(child)
        const ppd = asPointPlacementData(pd)
        if (ppd) {
            bounds = evaluatePointPlacement(ppd, estimateSize(child, emptyBounds()), parentBounds)
        } else {
            bounds = evaluateAreaPlacement(asAreaPlacementData(pd), parentBounds)
        }
    } else {
        const gridPlacement = asGridPlacement(placement)
        if (!gridPlacement) {
            bounds = emptyBounds()
        } else {
            const childBounds = evaluateGridPlacement(gridPlacement, children, parentBounds)
            const index = children ? children.lastIndexOf(child) : -1
            bounds = index >= 0 ? childBounds[index] : emptyBounds()
        }
    }

    if (isPolyline(child)) {
        return evaluatePolylineBounds(child as KPolyline, bounds)
    }
    return bounds
}

/**
 * Returns the required minimal size of a rendering with attached area placement data.
 *
 * @param rendering the rendering
 * @param areaPlacementData the area placement data
 * @param givenBounds the given bounds
 * @return the minimal size
 */
function estimateAreaPlacedChildSize(
    rendering: KRendering,
    areaPlacementData: KAreaPlacementData,
    givenBounds: Bounds
): Bounds {
    const childSize = evaluateAreaPlacement(areaPlacementData, givenBounds)
    const containerMinSize = basicEstimateSize(rendering, childSize)
    return inverselyApplyBoundingBoxKPositions(
        containerMinSize,
        areaPlacementData.topLeft,
        areaPlacementData.bottomRight
    )
}

/**
 * Returns the bounds for area placement data in the given parent bounds.
 *
 * @param dpd the direct/area placement data
 * @param parentBounds the parent bounds
 * @return the evaluated bounds
 */
export function evaluateAreaPlacement(dpd: KAreaPlacementData | null | undefined, parentBounds: Bounds): Bounds {
    if (!dpd) {
        return boundsOf(parentBounds)
    }
    return evaluateAreaPlacementPositions(dpd.topLeft, dpd.bottomRight, parentBounds)
}

/**
 * Returns the bounds described by the given top-left and bottom-right positions.
 *
 * @param topLeft the top-left position
 * @param bottomRight the bottom-right position
 * @param parentBounds the parent bounds
 * @return the evaluated bounds
 */
export function evaluateAreaPlacementPositions(
    topLeft: KPosition | null | undefined,
    bottomRight: KPosition | null | undefined,
    parentBounds: Bounds
): Bounds {
    const topLeftPoint = topLeft ? evaluateKPosition(topLeft, parentBounds, true) : { x: 0, y: 0 }
    const bottomRightPoint = bottomRight
        ? evaluateKPosition(bottomRight, parentBounds, false)
        : { x: parentBounds.width, y: parentBounds.height }

    return boundsOf(
        topLeftPoint.x,
        topLeftPoint.y,
        bottomRightPoint.x - topLeftPoint.x,
        bottomRightPoint.y - topLeftPoint.y
    )
}

/**
 * Returns the bounds for a point placement data in given parent bounds.
 *
 * @param rendering the rendering to be evaluated
 * @param ppd the point placement data
 * @param parentBounds the parent bounds
 * @return the resulting bounds
 */
export function evaluatePointPlacementRendering(
    rendering: KRendering,
    ppd: KPointPlacementData,
    parentBounds: Bounds
): Bounds {
    return evaluatePointPlacement(ppd, basicEstimateSize(rendering, emptyBounds()), parentBounds)
}

/**
 * Returns the bounds for a point placement data in given parent bounds.
 *
 * @param rendering the rendering to be evaluated
 * @param ppd the point placement data
 * @param parentBounds the parent bounds
 * @return the resulting bounds
 */
export function evaluatePointPlacement(rendering: KRendering, ppd: KPointPlacementData, parentBounds: Bounds): Bounds
/**
 * Returns the bounds for a point placement data in given parent bounds.
 *
 * @param ppd the point placement data
 * @param ownBounds the size of the object to be placed
 * @param parentBounds the parent bounds
 * @return the resulting bounds
 */
export function evaluatePointPlacement(
    ppd: KPointPlacementData | null | undefined,
    ownBounds: Bounds,
    parentBounds: Bounds
): Bounds
/**
 * Returns the bounds for a point placement data in given parent bounds.
 *
 * @param renderingOrPpd either the rendering or the point placement data
 * @param ppdOrOwnBounds either the point placement data or the own bounds
 * @param parentBounds the parent bounds
 * @return the resulting bounds
 */
export function evaluatePointPlacement(
    renderingOrPpd: KRendering | KPointPlacementData | null | undefined,
    ppdOrOwnBounds: KPointPlacementData | Bounds,
    parentBounds: Bounds
): Bounds {
    if (
        ppdOrOwnBounds &&
        typeof (ppdOrOwnBounds as Bounds).width === 'number' &&
        typeof (ppdOrOwnBounds as Bounds).height === 'number' &&
        typeof (ppdOrOwnBounds as KPointPlacementData).referencePoint === 'undefined'
    ) {
        const ppd = renderingOrPpd as KPointPlacementData | null | undefined
        const ownBounds = ppdOrOwnBounds as Bounds
        return evaluatePointPlacementInternal(ppd, ownBounds, parentBounds)
    }

    const rendering = renderingOrPpd as KRendering
    const ppd = ppdOrOwnBounds as KPointPlacementData
    return evaluatePointPlacementInternal(ppd, basicEstimateSize(rendering, emptyBounds()), parentBounds)
}

/**
 * Internal implementation for evaluating point placement.
 *
 * @param ppd the point placement data
 * @param ownBounds the own bounds
 * @param parentBounds the parent bounds
 * @return the evaluated bounds
 */
function evaluatePointPlacementInternal(
    ppd: KPointPlacementData | null | undefined,
    ownBounds: Bounds,
    parentBounds: Bounds
): Bounds {
    if (!ppd) {
        return boundsOf(parentBounds.width, parentBounds.height)
    }

    const width = Math.max(ownBounds.width, ppd.minWidth)
    const height = Math.max(ownBounds.height, ppd.minHeight)

    const ref = ppd.referencePoint
    const refPoint = ref ? evaluateKPosition(ref, parentBounds, true) : { x: 0, y: 0 }

    let x0 = refPoint.x
    let y0 = refPoint.y

    switch (ppd.horizontalAlignment) {
        case HorizontalAlignment.CENTER:
            x0 -= width / 2
            break
        case HorizontalAlignment.RIGHT:
            x0 -= width
            break
        default:
        case HorizontalAlignment.LEFT:
            break
    }

    switch (ppd.verticalAlignment) {
        case VerticalAlignment.BOTTOM:
            y0 -= height
            break
        case VerticalAlignment.CENTER:
            y0 -= height / 2
            break
        default:
        case VerticalAlignment.TOP:
            break
    }

    return boundsOf(x0, y0, width, height)
}

/**
 * Inversely applies the given passe-partout in order to calculate the outer bounds
 * based on the given inner bounds.
 */
export function inverselyApplyBoundingBoxKPositions(
    innerBounds: Bounds,
    topLeft: KPosition | null | undefined,
    bottomRight: KPosition | null | undefined
): Bounds {
    return inverselyApplySizeData(
        innerBounds,
        getHorizontalSize(topLeft, bottomRight),
        getVerticalSize(topLeft, bottomRight)
    )
}

function inverselyApplySizeData(bounds: Bounds, horSize: [number, number], vertSize: [number, number]): Bounds {
    const absXOffset = horSize[0]
    const relWidth = horSize[1]
    const absYOffset = vertSize[0]
    const relHeight = vertSize[1]

    const width = relWidth === 0 ? absXOffset : (bounds.width + absXOffset) / relWidth
    const height = relHeight === 0 ? absYOffset : (bounds.height + absYOffset) / relHeight

    return boundsOf(bounds.x, bounds.y, width, height)
}

/**
 * whether a position is measured in the same direction as the point it is defining
 */
const PRIMARY = 0
/**
 * whether a position is measured contrary to the point it is defining
 */
const SECONDARY = 1
const FIRST_OFFSET = 100

const PRIMARY_PRIMARY = PRIMARY * FIRST_OFFSET + PRIMARY
const PRIMARY_SECONDARY = PRIMARY * FIRST_OFFSET + SECONDARY
const SECONDARY_PRIMARY = SECONDARY * FIRST_OFFSET + PRIMARY
const SECONDARY_SECONDARY = SECONDARY * FIRST_OFFSET + SECONDARY

function getHorizontalSize(
    topLeft: KPosition | null | undefined,
    bottomRight: KPosition | null | undefined
): [number, number] {
    let abs0: number
    let abs1: number
    let rel0: number
    let rel1: number
    let posId0: number
    let posId1: number

    if (!topLeft) {
        abs0 = 0
        rel0 = 0
        posId0 = PRIMARY
    } else {
        const lPos = toNonNullLeftPosition(topLeft.x)
        abs0 = lPos.absolute
        rel0 = lPos.relative
        posId0 = lPos.type === K_LEFT_POSITION ? PRIMARY : SECONDARY
    }

    if (!bottomRight) {
        abs1 = 0
        rel1 = 0
        posId1 = PRIMARY
    } else {
        const rPos = toNonNullRightPosition(bottomRight.x)
        abs1 = rPos.absolute
        rel1 = rPos.relative
        posId1 = rPos.type === K_RIGHT_POSITION ? PRIMARY : SECONDARY
    }

    return getSize(abs0, rel0, posId0, abs1, rel1, posId1)
}

function getVerticalSize(
    topLeft: KPosition | null | undefined,
    bottomRight: KPosition | null | undefined
): [number, number] {
    let abs0: number
    let abs1: number
    let rel0: number
    let rel1: number
    let posId0: number
    let posId1: number

    if (!topLeft) {
        abs0 = 0
        rel0 = 0
        posId0 = PRIMARY
    } else {
        const tPos = toNonNullTopPosition(topLeft.y)
        abs0 = tPos.absolute
        rel0 = tPos.relative
        posId0 = tPos.type === K_TOP_POSITION ? PRIMARY : SECONDARY
    }

    if (!bottomRight) {
        abs1 = 0
        rel1 = 0
        posId1 = PRIMARY
    } else {
        const bPos = toNonNullBottomPosition(bottomRight.y)
        abs1 = bPos.absolute
        rel1 = bPos.relative
        posId1 = bPos.type === K_BOTTOM_POSITION ? PRIMARY : SECONDARY
    }

    return getSize(abs0, rel0, posId0, abs1, rel1, posId1)
}

function getSize(
    abs0: number,
    rel0: number,
    posId0: number,
    abs1: number,
    rel1: number,
    posId1: number
): [number, number] {
    let absOffset: number
    let relWidth: number
    const position = posId0 * FIRST_OFFSET + posId1

    switch (position) {
        case PRIMARY_PRIMARY:
            relWidth = 1 - (rel1 + rel0)
            absOffset = abs0 + abs1
            break
        case PRIMARY_SECONDARY:
            relWidth = rel1 - rel0
            absOffset = relWidth === 0 ? abs1 : abs0 - abs1
            break
        case SECONDARY_PRIMARY:
            relWidth = rel0 - rel1
            absOffset = relWidth === 0 ? abs0 : -abs0 + abs1
            break
        case SECONDARY_SECONDARY:
            relWidth = rel1 + rel0 - 1
            absOffset = -abs0 - abs1
            break
        default:
            relWidth = 1
            absOffset = 0
            break
    }

    return [absOffset, relWidth]
}

/**
 * Returns the required minimal size of a rendering with attached point placement data.
 *
 * @param rendering the rendering
 * @param pointPlacementData the point placement data
 * @return the minimal size
 */
export function estimatePointPlacedChildSize(rendering: KRendering, pointPlacementData: KPointPlacementData): Bounds {
    const minimalSize = boundsOf(pointPlacementData.minWidth, pointPlacementData.minHeight)
    const childSize = boundsMax(minimalSize, basicEstimateSize(rendering, minimalSize))
    return boundsOf(
        getHorizontalSizeFromPointPlacementData(pointPlacementData, childSize.width),
        getVerticalSizeFromPointPlacementData(pointPlacementData, childSize.height)
    )
}

function getHorizontalSizeFromPointPlacementData(ppd: KPointPlacementData, minWidth: number): number {
    if (!ppd) {
        return minWidth
    }

    const pos = ppd.referencePoint
    const abs = pos && pos.x ? pos.x.absolute : 0
    let calculatedWidth = 0

    switch (ppd.horizontalAlignment) {
        case HorizontalAlignment.LEFT:
        case HorizontalAlignment.RIGHT:
            calculatedWidth = abs + minWidth + ppd.horizontalMargin
            break
        case HorizontalAlignment.CENTER: {
            const halfWidth = minWidth / 2
            if (abs > halfWidth) {
                calculatedWidth = abs + halfWidth + ppd.horizontalMargin
            } else {
                calculatedWidth = minWidth + 2 * ppd.horizontalMargin
            }
            break
        }
        default:
            break
    }

    return calculatedWidth
}

function getVerticalSizeFromPointPlacementData(ppd: KPointPlacementData, minHeight: number): number {
    if (!ppd) {
        return minHeight
    }

    const pos = ppd.referencePoint
    const abs = pos && pos.y ? pos.y.absolute : 0
    let calculatedHeight = 0

    switch (ppd.verticalAlignment) {
        case VerticalAlignment.TOP:
        case VerticalAlignment.BOTTOM:
            calculatedHeight = abs + minHeight + ppd.verticalMargin
            break
        case VerticalAlignment.CENTER: {
            const halfHeight = minHeight / 2
            if (abs > halfHeight) {
                calculatedHeight = abs + halfHeight + ppd.verticalMargin
            } else {
                calculatedHeight = minHeight + 2 * ppd.verticalMargin
            }
            break
        }
        default:
            break
    }

    return calculatedHeight
}

/**
 * Returns the bounds for a polyline based on the given bounds.
 *
 * @param line the polyline
 * @param givenBounds the given bounds
 * @return the evaluated bounds
 */
function evaluatePolylineBounds(line: KPolyline, givenBounds: Bounds): Bounds {
    if (!line.points || line.points.length === 0) {
        return boundsOf(givenBounds.width, givenBounds.height)
    }

    let maxX = Number.MIN_VALUE
    let maxY = Number.MIN_VALUE
    for (const polylinePoint of line.points) {
        const point = evaluateKPosition(polylinePoint, givenBounds, true)
        if (point.x > maxX) {
            maxX = point.x
        }
        if (point.y > maxY) {
            maxY = point.y
        }
    }
    return boundsMax(boundsOf(maxX, maxY), givenBounds)
}

/**
 * Evaluates a position inside the given parent bounds.
 *
 * @param position the position
 * @param parentBounds the parent bounds
 * @param topLeft if true assume top-left position, if false assume bottom-right
 * @return the evaluated point
 */
export function evaluateKPosition(
    position: KPosition | null | undefined,
    parentBounds: Bounds,
    topLeft: boolean
): Point {
    if (!position) {
        return { x: 0, y: 0 }
    }

    const { width, height } = parentBounds
    const point = { x: 0, y: 0 }
    const xPos = topLeft ? toNonNullLeftPosition(position.x) : toNonNullRightPosition(position.x)
    const yPos = topLeft ? toNonNullTopPosition(position.y) : toNonNullBottomPosition(position.y)

    if (isLeftPosition(xPos)) {
        point.x = xPos.relative * width + xPos.absolute
    } else {
        point.x = width - xPos.relative * width - xPos.absolute
    }
    if (isTopPosition(yPos)) {
        point.y = yPos.relative * height + yPos.absolute
    } else {
        point.y = height - yPos.relative * height - yPos.absolute
    }
    return point
}

/**
 * Evaluates the points of a polyline placement in given parent bounds.
 *
 * @param line the polyline
 * @param parentBounds the parent bounds
 * @return the evaluated points
 */
export function evaluatePolylinePlacement(line: KPolyline, parentBounds: Bounds): Point[] {
    if (!line || !line.points || line.points.length === 0) {
        return [{ x: 0, y: 0 }]
    }
    return line.points.map((point) => evaluateKPosition(point, parentBounds, true))
}

/**
 * Calculates the offset of the child area in the given root rendering, which is equal
 * to the insets of the related node.
 *
 * @param rootRendering the root rendering
 * @param insets the insets object to fill
 * @param minSize the minimum size
 */
export function calculateInsets(rootRendering: KRendering | null, insets: KInsets, minSize: Bounds): void {
    if (!rootRendering) {
        return
    }

    const path: KRendering[] = []
    if (!findChildArea(rootRendering, path)) {
        return
    }

    let currentBounds = boundsOf(minSize)
    let currentParent: KContainerRendering | null = null

    let leftInset = 0
    let rightInset = 0
    let topInset = 0
    let bottomInset = 0

    while (path.length > 0) {
        let currentRendering = path.shift() as KRendering

        const bounds =
            currentParent === null
                ? calculateBounds(null, currentBounds, null, currentRendering)
                : calculateBounds(
                      currentParent.childPlacement ?? null,
                      currentBounds,
                      currentParent.children,
                      currentRendering
                  )

        leftInset += bounds.x
        rightInset += currentBounds.width - bounds.x - bounds.width
        topInset += bounds.y
        bottomInset += currentBounds.height - bounds.y - bounds.height

        while (isRenderingRef(currentRendering)) {
            currentRendering = (currentRendering as KRenderingRef).rendering
            path.shift()
            if (!currentRendering) {
                break
            }
        }

        if (currentRendering && isContainerRendering(currentRendering)) {
            currentParent = currentRendering as KContainerRendering
            currentBounds = boundsOf(0, 0, bounds.width, bounds.height)
        }
    }

    insets.left = leftInset
    insets.right = rightInset
    insets.top = topInset
    insets.bottom = bottomInset
}

/**
 * Estimates the size of a node.
 *
 * @param node the node object
 * @return the estimated size
 */
export function estimateSizeForNode(node: any): Bounds {
    const nodeRendering = node?.data?.find ? node.data.find((d: any) => isRendering(d)) : null
    if (nodeRendering) {
        return estimateSize(nodeRendering, node.size || emptyBounds())
    }
    return emptyBounds()
}

/**
 * Estimates the size of a label.
 *
 * @param label the label object
 * @return the estimated size
 */
export function estimateSizeForLabel(label: any): Bounds {
    const labelRendering = label?.data?.find ? label.data.find((d: any) => isRendering(d)) : null
    if (labelRendering) {
        return estimateSize(labelRendering, label.size || emptyBounds())
    }
    if (label?.text) {
        return estimateTextSizeForText(label.text)
    }
    return emptyBounds()
}

/**
 * Estimates the size of text.
 *
 * @param text the text
 * @param kText optional KText rendering
 * @return the estimated size
 */
export function estimateTextSizeForText(text: string, kText?: KText | null): Bounds {
    return estimateTextSize(kText ?? null, text)
}
