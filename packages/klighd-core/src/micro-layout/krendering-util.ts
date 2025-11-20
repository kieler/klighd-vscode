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
    K_BOTTOM_POSITION,
    K_LEFT_POSITION,
    K_RIGHT_POSITION,
    K_TOP_POSITION,
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
