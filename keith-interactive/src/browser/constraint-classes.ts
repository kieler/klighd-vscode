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

import { RectangularNode, selectFeature, moveFeature, SParentElement, SEdge, Point } from 'sprotty/lib';

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
 * This is the superclass of all elements of a graph such as nodes, edges, ports,
 * and labels. A graph element may contain an arbitrary number of additional
 * data instances.
 * Represents its java counterpart in KLighD.
 */
export interface KGraphElement extends SParentElement {
    /**
     * May contain a trace that points back to the server instance where this element was created.
     */
    trace?: string
    data: KGraphData[]
    /**
     * Additional field to remember, if this element's children have already been rendered.
     */
    areChildrenRendered: boolean
}

/**
 * Represents its java counterpart in KLighD.
 */
export class KNode extends RectangularNode implements KGraphElement {
    trace?: string
    data: KGraphData[]
    areChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature || (feature === moveFeature && (this.parent as KNode).properties.interactiveLayout)
    }

    properties: NodeProperties

    direction: number

    shadow: boolean
    shadowX: number
    shadowY: number

    hierWidth: number
    hierHeight: number
}

export class NodeProperties {
    algorithm: string
    interactiveLayout: boolean
    layerConstraint: number
    layerId: number
    positionConstraint: number
    positionId: number
    desiredPosition: number
    currentPosition: number
}

/**
 * This class can be extended to hold arbitrary additional data for
 * graph elements, such as layout or rendering information.
 * Represents its java counterpart in KLighD.
 */
export interface KGraphData {
    type: string
}

/**
 * Represents its java counterpart in KLighD.
 */
export class KEdge extends SEdge implements KGraphElement {
    trace?: string
    data: KGraphData[]
    junctionPoints: Point[]
    areChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature
    }

    moved: boolean
}