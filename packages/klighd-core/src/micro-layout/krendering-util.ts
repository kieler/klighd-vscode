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

import { KPosition, KXPosition } from '../skgraph-models'

// BASED ON https://github.com/kieler/KLighD/blob/master/plugins/de.cau.cs.kieler.klighd.krendering/src-custom/de/cau/cs/kieler/klighd/krendering/KRenderingUtil.java

//const FACTORY = KRenderingFactory.eINSTANCE

const LEFT_TOP_POS = createLeftTopKPosition()
const RIGHT_BOTTOM_POS = createRightBottomKPosition()

export function toNonNullLeftPosition(position: KXPosition): KXPosition {
    return position ? position : LEFT_TOP_POS.x
}

export function toNonNullRightPosition(position: KXPosition): KXPosition {
    return position ? position : RIGHT_BOTTOM_POS.x
}

function createLeftTopKPosition(): KPosition {
    // TODO: Complete this
    /*
    return setPositions(
        FACTORY.createKPosition(),
        FACTORY.createKLeftPosition(),
        FACTORY.createKTopPosition(),
    )
    */

    // Remove the following
    let x, y: KXPosition
    x = {
        type: '',
        absolute: 0,
        relative: 0,
    }
    y = {
        type: '',
        absolute: 0,
        relative: 0,
    }

    return { x: x, y: y }
}

function createRightBottomKPosition(): KPosition {
    // TODO: Complete this
    /*
    return setPositions(
        FACTORY.createKPosition(),
        FACTORY.createKRightPosition(),
        FACTORY.createKBottomPosition(),
    )
    */

    // Remove the following
    let x, y: KXPosition
    x = {
        type: '',
        absolute: 0,
        relative: 0,
    }
    y = {
        type: '',
        absolute: 0,
        relative: 0,
    }

    return { x: x, y: y }
}
