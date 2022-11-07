/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 - 2022 by
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

import { SModelElement } from 'sprotty';
import { Action } from 'sprotty-protocol';
import { RefreshLayoutAction } from '../actions';
import { Direction, KEdge, KNode } from '../constraint-classes';
import { filterKNodes } from '../helper-methods';
import { SetLayerConstraintAction, SetPositionConstraintAction, SetStaticConstraintAction } from './actions';
import { Layer } from './constraint-types';
import { getChain } from './relative-constraint-utils';

/**
 * Offset for placement on below or above the first/last node in the layer.
 */
export const PLACEMENT_TOP_BOTTOM_OFFSET = 20;

/**
 * Layer padding for one layer case.
 */
export const ONE_LAYER_PADDING = 10;

/**
 * Vertical x offset of the constraint arrow icon.
 */
export const VERTICAL_ARROW_X_OFFSET = -2.5

/**
 * Vertical y offset of the constraint arrow icon.
 */
export const VERTICAL_ARROW_Y_OFFSET = -5

/**
 * Horizontal x offset of the constraint arrow icon.
 */
export const HORIZONTAL_ARROW_X_OFFSET = -0.3

/**
 * Horizontal y offset of the constraint arrow icon.
 */
export const HORIZONTAL_ARROW_Y_OFFSET = -0.7

/**
 * Calculates the layer the node is in.
 * 
 * @param node Node which layer should be calculated.
 * @param nodes All nodes in the same hierarchical level as the node which layer should be calculated.
 * @param layers All layers at the hierarchical level.
 * @returns The layer the node, -1 if a node would be in a new first layer.
 */
export function getLayerOfNode(node: KNode, nodes: KNode[], layers: Layer[], direction: Direction): number {
    const coordinateInLayoutDirection = (direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.LEFT)
        ? node.position.x + node.size.width / 2 : node.position.y + node.size.height / 2

    // Check for all layers if the node is in the layer
    for (const layer of layers) {
        if (coordinateInLayoutDirection < layer.end && coordinateInLayoutDirection > layer.begin &&
            (direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.DOWN) ||
            coordinateInLayoutDirection > layer.end && coordinateInLayoutDirection < layer.begin && (direction === Direction.LEFT || direction === Direction.UP)) {
            return layer.id
        }
    }
            
    const firstLayerBegin = layers[0].begin
    const lastLayerEnd = layers[layers.length - 1].end
    // If the node is the only one in the last layer it can not be in a new last layer
    const lastLNodes = getNodesOfLayer(layers[layers.length - 1].id, nodes)
    if (lastLNodes.length === 1 && lastLNodes[0].selected &&
        (((direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.DOWN) && coordinateInLayoutDirection > lastLayerEnd)
            || (( direction === Direction.LEFT || direction === Direction.UP) && coordinateInLayoutDirection < lastLayerEnd))) {
        // node is in last layer
        return layers[layers.length - 1].id
    }

    // Node is in a new last layer
    if (((direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.DOWN) && coordinateInLayoutDirection < firstLayerBegin)
        || (( direction === Direction.LEFT || direction === Direction.UP) && coordinateInLayoutDirection > firstLayerBegin)) {
        return -1;
    } else {
        // The node is added in a new last layer.
        return layers[layers.length - 1].id + 1
    }
}

/**
 * Adjusts the layer constraint value for a node in case that the target layer's id was boosted by an user defined constraint.
 * 
 * @param node The node that was moved
 * @param nodes All nodes
 * @param layerCandidate The current candidate value for the new layer constraint
 * @returns The real candidate layer number a node will be moved to.
 */
export function getActualLayer(node: KNode, nodes: KNode[], layerCandidate: number): number {

    // Examine all nodes that have a layer Id left or equal to the layerCandidate and that have a layerCons > their layerId
    const layerConstraintLeftOfCandidate = nodes.filter(n => n.properties['org.eclipse.elk.layered.layering.layerId'] as number <= layerCandidate
        && (n.properties['org.eclipse.elk.layered.layering.layerChoiceConstraint'] as number) > (n.properties['org.eclipse.elk.layered.layering.layerId'] as number))

    // In case that there are no such nodes return the layerCandidate
    if (layerConstraintLeftOfCandidate.length === 0) {
        return layerCandidate
    }

    // Search the highest layer constraint among those nodes
    // You can't just look to the left layer or the layer left of the next layer since their could have been an arbitrary numbers
    // of shifts
    let nodeWithMaxCons = null
    let maxCons = -1
    for (const n of layerConstraintLeftOfCandidate) {
        const layerConstraint = n.properties['org.eclipse.elk.layered.layering.layerChoiceConstraint'] as number
        if (layerConstraint > maxCons) {
            nodeWithMaxCons = n
            maxCons = layerConstraint
        }
    }

    if (nodeWithMaxCons !== null) {
        const idDiff = layerCandidate - (nodeWithMaxCons.properties['org.eclipse.elk.layered.layering.layerId'] as number)
        return maxCons + idDiff
    }

    return layerCandidate
}

/**
 * Adjusts the target index of a node in the case that the node above it has a position constraint > count of nodes in the layer.
 * 
 * @param targetIndex The current candidate target index
 * @param alreadyInLayer Signals whether the node already was in the layer before it was moved.
 * @param layerNodes All nodes of the target layer
 * @returns The real target position a node will be moved to.
 */
export function getActualTargetIndex(targetIndex: number, alreadyInLayer: boolean, layerNodes: KNode[]): number {
    let localTargetIndex = targetIndex
    if (localTargetIndex > 0) {
        // Check whether there is an user defined pos constraint on the upper neighbor that is higher
        // than its position ID
        const upperIndex = localTargetIndex - 1
        const upperNeighbor = layerNodes[upperIndex]
        const posConsOfUpper = upperNeighbor.properties['org.eclipse.elk.layered.crossingMinimization.positionChoiceConstraint'] as number
        if (posConsOfUpper > upperIndex) {
            if (alreadyInLayer && upperNeighbor.properties['org.eclipse.elk.layered.crossingMinimization.positionId'] === localTargetIndex) {
                localTargetIndex = posConsOfUpper
            } else {
                localTargetIndex = posConsOfUpper + 1
            }
        }
    }
    return localTargetIndex
}

/**
 * Calculates the layers in a graph based on the layer IDs and positions of the nodes.
 * 
 * @param nodes All nodes of the graph which layers should be calculated.
 * @param direction The layout direction.
 * @returns The calculated layers of the given nodes based on the layout direction, the layer ids, and the node coordinates.
 */
export function getLayers(nodes: KNode[], direction: Direction): Layer[] {
    // All nodes within one hierarchy level have the same direction
    nodes.sort((a, b) => (a.properties['org.eclipse.elk.layered.layering.layerId'] as number) - (b.properties['org.eclipse.elk.layered.layering.layerId'] as number))
    const layers = []
    let layer = 0
    // Begin coordinate of layer, depending of on the layout direction this might be a x or y coordinate
    let beginCoordinate = (direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.DOWN) ? Number.MAX_VALUE : Number.MIN_VALUE
    // End coordinate of layer, depending of on the layout direction this might be a x or y coordinate
    let endCoordinate = (direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.DOWN) ? Number.MIN_VALUE : Number.MAX_VALUE
    let topBorder = Number.MAX_VALUE // naming fits to the RIGHT direction (1)
    let bottomBorder = Number.MIN_VALUE
    // Calculate bounds of the layers
    for (const node of nodes) {
        if (node.properties['org.eclipse.elk.layered.layering.layerId'] !== layer) {
            // Node is in the next layer
            layers[layers.length] = new Layer(layer, beginCoordinate, endCoordinate, beginCoordinate + (endCoordinate - beginCoordinate) / 2, direction)
            beginCoordinate = (direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.DOWN) ? Number.MAX_VALUE : Number.MIN_VALUE
            endCoordinate = (direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.DOWN) ? Number.MIN_VALUE : Number.MAX_VALUE
            layer = node.properties['org.eclipse.elk.layered.layering.layerId'] as number
        }

        // Coordinates of the current node for normal case.
        let currentBegin = 0
        let currentEnd = 0
        let currentTopBorder = 0
        let currentBottomBorder = 0
        switch (direction) {
            case Direction.UNDEFINED: case Direction.RIGHT: {
                currentBegin = node.shadow ? node.shadowX : node.position.x
                currentEnd = currentBegin + node.size.width
                currentTopBorder = node.shadow ? node.shadowY : node.position.y
                currentBottomBorder = currentTopBorder + node.size.height
                break;
            }
            case Direction.LEFT: {
                currentEnd = node.shadow ? node.shadowX : node.position.x
                currentBegin = currentEnd + node.size.width
                currentTopBorder = node.shadow ? node.shadowY : node.position.y
                currentBottomBorder = currentTopBorder + node.size.height
                break;
            }
            case Direction.DOWN: {
                currentBegin = node.shadow ? node.shadowY : node.position.y
                currentEnd = currentBegin + node.size.height
                currentTopBorder = node.shadow ? node.shadowX : node.position.x
                currentBottomBorder = currentTopBorder + node.size.width
                break;
            }
            case Direction.UP: {
                currentEnd = node.shadow ? node.shadowY : node.position.y
                currentBegin = currentEnd + node.size.height
                currentTopBorder = node.shadow ? node.shadowX : node.position.x
                currentBottomBorder = currentTopBorder + node.size.width
                break;
            }
        }

        // Update coordinates of the current layer
        beginCoordinate = (direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.DOWN) ?
            Math.min(currentBegin, beginCoordinate) : Math.max(currentBegin, beginCoordinate)
        endCoordinate = (direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.DOWN) ?
            Math.max(currentEnd, endCoordinate) : Math.min(currentEnd, endCoordinate)
        topBorder = Math.min(currentTopBorder, topBorder)
        bottomBorder = Math.max(currentBottomBorder, bottomBorder)
    }
    // Add last layer
    layers[layers.length] = new Layer(layer, beginCoordinate, endCoordinate, beginCoordinate + ((endCoordinate - beginCoordinate) / 2), direction)
    // Offset above & below the layers
    topBorder = topBorder - PLACEMENT_TOP_BOTTOM_OFFSET
    bottomBorder = bottomBorder + PLACEMENT_TOP_BOTTOM_OFFSET
    // Update left and right bounds of the layers and set y bounds
    for (let i = 0; i < layers.length - 1; i++) {
        // Calculate the mid between two layers
        const currentLayer = layers[i]
        const precedingLayer = layers[i + 1]
        const mid = currentLayer.end + (precedingLayer.begin - currentLayer.end) / 2
        // Set right bound of the first and left bound of the second layer to the calculated mid
        currentLayer.end = mid
        precedingLayer.begin = mid
        // Set y coordinates
        currentLayer.topBorder = topBorder
        currentLayer.bottomBorder = bottomBorder
    }

    // Special case: only one layer exists
    if (layers.length === 1) {
        const firstLayer = layers[0]
        // Add padding
        switch (direction) {
            case Direction.UNDEFINED: case Direction.RIGHT: {
                firstLayer.begin = firstLayer.begin - ONE_LAYER_PADDING
                firstLayer.end = firstLayer.end + ONE_LAYER_PADDING
                firstLayer.topBorder = topBorder
                firstLayer.bottomBorder = bottomBorder
                break;
            }
            case Direction.LEFT: {
                firstLayer.begin = firstLayer.begin + ONE_LAYER_PADDING
                firstLayer.end = firstLayer.end - ONE_LAYER_PADDING
                firstLayer.topBorder = topBorder
                firstLayer.bottomBorder = bottomBorder
                break;
            }
            case Direction.DOWN: {
                firstLayer.begin = firstLayer.begin - ONE_LAYER_PADDING
                firstLayer.end = firstLayer.end + ONE_LAYER_PADDING
                firstLayer.topBorder = topBorder
                firstLayer.bottomBorder = bottomBorder
                break;
            }
            case Direction.UP: {
                firstLayer.begin = firstLayer.begin + ONE_LAYER_PADDING
                firstLayer.end = firstLayer.end - ONE_LAYER_PADDING
                firstLayer.topBorder = topBorder
                firstLayer.bottomBorder = bottomBorder
                break;
            }
        }
    } else {
        // Update left bound of the first layer
        // Add padding
        const firstLayer = layers[0]
        firstLayer.begin = firstLayer.mid - (firstLayer.end - firstLayer.mid)

        // Update bounds of the last layer
        // Left bound of the layer is the right bound of the layer left of it.
        const lastLayer = layers[layers.length - 1]
        lastLayer.begin = layers[layers.length - 2].end
        // Distance from mid of the last layer to the right bound should be the same as to the left bound.
        const distance = lastLayer.mid - lastLayer.begin
        lastLayer.end = lastLayer.mid + distance
        // Set y coordinates
        lastLayer.topBorder = topBorder
        lastLayer.bottomBorder = bottomBorder
    }
    return layers
}

/**
 * Calculates the nodes that are in the given layer based on the layer IDs of the nodes.
 * 
 * @param layer The layer which containing nodes should be calculated.
 * @param nodes All nodes the graph contains.
 * @returns The KNodes in the layer given by its number and the nodes layerId
 */
export function getNodesOfLayer(layer: number, nodes: KNode[]): KNode[] {
    const nodesOfLayer: KNode[] = []
    for (const node of nodes) {
        if (node.properties['org.eclipse.elk.layered.layering.layerId'] === layer) {
            nodesOfLayer[nodesOfLayer.length] = node
        }
    }
    return nodesOfLayer
}

/**
 * Calculates the position of the target node in relation to the nodes in the layer based on their y coordinates.
 * 
 * @param nodes Nodes of the layer the target is in.
 * @param target Node which position should be calculated.
 * @returns The position of a node in a layer given by their coordinates.
 */
 export function getPositionInLayer(nodes: KNode[], target: KNode, direction: Direction): number {
    // Sort the layer array by coordinates of the nodes.
    switch (direction) {
        case Direction.UNDEFINED:
        case Direction.LEFT:
        case Direction.RIGHT: {
            nodes.sort((a, b) => a.position.y - b.position.y)
            break;
        }
        case Direction.UP:
        case Direction.DOWN: {
            nodes.sort((a, b) => a.position.x - b.position.x)
            break;
        }
    }

    // Find the position of the target
    if (nodes.indexOf(target) !== -1) {
        // target is already in the list
        return nodes.indexOf(target)
    }

    switch (direction) {
        case Direction.UNDEFINED:
        case Direction.LEFT:
        case Direction.RIGHT: {
            for (let i = 0; i < nodes.length; i++) {
                if (target.position.y < nodes[i].position.y) {
                    return i
                }
            }
            break;
        }
        case Direction.UP:
        case Direction.DOWN: {
            for (let i = 0; i < nodes.length; i++) {
                if (target.position.x < nodes[i].position.x) {
                    return i
                }
            }
            break;
        }
    }

    return nodes.length
}

/**
 * Determines whether the layer is forbidden for the given node.
 * The layer is forbidden if another node is in the layer that
 * is connected to the given node by an edge and has a layer constraint.
 * 
 * @param node The KNode.
 * @param layer The number indicating the layer.
 * @returns Returns true if is is not allowed to set a layer constraint for the given node and layer.
 */
 export function isLayerForbidden(node: KNode, layer: number): boolean {
    const layerNodes = getNodesOfLayer(node.properties['org.eclipse.elk.layered.layering.layerId'] as number, filterKNodes(node.parent.children as KNode []))
    const chainNodes = getChain(node, layerNodes)
    // Collect the connected nodes
    const connectedNodes: KNode[] = []
    for (const n of chainNodes) {
        let edges = n.outgoingEdges as any as KEdge[]
        for (const edge of edges) {
            connectedNodes[connectedNodes.length] = edge.target as KNode
        }
        edges = n.incomingEdges as any as KEdge[]
        for (const edge of edges) {
            connectedNodes[connectedNodes.length] = edge.source as KNode
        }
    }

    // Check the connected nodes for layer constraints
    for (const node of connectedNodes) {
        if (node.properties['org.eclipse.elk.layered.layering.layerId'] === layer
            && node.properties['org.eclipse.elk.layered.layering.layerChoiceConstraint'] !== -1
            && node.properties['org.eclipse.elk.layered.layering.layerChoiceConstraint'] !== undefined) {
            // layer is forbidden for the given node
            return true
        }
    }

    // Layer is valid for the given node
    return false
}

/**
 * Determines whether only the layer constraint should be set.
 * For RIGHT layout, this is the case if the node is above or below the layers.
 * 
 * @param node The node that is moved.
 * @param layers The layers in the graph.
 * @returns Returns true if only a layer constraint should be set based on the coordinates of the layers and the node.
 */
export function isOnlyLayerConstraintSet(node: KNode, layers: Layer[], direction: Direction): boolean {
    const coordinateToCheck = (direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.LEFT) ?
        node.position.y : node.position.x
    if (layers.length !== 0) {
        const layerTop = layers[0].topBorder
        const layerBot = layers[0].bottomBorder
        // If the node is below or above the layer only the layer constraint should be set
        return coordinateToCheck < layerTop || coordinateToCheck > layerBot
    }
    return false
}

/**
 * Sets properties of the target accordingly to the position the target is moved to
 * 
 * @param nodes The nodes of the graph.
 * @param layers The layers of the graph.
 * @param target SModelElement that is moved.
 * @returns The action that should be invoked based on the coordinates of the target element.
 */
export function setProperty(nodes: KNode[], layers: Layer[], target: SModelElement): Action {
    const targetNode: KNode = target as KNode
    const direction = targetNode.direction
    // Calculate layer and position the target has in the graph at the new position
    const layerOfTarget = getLayerOfNode(targetNode, nodes, layers, direction)
    const nodesOfLayer = getNodesOfLayer(layerOfTarget, nodes)
    const positionOfTarget = getPositionInLayer(nodesOfLayer, targetNode, direction)
    const newPositionCons = getActualTargetIndex(positionOfTarget, nodesOfLayer.indexOf(targetNode) !== -1, nodesOfLayer)
    const newLayerCons = getActualLayer(targetNode, nodes, layerOfTarget)
    const forbidden = isLayerForbidden(targetNode, newLayerCons)

    if (forbidden) {
        // If layer is forbidden just refresh
        return RefreshLayoutAction.create()
    } else if (targetNode.properties['org.eclipse.elk.layered.layering.layerId'] !== layerOfTarget) {
        // Layer constraint should only be set if the layer index changed
        if (isOnlyLayerConstraintSet(targetNode, layers, direction)) {
            // only the layer constraint should be set
            return SetLayerConstraintAction.create({
                id: targetNode.id,
                layer: layerOfTarget,
                layerCons: newLayerCons
            })
        } else {
            // If layer and position constraint should be set - send them both in one StaticConstraint
            return SetStaticConstraintAction.create({
                id: targetNode.id,
                layer: layerOfTarget,
                layerCons: newLayerCons,
                position: positionOfTarget,
                posCons: newPositionCons
            })
        }
    } else {

        // Position constraint should only be set if the position of the node changed
        if (targetNode.properties['org.eclipse.elk.layered.crossingMinimization.positionId'] !== positionOfTarget) {
            // Set the position Constraint
            return SetPositionConstraintAction.create({
                id: targetNode.id,
                position: positionOfTarget,
                posCons: newPositionCons
            })
        }
    }
    // If the node was moved without setting a constraint - let it snap back
    return RefreshLayoutAction.create()
}