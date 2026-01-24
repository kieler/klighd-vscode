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
    isSKLabel,
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
    KPointPlacementData,
    KPolyline,
    KPosition,
    KRendering,
    KRenderingRef,
    KText,
    SKLabel,
    VerticalAlignment,
} from '../skgraph-models'
import { boundsMax, emptyBounds } from './bounds-util'
import {
    toNonNullBottomPosition,
    toNonNullLeftPosition,
    toNonNullRightPosition,
    toNonNullTopPosition,
} from './krendering-util'
import { estimateGridSize, evaluateGridPlacement } from './gridplacement-util'

/**
 * Estimates the minimal size of a KRendering.<br>
 * The the previous defined size is incorporated while resolving relative placement/size
 * constraints.
 *
 * @param rendering
 *            the {@link KRendering} to be evaluated
 * @param givenBounds
 *            the size that is currently assigned to 'rendering's container or the related
 *            {@link KShapeLayout} respectively
 * @return the minimal size
 */
export function estimateSize(rendering: KRendering, givenBounds: Bounds): Bounds {
    let bounds = Bounds.EMPTY
    const { placementData } = rendering

    if (placementData && (isAreaPlacementData(placementData) || isGridPlacementData(placementData))) {
        bounds = estimateAreaPlacedChildSize(rendering, placementData as KAreaPlacementData, givenBounds)
    } else if (isPointPlacementData(placementData)) {
        bounds = estimatePointPlacedChildSize(rendering, placementData as KPointPlacementData)
    } else {
        bounds = basicEstimateSize(rendering, givenBounds)
    }

    if (isImage(rendering)) {
        bounds = estimateImageSize(rendering as KImage, givenBounds)
    }

    return bounds
}

/**
 * Estimates the pure minimal size of a {@link KRendering} without evaluating its
 * {@link KPlacementData} w.r.t. minimal size constraints.<br>
 * The previous determined size is incorporated while resolving relative placement/size
 * constraints.
 *
 * @param rendering
 *            the {@link KRendering} to be evaluated
 * @param givenBounds
 *            the size that is currently assigned to 'rendering's container or the related
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

        // TODO: Currently always undefined, as the KRenderingRef's rendering is not set.
        if (retrievedRendering !== undefined) return basicEstimateSize(retrievedRendering, givenBounds)

        console.log('rendering refs not implemented')
        return givenBounds
    }
    if (isContainerRendering(rendering)) {
        const placement = (rendering as KContainerRendering).childPlacement
        if (placement && isGridPlacement(placement)) {
            return estimateGridSize(rendering, givenBounds)
        }
        let maxSize: Bounds = givenBounds
        for (const childRendering of (rendering as KContainerRendering).children) {
            const childSize: Bounds = estimateSize(childRendering, givenBounds)
            maxSize = boundsMax(givenBounds, childSize)
        }
        if (isPolyline(rendering)) {
            maxSize = boundsMax(maxSize, evaluatePolylineBounds(rendering as KPolyline, maxSize))
        }
        return maxSize
    }
    return givenBounds
}

export function findChildArea(rendering: KRendering, path: KRendering[]): boolean {
    // TODO: Test this method
    // TODO: Comment this method
    console.warn('METHOD IS BEING USED: ' + 'findChildArea')

    path.push(rendering)
    if (isChildArea(rendering)) return true
    if (isRenderingRef(rendering)) {
        const renderingReference = rendering as KRenderingRef
        const referencedRendering = renderingReference.rendering
        if (referencedRendering && findChildArea(referencedRendering, path)) return true
    } else if (isContainerRendering(rendering)) {
        const containerRendering = rendering as KContainerRendering
        for (let childRendering of containerRendering.children) {
            if (findChildArea(childRendering, path)) return true
        }
    }
    path.pop()
    return false
}

/**
 * Returns the minimal bounds for a KText.
 *
 * @param kText
 *            the KText containing the text string whose size is to be estimated.
 * @return the minimal bounds for the {@link KText}
 */
function estimateKTextSize(kText: KText): Bounds {
    if (!kText.text) {
        if (kText.properties['klighd.labels.textOverride']) {
            return estimateTextSize(kText, kText.properties['klighd.labels.textOverride'] as string)
        }

        // TODO: Try to find the KText's parent label
        // at the moment we have no easy access to parent's of KRenderings on the client
        /*
        let o = kText.parent
        while (isRendering(o)) o = o.parent

        if (isSKLabel(o)) return estimateTextSize(kText, (o as SKLabel).text)
        else return estimateTextSize(kText, '')
        */
        return estimateTextSize(kText, '')
    } else return estimateTextSize(kText, kText.text)
}

/**
 * Returns the minimal bounds for a string based on configurations of a {@link KText}. The
 * string is handed over separately in order to allow the text size estimation for
 * {@link KLabel KLabels}, whose text string is given outside of the {@link KText} rendering.
 *
 * @param kText
 *            the KText providing font configurations like font name, size, and style; maybe
 *            <code>null</code>
 * @param text
 *            the actual text string whose size is to be estimated; maybe <code>null</code>
 * @return the minimal bounds for the string
 */
function estimateTextSize(kText: KText, text: string): Bounds {
    // TODO: actually figure out how to estimate the text size accurately
    // heh: implemented first heuristic based on visual estimations of the Overpass Regular font.
    return { x: 0, y: 0, width: (text.length / 4) * 25, height: 20 }

    // TODO: persist CALCULATED_TEXT_BOUNDS, CALCULATED_TEXT_LINE_WIDTHS, CALCULATED_TEXT_LINE_HEIGHTS in properties

    // FIXME: dummy data
    //return { x: 0, y: 0, width: 40, height: 20 }
}

/**
 * Computes the minimal bounds of an {@link KImage}, esp. in case a clip shape is configured.<br>
 * This method basically applies the area/point placement data of the clip shape to the already
 * determined size of the KImage in order to avoid the extension of the, e.g., node to the
 * complete bounds of the image.<br>
 * <br>
 * <b>Note</b> that the general assumption of the size estimation assuming the bounds of a child
 * figure being completely encompassed by the bounds of the parent figure is not applied here!
 * Instead, the size estimation of images is supposed to cope with negative values of, at least,
 * the absolute positioning components.<br>
 * <br>
 * If no clip shape is defined it simply returns <code>imageSize</code>.
 *
 * @param image
 *            the {@link KImage}
 * @param imageSize
 *            the pre-calculated size of the image itself
 * @return the minimal size
 */
function estimateImageSize(image: KImage, givenBounds: Bounds): Bounds {
    // TODO: Test this method
    // TODO: Comment this method
    console.warn('METHOD IS BEING USED: ' + 'estimateImageSize')

    // Make a writable copy
    let imageSize = { x: givenBounds.x, y: givenBounds.y, width: givenBounds.width, height: givenBounds.height }
    let cs = image.clipShape

    if (!cs) return imageSize
    else {
        const pd = image.placementData
        const pdType = pd ? pd.type : 0

        switch (pdType) {
            case K_POINT_PLACEMENT_DATA:
                const cpd = cs.placementData
                const cpdType = cs ? cpd?.type : 0
                switch (cpdType) {
                    case K_POINT_PLACEMENT_DATA:
                        return estimatePointPlacedChildSize(cs, cpd as KPointPlacementData)
                    case K_AREA_PLACEMENT_DATA:
                        const ppd = pd as KPointPlacementData
                        return calculateBounds(
                            null,
                            { x: 0, y: 0, width: ppd.minWidth, height: ppd.minHeight },
                            null,
                            cs
                        )
                    default:
                        return imageSize
                }
            case K_AREA_PLACEMENT_DATA:
                const apd = pd as KAreaPlacementData
                const tl = apd.topLeft
                const br = apd.bottomRight

                const widthModEnabled = tl && br && tl.x.type === br.x.type
                const heightModEnabled = tl && br && tl.y.type === br.y.type

                if (widthModEnabled) {
                    imageSize.x = 0
                    if (tl.x.type === K_LEFT_POSITION) imageSize.width -= tl.x.absolute
                    else imageSize.width -= br.x.absolute
                }

                if (heightModEnabled) {
                    imageSize.y = 0
                    if (tl.y.type === K_TOP_POSITION) imageSize.height -= tl.y.absolute
                    else imageSize.height -= br.y.absolute
                }

                return calculateBounds(null, imageSize, null, cs)
            default:
                return imageSize
        }
    }
}

function calculateBounds(
    placement: KPlacement | null,
    parentBounds: Bounds,
    children: KRendering[] | null,
    child: KRendering
): Bounds {
    // TODO: Implement this method
    // TODO: Comment this method
    console.warn('METHOD IS BEING USED: ' + 'calculateBounds')
    let bounds: Bounds

    if (!placement) {
        const pd = child.placementData
        const ppd = pd as KPointPlacementData
        bounds = ppd
            ? evaluatePointPlacement(ppd, estimateSize(child, Bounds.EMPTY), parentBounds)
            : evaluateAreaPlacement(pd as KAreaPlacementData, parentBounds)
    } else {
        // TODO: Fully port the rest of the KRenderingSwitch functionality.
        // This here should be enough, as in the Java implementation the Switch returns null for all methods inside the KGRIDPLACEMENT-case.
        const gridPlacement = placement as KGridPlacement
        const childBounds = evaluateGridPlacement(gridPlacement, children, parentBounds)
        bounds = childBounds && children ? childBounds[children.lastIndexOf(child)] : Bounds.EMPTY

        /*
        bounds = new KRenderingSwitch<Bounds>() {
                @Override
                public Bounds caseKGridPlacement(final KGridPlacement gridPlacement) {
                    // evaluate grid based on the children, their placementData and size
                    // and get placement for current child
                    final Bounds[] childBounds = GridPlacementUtil.evaluateGridPlacement(
                            gridPlacement, children, parentBounds);
                    if (childBounds == null) {
                        return Bounds.of(0, 0);
                    } else {
                        final int index = children.lastIndexOf(child);
                        return childBounds[index];
                    }
                }
            }
            .doSwitch(placement);
        */
    }

    if (isPolyline(child)) return evaluatePolylineBounds(child as KPolyline, bounds)
    else return bounds
}

/**
 * Returns the required minimal size of a {@link KRendering} width attached
 * {@link KAreaPlacementData}.
 *
 * @param container
 *            the {@link KRendering} to be evaluated
 * @param apd
 *            the {@link KAreaPlacementData} to be applied
 * @param givenBounds
 *            the size that is currently assigned to <code>rendering</code>'s container.
 *
 * @return the minimal required size
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
 * Returns the bounds for a direct placement data in given parent bounds.
 * @param dpd
 *          the direct placement data
 * @param parentBounds
 *          the parent bounds
 * @returns
 */
export function evaluateAreaPlacement(dpd: KAreaPlacementData, parentBounds: Bounds): Bounds {
    // TODO: Test this method
    console.warn('METHOD IS BEING USED: ' + 'evaluateAreaPlacement')

    if (!dpd) return parentBounds
    // Determine the top-left
    const topLeftPoint = dpd.topLeft ? evaluateKPosition(dpd.topLeft, parentBounds, true) : { x: 0, y: 0 }
    // Determine the bottom-right
    const bottomRightPoint = dpd.bottomRight
        ? evaluateKPosition(dpd.bottomRight, parentBounds, false)
        : { x: parentBounds.width, y: parentBounds.height }
    return {
        x: topLeftPoint.x,
        y: topLeftPoint.y,
        width: bottomRightPoint.x - topLeftPoint.y,
        height: bottomRightPoint.y - topLeftPoint.y,
    }
}

export function evaluatePointPlacementRendering(rendering: KRendering, ppd: KPointPlacementData, parentBounds: Bounds) {
    return evaluatePointPlacement(ppd, basicEstimateSize(rendering, Bounds.EMPTY), parentBounds)
}

function evaluatePointPlacement(ppd: KPointPlacementData, ownBounds: Bounds, parentBounds: Bounds): Bounds {
    // TODO: Test this method
    // TODO: Comment this method
    console.warn('METHOD IS BEING USED: ' + 'evaluatePointPlacement')
    if (!ppd) return { x: 0, y: 0, width: parentBounds.width, height: parentBounds.height }

    const width = Math.max(ownBounds.width, ppd.minWidth)
    const height = Math.max(ownBounds.height, ppd.minHeight)

    const ref = ppd.referencePoint
    const refPoint = ref ? evaluateKPosition(ref, parentBounds, true) : Point.ORIGIN

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
        case VerticalAlignment.CENTER:
            y0 -= height / 2
            break
        case VerticalAlignment.BOTTOM:
            y0 -= height
            break
        default:
        case VerticalAlignment.TOP:
            break
    }

    return { x: x0, y: y0, width: width, height: height }
}

/**
 * Inversely applies the given "passe-partout" determined by <code>topLeft</code> and
 * <code>bottomRight</code> in order to calculate the outer bounds based on the given
 * <code>innerBounds</code>. Method is used in the area placement and grid placement handling.
 *
 * @param innerBounds
 *            the inner bounds to inversely apply the "passe-partout" on
 * @param topLeft
 *            the top left {@link KPosition}
 * @param bottomRight
 *            the bottom right {@link KPosition}
 * @return the respective outer bounds
 */
export function inverselyApplyBoundingBoxKPositions(
    innerBounds: Bounds,
    topLeft: KPosition,
    bottomRight: KPosition
): Bounds {
    // TODO: Test this method
    console.warn('METHOD IS BEING USED: ' + 'inverselyApplyBoundingBoxKPositions')

    return inverselyApplySizeData(
        innerBounds,
        getHorizontalSize(topLeft, bottomRight),
        getVerticalSize(topLeft, bottomRight)
    )
}

function inverselyApplySizeData(bounds: Bounds, horSize: [number, number], vertSize: [number, number]): Bounds {
    // TODO: Test this method
    console.warn('METHOD IS BEING USED: ' + 'inverselyApplySizeData')

    const absXOffset = horSize[0]
    const relWidth = horSize[1]

    const absYOffset = vertSize[0]
    const relHeight = vertSize[1]

    const width = relWidth ? (bounds.width + absXOffset) / relWidth : absXOffset
    const height = relHeight ? (bounds.height + absYOffset) / relHeight : absYOffset

    return { x: bounds.x, y: bounds.y, width: width, height: height }
}

/**
 * whether a position is measured in the same direction as the point it is defining e.g. a top
 * left position is measured from left
 */
const PRIMARY = 0
/**
 * whether a position is measured contrary to the point it is defining e.g. a top right position
 * is measured from left
 */
const SECONDARY = 1
/**
 * offset to be used to calculate below defined constants to determine how positions interact
 * first positions are left or top.
 */
const FIRST_OFFSET = 100

/** both positions are measured direct. */
const PRIMARY_PRIMARY = PRIMARY * FIRST_OFFSET + PRIMARY
/** first position is measured directly, second position is measured indirectly. */
const PRIMARY_SECONDARY = PRIMARY * FIRST_OFFSET + SECONDARY
/** first position is measured indirectly, second position is measured directly. */
const SECONDARY_PRIMARY = SECONDARY * FIRST_OFFSET + PRIMARY
/** both positions are measured indirectly. */
const SECONDARY_SECONDARY = SECONDARY * FIRST_OFFSET + SECONDARY

function getHorizontalSize(tL: KPosition, bR: KPosition): [number, number] {
    // TODO: Test this method
    console.warn('METHOD IS BEING USED: ' + 'getHorizontalSize')

    let abs0, abs1, rel0, rel1: number
    let posId0, posId1: number

    if (!tL) {
        abs0 = 0.0
        rel0 = 0.0
        posId0 = PRIMARY
    } else {
        const lPos = toNonNullLeftPosition(tL.x)
        abs0 = lPos.absolute
        rel0 = lPos.relative
        posId0 = lPos.type === K_LEFT_POSITION ? PRIMARY : SECONDARY
    }

    if (!bR) {
        abs1 = 0.0
        rel1 = 0.0
        posId1 = PRIMARY
    } else {
        const rPos = toNonNullRightPosition(bR.x)
        abs1 = rPos.absolute
        rel1 = rPos.relative
        posId1 = rPos.type === K_RIGHT_POSITION ? PRIMARY : SECONDARY
    }

    return getSize(abs0, rel0, posId0, abs1, rel1, posId1)
}

function getVerticalSize(tL: KPosition, bR: KPosition): [number, number] {
    // TODO: Test this method
    console.warn('METHOD IS BEING USED: ' + 'getVerticalSize')

    let abs0, abs1, rel0, rel1: number
    let posId0, posId1: number

    if (!tL) {
        abs0 = 0.0
        rel0 = 0.0
        posId0 = PRIMARY
    } else {
        const lPos = toNonNullTopPosition(tL.x)
        abs0 = lPos.absolute
        rel0 = lPos.relative
        posId0 = lPos.type === K_TOP_POSITION ? PRIMARY : SECONDARY
    }

    if (!bR) {
        abs1 = 0.0
        rel1 = 0.0
        posId1 = PRIMARY
    } else {
        const rPos = toNonNullBottomPosition(bR.x)
        abs1 = rPos.absolute
        rel1 = rPos.relative
        posId1 = rPos.type === K_BOTTOM_POSITION ? PRIMARY : SECONDARY
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
    // TODO: Test this method
    console.warn('METHOD IS BEING USED: ' + 'getSize')

    let absOffset, relWidth: number
    const position = posId0 * FIRST_OFFSET + posId1

    switch (position) {
        case PRIMARY_PRIMARY:
            // top left comes from left
            // bottom right comes from right
            relWidth = 1 - (rel1 + rel0)
            absOffset = abs0 + abs1
            break
        case PRIMARY_SECONDARY:
            // top left comes from left
            // bottom right comes from left
            relWidth = rel1 - rel0
            if (relWidth === 0) absOffset = abs1
            else absOffset = abs0 - abs1
            break
        case SECONDARY_PRIMARY:
            // top left comes from right
            // bottom right comes from right
            relWidth = rel0 - rel1
            if (relWidth === 0) absOffset = abs0
            else absOffset = -abs0 + abs1
            break
        case SECONDARY_SECONDARY:
            // top left comes from right
            // bottom right comes from left
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
 * Returns the required minimal size of a {@link KRendering} width attached
 * {@link KPointPlacementData}.
 *
 * @param rendering
 *            the {@link KRendering} to be evaluated
 * @param ppd the {@link KPointPlacementData} to be applied
 *
 * @return the minimal required size
 */
export function estimatePointPlacedChildSize(rendering: KRendering, pointPlacementData: KPointPlacementData): Bounds {
    const minSize = { x: 0, y: 0, width: pointPlacementData.minWidth, height: pointPlacementData.minHeight }
    const childSize = boundsMax(minSize, basicEstimateSize(rendering, minSize))
    return {
        x: 0,
        y: 0,
        width: getHorizontalSizeFromPointPlacementData(pointPlacementData, childSize.width),
        height: getVerticalSizeFromPointPlacementData(pointPlacementData, childSize.height),
    }
}

/**
 * Determines the horizontal size value for a point-based placed child.
 *
 * @param ppd
 *            the {@link KPointPlacementData} containing the required declarations
 * @param minWidth
 *            the estimated minimal width of the child
 * @return a {@link Number} of the horizontal size value for a point-based placed child
 */
function getHorizontalSizeFromPointPlacementData(ppd: KPointPlacementData, minWidth: number): number {
    // TODO: Test this method
    console.warn('METHOD IS BEING USED: ' + 'getHorizontalSizeFromPointPlacementData')

    if (!ppd) return minWidth

    const pos = ppd.referencePoint
    const abs = pos && pos.x ? pos.x.absolute : 0
    let calculatedWidth = 0

    switch (ppd.horizontalAlignment) {
        case HorizontalAlignment.LEFT:
        case HorizontalAlignment.RIGHT:
            // the child requires its minWidth and the absolute margin defined by pos.getX()
            calculatedWidth = abs + minWidth + ppd.horizontalMargin
            break
        case HorizontalAlignment.CENTER:
            const halfWidth = minWidth / 2
            // in this case the child requires, depending on type of pos.getX, on one side more
            // space than on the other, so:
            if (abs > halfWidth) calculatedWidth = abs + halfWidth + ppd.horizontalAlignment
            // in case one might argue the same way, but there's still the relative part
            // so I think potentially shrinking the width is not reasonable; thus:
            else calculatedWidth = minWidth + 2 * ppd.horizontalAlignment
            break
    }

    return calculatedWidth
}

/**
 * Determines the vertical size value for a point-based placed child.
 *
 * @param ppd
 *            the {@link KPointPlacementData} containing the required declarations
 * @param minHeight
 *            the estimated minimal height of the child
 * @return a {@link Number} of the vertical size value for a point-based placed child
 */
function getVerticalSizeFromPointPlacementData(ppd: KPointPlacementData, minHeight: number): number {
    // TODO: Test this method
    console.warn('METHOD IS BEING USED: ' + 'getVerticalSizeFromPointPlacementData')

    if (!ppd) return minHeight

    const pos = ppd.referencePoint
    const abs = pos && pos.y ? pos.y.absolute : 0
    let calculatedHeight = 0

    switch (ppd.verticalAlignment) {
        case VerticalAlignment.TOP:
        case VerticalAlignment.BOTTOM:
            // the child requires its minHeight and the absolute margin defined by pos.getY()
            calculatedHeight = abs + minHeight + ppd.verticalMargin
            break
        case VerticalAlignment.CENTER:
            const halfHeight = minHeight / 2
            // in this case the child requires, depending on type of pos.getY, on one side more
            // space than on the other, so:
            if (abs > halfHeight) calculatedHeight = abs + halfHeight + ppd.verticalMargin
            // in case one might argue the same way, but there's still the relative part
            // so I think potentially shrinking the width is not reasonable; thus:
            else calculatedHeight = minHeight + 2 * ppd.verticalMargin
            break
    }

    return calculatedHeight
}

/**
 * Returns the bounds for a polyline based on given bounds.
 *
 * @param line
 *            the polyline with its points
 * @param givenBounds
 *            the given bounds
 * @return the actual polyline's bounding box' bounds
 */
function evaluatePolylineBounds(line: KPolyline, givenBounds: Bounds): Bounds {
    if (!line.points || line.points.length === 0) {
        return givenBounds
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
    return boundsMax({ x: 0, y: 0, width: maxX, height: maxY }, givenBounds)
}

/**
 * Evaluates a position inside given parent bounds.
 *
 * @param position
 *            the position
 * @param parentBounds
 *            the parent bounds
 * @param topLeft
 *            in case position equals <code>null</code> assume a topLeft {@link KPosition},
 *            and a bottomRight {@link KPosition} otherwise
 * @return the evaluated position
 */
export function evaluateKPosition(position: KPosition, parentBounds: Bounds, topLeft: boolean): Point {
    // TODO: Test this method
    console.warn('METHOD IS BEING USED: ' + 'evaluateKPosition')

    const width = parentBounds.width
    const height = parentBounds.height

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
