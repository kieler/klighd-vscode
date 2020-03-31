/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

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
    direction: number

    constructor(leftX: number, rightX: number, mid: number, direction: number) {
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