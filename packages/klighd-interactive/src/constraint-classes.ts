/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2023 by
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

import { moveFeature, RectangularNode, SEdgeImpl, selectFeature, SParentElementImpl } from 'sprotty'
import { Point } from 'sprotty-protocol'

/**
 * This is the superclass of all elements of a graph such as nodes, edges, ports,
 * and labels. A graph element may contain an arbitrary number of additional
 * data instances.
 * Represents its java counterpart in KLighD.
 */
export interface SKGraphElement extends SParentElementImpl {
    /**
     * May contain a trace that points back to the server instance where this element was created.
     */
    trace?: string
    data: KGraphData[]
    /**
     * Remembers, if this element's children that are placed within a potential child area have already been rendered.
     * Accounts for child nodes and edges.
     */
    areChildAreaChildrenRendered: boolean
    /**
     * Remembers, if this element's children that are not placed within a potential child area have already been rendered.
     * Accounts for child ports and labels.
     */
    areNonChildAreaChildrenRendered: boolean
    opacity: number

    /**
     * The properties of this element.
     */
    properties: Record<string, unknown>
}

/**
 * Represents its java counterpart in KLighD.
 */
export class KNode extends RectangularNode implements SKGraphElement {
    trace?: string

    data: KGraphData[]

    areChildAreaChildrenRendered = false

    areNonChildAreaChildrenRendered = false

    hasFeature(feature: symbol): boolean {
        return (
            feature === selectFeature ||
            (feature === moveFeature &&
                ((this.parent as KNode).properties['org.eclipse.elk.interactiveLayout'] as boolean))
        )
    }

    properties: Record<string, unknown>

    direction: Direction

    shadow: boolean

    shadowX: number

    shadowY: number
    highlight: boolean
    forbidden: boolean
}

export enum Direction {
    UNDEFINED,
    RIGHT,
    LEFT,
    DOWN,
    UP,
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
export class KEdge extends SEdgeImpl implements SKGraphElement {
    trace?: string

    data: KGraphData[]

    junctionPoints: Point[]

    areChildAreaChildrenRendered = false

    areNonChildAreaChildrenRendered = false

    hasFeature(feature: symbol): boolean {
        return feature === selectFeature
    }

    properties: Record<string, unknown>

    moved: boolean
}

export class RelativeConstraintData {
    constructor(public readonly relCons: RelativeConstraintType,
        public readonly node: KNode,
        public readonly target: KNode) {}
}

export enum RelativeConstraintType {
    IN_LAYER_SUCCESSOR_OF,
    IN_LAYER_PREDECESSOR_OF,
    UNDEFINED
}
