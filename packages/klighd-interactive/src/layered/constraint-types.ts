/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019, 2020 by
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

import { Direction } from '../constraint-classes'

/**
 * A layer visualization data class for the interactive layered approach.
 */
export class Layer {
    begin: number

    end: number

    mid: number

    /**
     * Where up is, is determined by the direction
     */
    topBorder: number

    /**
     * Where low is, is determined by the direction
     */
    bottomBorder: number

    /**
     * 0: UNDEFINED, 1: RIGHT, 2: LEFT, 3: DOWN, 4: UP
     */
    direction: Direction

    constructor(leftX: number, rightX: number, mid: number, direction: Direction) {
        this.begin = leftX
        this.end = rightX
        this.mid = mid
        this.direction = direction
    }
}

/**
 * Data class for a deletion constraint.
 */
export class DeleteConstraint {
    id: string
}

/**
 * Data class for a layer constraint.
 */
export class LayerConstraint {
    id: string

    layer: number

    layerCons: number
}

/**
 * Data class for a position constraint.
 */
export class PositionConstraint {
    id: string

    position: number

    posCons: number
}

/**
 * Data class for a position and layer constraint.
 */
export class StaticConstraint {
    id: string

    layer: number

    position: number

    posCons: number

    layerCons: number
}
