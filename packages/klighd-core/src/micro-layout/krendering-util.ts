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
    isAreaPlacementData,
    isDecoratorPlacementData,
    isGridPlacement,
    isGridPlacementData,
    isPointPlacementData,
    isRenderingRef,
    K_BOTTOM_POSITION,
    K_LEFT_POSITION,
    K_RIGHT_POSITION,
    K_TOP_POSITION,
    KAreaPlacementData,
    KDecoratorPlacementData,
    KGridPlacement,
    KGridPlacementData,
    KPlacement,
    KPlacementData,
    KPointPlacementData,
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

/**
 * Returns the given position or a default left position if null/undefined.
 *
 * @param position the position to check
 * @return the position or default left position
 */
export function toNonNullLeftPosition(position?: KXPosition | null): KXPosition {
    return position || LEFT_TOP_POS.x
}

/**
 * Returns the given position or a default right position if null/undefined.
 *
 * @param position the position to check
 * @return the position or default right position
 */
export function toNonNullRightPosition(position?: KXPosition | null): KXPosition {
    return position || RIGHT_BOTTOM_POS.x
}

/**
 * Returns the given position or a default top position if null/undefined.
 *
 * @param position the position to check
 * @return the position or default top position
 */
export function toNonNullTopPosition(position?: KXPosition | null): KXPosition {
    return position || LEFT_TOP_POS.y
}

/**
 * Returns the given position or a default bottom position if null/undefined.
 *
 * @param position the position to check
 * @return the position or default bottom position
 */
export function toNonNullBottomPosition(position?: KXPosition | null): KXPosition {
    return position || RIGHT_BOTTOM_POS.y
}

/**
 * Reveals the placement data of a rendering, following rendering references if necessary.
 *
 * @param rendering the rendering to examine
 * @return the placement data or null if none found
 */
export function getPlacementData(rendering: KRendering): KPlacementData | null {
    const { placementData } = rendering
    if (placementData) {
        return placementData
    }
    if (isRenderingRef(rendering)) {
        const ref = rendering as KRenderingRef
        return ref.rendering ? getPlacementData(ref.rendering) : null
    }
    return null
}

/**
 * Returns the given placement data as grid placement data if it is of the correct type.
 *
 * @param data the placement data to cast
 * @return the grid placement data or null
 */
export function asGridPlacementData(data: KPlacementData | null | undefined): KGridPlacementData | null {
    if (data && isGridPlacementData(data)) {
        return data as KGridPlacementData
    }
    return null
}

/**
 * Returns the given placement as grid placement if it is of the correct type.
 *
 * @param placement the placement to cast
 * @return the grid placement or null
 */
export function asGridPlacement(placement: KPlacement | null | undefined): KGridPlacement | null {
    if (placement && isGridPlacement(placement)) {
        return placement as KGridPlacement
    }
    return null
}

/**
 * Returns the given placement data as area placement data if it is of the correct type.
 *
 * @param data the placement data to cast
 * @return the area placement data or null
 */
export function asAreaPlacementData(data: KPlacementData | null | undefined): KAreaPlacementData | null {
    if (data && isAreaPlacementData(data)) {
        return data as KAreaPlacementData
    }
    return null
}

/**
 * Returns the given placement data as point placement data if it is of the correct type.
 *
 * @param data the placement data to cast
 * @return the point placement data or null
 */
export function asPointPlacementData(data: KPlacementData | null | undefined): KPointPlacementData | null {
    if (data && isPointPlacementData(data)) {
        return data as KPointPlacementData
    }
    return null
}

/**
 * Returns the given placement data as decorator placement data if it is of the correct type.
 *
 * @param data the placement data to cast
 * @return the decorator placement data or null
 */
export function asDecoratorPlacementData(data: KPlacementData | null | undefined): KDecoratorPlacementData | null {
    if (data && isDecoratorPlacementData(data)) {
        return data as KDecoratorPlacementData
    }
    return null
}
