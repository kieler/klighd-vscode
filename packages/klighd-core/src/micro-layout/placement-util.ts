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
import {
    isAreaPlacementData,
    isChildArea,
    isContainerRendering,
    isGridPlacementData,
    isImage,
    isKText,
    isPointPlacementData,
    isRenderingRef,
    KContainerRendering,
    KRendering,
    KText,
} from '../skgraph-models'
import { boundsMax, emptyBounds } from './bounds-util'

/**
 * TODO
 * @param rendering 
 * @param givenBounds 
 */
export function estimateSize(rendering: KRendering, givenBounds: Bounds): Bounds {
    let bounds = emptyBounds()
    const { placementData } = rendering

    if (isAreaPlacementData(placementData) || isGridPlacementData(placementData)) {
        // TODO bounds = estimateAreaPlacedChildSize(placementData as KAreaPlacementData, givenBounds)
        bounds = givenBounds
    } else if (isPointPlacementData(placementData)) {
        // TODO bounds = estimatePointPlacedChildSize(rendering, placementData as KPointPlacementData)
        bounds = givenBounds
    }

    // default:
    bounds = basicEstimateSize(rendering, givenBounds)

    // TODO: handle KImages
    if (isImage(rendering)) {
        // TODO: bounds = estimateImageSize(rendering, givenBounds)
    }

    return bounds
}

/**
 * TODO
 * @param rendering 
 * @param givenBounds 
 * @returns 
 */
export function basicEstimateSize(rendering: KRendering, givenBounds: Bounds): Bounds {
    // TODO: get id? KTEXT, KCHILD_AREA, KRENDERING_REF, KCONTAINER_RENDERING, KGRID_PLACEMENT

    // TODO: switch over id, lets assume KTEXT only for now
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
        // TODO: placement handling, only default case for now
        // const placement = ...
        // if (isGridPlacement(placement)) { 
        //         console.log('grid placement not implemented')
        //         return givenBounds
        // }
        let maxSize: Bounds = givenBounds
        for (const childRendering of (rendering as KContainerRendering).children) {
            const childSize: Bounds = estimateSize(childRendering, givenBounds)
            maxSize = boundsMax(givenBounds, childSize)
        }
        // TODO: handling if container is a polyline
        return maxSize
    }
    return givenBounds
}

/**
 * TODO
 * @param kText 
 */
export function estimateKTextSize(kText: KText): Bounds {
    if (kText.text === undefined) {
        // TODO: lots of special cases
        return emptyBounds()
    }
    return estimateTextSize(kText, kText.text)
}

export function estimateTextSize(kText: KText, text: string): Bounds {
    // TODO: actually figure out how to estimate the text size accurately

    // TODO: persist CALCULATED_TEXT_BOUNDS, CALCULATED_TEXT_LINE_WIDTHS, CALCULATED_TEXT_LINE_HEIGHTS in properties

    // dummy data
    return { x: 0, y: 0, width: 40, height: 30 }
}
