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

import {
    isGridPlacement,
    isGridPlacementData,
    isRenderingRef,
    K_BOTTOM_POSITION,
    K_LEFT_POSITION,
    K_RIGHT_POSITION,
    K_TOP_POSITION,
    KGridPlacement,
    KGridPlacementData,
    KPlacement,
    KPlacementData,
    KRendering,
    KRenderingRef,
    KXPosition,
} from '../skgraph-models'

// BASED ON https://github.com/kieler/KLighD/blob/master/plugins/de.cau.cs.kieler.klighd.krendering/src-custom/de/cau/cs/kieler/klighd/krendering/KRenderingUtil.java

const LEFT_TOP_POS = {
    x: {
        type: K_LEFT_POSITION,
        absolute: 0,
        relative: 0,
    },
    y: {
        type: K_TOP_POSITION,
        absolute: 0,
        relative: 0,
    },
}
const RIGHT_BOTTOM_POS = {
    x: {
        type: K_RIGHT_POSITION,
        absolute: 0,
        relative: 0,
    },
    y: {
        type: K_BOTTOM_POSITION,
        absolute: 0,
        relative: 0,
    },
}

export function toNonNullLeftPosition(position: KXPosition): KXPosition {
    return position ? position : LEFT_TOP_POS.x
}

export function toNonNullRightPosition(position: KXPosition): KXPosition {
    return position ? position : RIGHT_BOTTOM_POS.x
}

export function toNonNullTopPosition(position: KXPosition): KXPosition {
    return position ? position : LEFT_TOP_POS.y
}

export function toNonNullBottomPosition(position: KXPosition): KXPosition {
    return position ? position : RIGHT_BOTTOM_POS.y
}

export function getPlacementData(rendering: KRendering): KPlacementData | null {
    // TODO: Test this method
    // TODO: Comment this method
    console.warn('METHOD IS BEING USED: ' + 'getPlacementData')

    let placementData = rendering.placementData
    if (placementData) return placementData
    else if (isRenderingRef(rendering)) {
        const ref = rendering as KRenderingRef
        if (!ref.rendering) return null
        else return getPlacementData(ref.rendering)
    } else return null
}

export function asGridPlacementData(data: KPlacementData | null): KGridPlacementData | null {
    // TODO: Test this method
    // TODO: Comment this method
    console.warn('METHOD IS BEING USED: ' + 'asGridPlacementData')
    if (data && isGridPlacementData(data)) return data as KGridPlacementData
    else return null
}

export function asGridPlacement(placement: KPlacement): KGridPlacement | null {
    if (placement && isGridPlacement(placement)) return placement as KGridPlacement
    else return null
}
