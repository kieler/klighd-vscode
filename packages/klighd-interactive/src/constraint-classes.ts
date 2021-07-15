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

import { Bounds, moveFeature, Point, RectangularNode, SEdge, selectFeature, SParentElement } from 'sprotty/lib';

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


    /** 
     * The Region if any that contains this KNode 
     * If this is undefined it has yet to be created/checked
     * If this is null the Region is a Region root
     */
    containingRegion?: Region | null

    /** The Region if any that is constructed by the KNode 
     *  If this is undefined it has yet to be created/checked
     *  If this is null this KNode does not construct a region
     */
    providingRegion?: Region | null
}

export enum Direction {
    UNDEFINED,
    RIGHT,
    LEFT,
    DOWN,
    UP
}

/**
 * The possible detail level of a KNode as determined by the DepthMap
 */
export enum DetailLevel {
    FullDetails = 2,
    MinimalDetails = 1,
    OutOfBounds = 0
}

/**
 * Something we can get a DetailLevel from
 */
export interface DetailReference {
    detailLevel: DetailLevel
}

/**
 * Combines KNodes into regions. These correspond to child areas. A region can correspond to 
 * a region or a super state in the model. Also manages the boundaries, title candidates, 
 * tree structure of the model and application of detail level of its KNodes.
 */
export class Region {
    /** All KNodes specifically in the region. */
    elements: KNode[]
    /** The rectangle of the child area in which the region lies. */
    boundingRectangle: KNode
    /** Gained using browser position and rescaling and are therefore not perfect. */
    absoluteBounds: Bounds
    /** the regions current detail level that is used by all children */
    detail: DetailLevel
    /** The immediate parent region of this region. */
    parent?: Region
    /** All immediate child regions of this region */
    children: Region[]
    /** Contains the height of the title of the region, if there is one. */
    regionTitleHeight?: number

    /** Constructor initializes element array for region. */
    constructor(boundingRectangle: KNode) {
        this.boundingRectangle = boundingRectangle
        this.elements = []
        this.children = []
        this.detail = DetailLevel.FullDetails
        boundingRectangle.providingRegion = this
    }

    /** 
     * Applies the detail level to all elements of a region.
     * @param level the detail leveel to apply
     */
    setDetailLevel(level: DetailLevel): void {
        this.detail = level
    }
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