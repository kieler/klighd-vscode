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
    isAreaPlacementData,
    isChildArea,
    isContainerRendering,
    isGridPlacement,
    isGridPlacementData,
    isImage,
    isKText,
    isPointPlacementData,
    isPolyline,
    isRenderingRef,
    KAreaPlacementData,
    KContainerRendering,
    KImage,
    KPointPlacementData,
    KPolyline,
    KPosition,
    KRendering,
    KText,
} from '../skgraph-models'
import { boundsMax, emptyBounds } from './bounds-util'

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
    let bounds = emptyBounds()
    const { placementData } = rendering

    if (isAreaPlacementData(placementData) || isGridPlacementData(placementData)) {
        bounds = estimateAreaPlacedChildSize(rendering, placementData as KAreaPlacementData, givenBounds)
    } else if (isPointPlacementData(placementData)) {
        bounds = estimatePointPlacedChildSize(rendering, placementData as KPointPlacementData)
        bounds = givenBounds
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
function basicEstimateSize(rendering: KRendering, givenBounds: Bounds): Bounds {
    if (isKText(rendering)) {
        return estimateKTextSize(rendering as KText)
    }
    if (isChildArea(rendering)) {
        return emptyBounds()
    }
    if (isRenderingRef(rendering)) {
        // TODO: get referenced rendering and do
        // return basicEstimateSize(retrievedRendering, givenBounds)
        console.log('rendering refs not implemented')
        return givenBounds
    }
    if (isContainerRendering(rendering)) {
        const placement = (rendering as KContainerRendering).childPlacement
        if (isGridPlacement(placement)) {
            // TODO
            console.log('grid placement not implemented')
            return givenBounds
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

/**
 * Returns the minimal bounds for a KText.
 *
 * @param kText
 *            the KText containing the text string whose size is to be estimated.
 * @return the minimal bounds for the {@link KText}
 */
function estimateKTextSize(kText: KText): Bounds {
    if (kText.text === undefined) {
        if (kText.properties['klighd.labels.textOverride'] !== undefined) {
            return estimateTextSize(kText, kText.properties['klighd.labels.textOverride'] as string)
        }

        // TODO: Try to find the KText's parent label
        // at the moment we have no easy access to parent's of KRenderings on the client

        return estimateTextSize(kText, '')
    }
    return estimateTextSize(kText, kText.text)
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

    // TODO: persist CALCULATED_TEXT_BOUNDS, CALCULATED_TEXT_LINE_WIDTHS, CALCULATED_TEXT_LINE_HEIGHTS in properties

    // FIXME: dummy data
    return { x: 0, y: 0, width: 40, height: 30 }
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
function estimateImageSize(image: KImage, givenBounds: Bounds) {
    // TODO: implement image handling
    return givenBounds
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
function inverselyApplyBoundingBoxKPositions(innerBounds: Bounds, topLeft: KPosition, bottomRight: KPosition): Bounds {
    // TODO: implement these required functions, this seems to be done strangely on the server
    // return inverselyApplySizeData(
    //     innerBounds,
    //     getHorizontalSize(topLeft, bottomRight),
    //     getVerticalSize(topLeft, bottomRight)
    // )
    return emptyBounds()
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
    // TODO: implement these functions
    // return {
    //     x: 0,
    //     y: 0,
    //     width: getHorizontalSizeFromPointPlacementData(pointPlacementData, childSize.width),
    //     height: getVerticalSizeFromPointPlacementData(pointPlacementData, childSize.height),
    // }
    return emptyBounds()
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
    if (line.points.length === 0) {
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
    // TODO: implement missing functions
    // const width = parentBounds.width
    // const height = parentBounds.height
    // const point = { x: 0, y: 0 }
    // const xPos = topLeft ? toNonNullLeftPosition(position.x) : toNonNullRightPosition(position.x)
    // const yPos = topLeft ? toNonNullTopPosition(position.y) : toNonNullBottomPosition(position.y)
    // // TODO: the Java implementation here relies on interfaces to differentiate different types of positions,
    // // we cannot do the same here so need to figure out a different solution
    // // currently the client just treats left and right positions the same

    // if (isLeftPosition(xPos)) {
    //     point.x = xPos.relative * width + xPos.getAbsolute()
    // } else {
    //     point.x = width - xPos.getRelative() * width - xPos.getAbsolute()
    // }

    // if (yPos instanceof KTopPosition) {
    //     point.y = yPos.getRelative() * height + yPos.getAbsolute()
    // } else {
    //     point.y = height - yPos.getRelative() * height - yPos.getAbsolute()
    // }
    // return point
    return { x: position.x.relative, y: position.y.relative }
}
