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

import { moveFeature, Point, RectangularNode, SEdge, selectFeature, SParentElement } from 'sprotty/lib';

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
}

/**
 * Represents its java counterpart in KLighD.
 */
export class KNode extends RectangularNode implements KGraphElement {
    trace?: string
    data: KGraphData[]
    areChildAreaChildrenRendered = false
    areNonChildAreaChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature || (feature === moveFeature && (this.parent as KNode).properties.interactiveLayout)
    }

    properties: NodeProperties

    direction: Direction

    shadow: boolean
    shadowX: number
    shadowY: number
}

export enum Direction {
    UNDEFINED,
    RIGHT,
    LEFT,
    DOWN,
    UP
}

/**
 * Properties needed for client side layout or visualization.
 * Send together with the nodes from server to client.
 * They correspond to properties on the server.
 */
export class NodeProperties {
    algorithm: string
    aspectRatio: number
    currentPosition: number
    desiredPosition: number
    interactiveLayout: boolean
    layerConstraint: number
    layerId: number
    positionConstraint: number
    positionId: number
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
    areChildAreaChildrenRendered = false
    areNonChildAreaChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature
    }

    moved: boolean
}