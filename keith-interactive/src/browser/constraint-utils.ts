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

import { SNode } from 'sprotty';
import { KNode, Layer, KEdge } from './constraint-classes';

/**
 * Calculates the layer the node is in.
 * @param node Node which layer should be calculated.
 * @param nodes All nodes in the same hierarchical level as the node which layer should be calculated.
 * @param layers All layers at the hierarchical level.
 */
export function getLayerOfNode(node: KNode, nodes: KNode[], layers: Layer[], direction: number): number {
    let coordinateInLayoutDirection =  (direction === 0 || direction === 1 || direction === 2) ? node.position.x + node.size.width / 2 : node.position.y + node.size.height / 2

    // check for all layers if the node is in the layer
    for (let i = 0; i < layers.length; i++) {
        let layer = layers[i]
        if (coordinateInLayoutDirection < layer.end && (direction === 0 || direction === 1 || direction === 3) ||
        coordinateInLayoutDirection > layer.end && (direction === 2 || direction === 4)) {
            return i
        }
    }

    // if the node is the only one in the last layer it can not be in a new last layer
    let lastLNodes = getNodesOfLayer(layers.length - 1, nodes)
    if (lastLNodes.length === 1 && lastLNodes[0].selected) {
        // node is in last layer
        return layers.length - 1
    }

    // node is in a new last layer
    return layers.length
}

/**
 * Adjusts the layer constraint value for a node in case that the target layer's id was boosted by an user defined constraint.
 * @param node the node that was moved
 * @param nodes all nodes
 * @param layerCandidate the current candidate value for the new layer constraint
 */
export function getActualLayer(node: KNode, nodes: KNode[], layerCandidate: number) {

    // Examine all nodes that have a layer Id left or equal to the layerCandidate and that have a layerCons > their layerId
    let layerConstraintLeftOfCandidate = nodes.filter(n => n.layerId <= layerCandidate && n.layerCons > n.layerId)

    // In case that there are no such nodes return the layerCandidate
    if (layerConstraintLeftOfCandidate.length === 0) {
        return layerCandidate
    }

    // Search the highest layer constraint among those nodes
    // You can't just look to the left layer or the layer left of the next layer since their could have been an arbitrary numbers
    // of shifts
    let nodeWithMaxCons = null
    let maxCons = -1
    for (let n of layerConstraintLeftOfCandidate) {
        if (n.layerCons > maxCons) {
            nodeWithMaxCons = n
            maxCons = n.layerCons
        }
    }

    if (nodeWithMaxCons !== null) {
        let idDiff = layerCandidate - nodeWithMaxCons.layerId
        return maxCons + idDiff
    }

    return layerCandidate
}

/**
 * Adjusts the target index of a node in the case that the node above it has a position constraint > count of nodes in the layer.
 * @param targetIndex the current candidate target index
 * @param alreadyInLayer signals whether the node already was in the layer before it was moved.
 * @param layerNodes all nodes of the target layer
 */
export function getActualTargetIndex(targetIndex: number, alreadyInLayer: boolean, layerNodes: KNode[]) {
    let localTargetIndex = targetIndex
    if (localTargetIndex > 0) {
        // Check whether there is an user defined pos constraint on the upper neighbour that is higher
        // than its position ID
        let upperIndex = localTargetIndex - 1
        let upperNeighbor = layerNodes[upperIndex]
        let posConsOfUpper = upperNeighbor.posCons
        if (posConsOfUpper > upperIndex) {
            if (alreadyInLayer && upperNeighbor.posId === localTargetIndex) {
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
 * @param nodes All nodes of the graph which layers should be calculated.
 * TODO maybe add the root node which holds necessary properties
 */
export function getLayers(nodes: KNode[], direction: number): Layer[] {
    // All nodes within one hierarchy level have the same direction
    nodes.sort((a, b) => a.layerId - b.layerId)
    let layers = []
    let layer = 0
    // Begin coordinate of layer, depending of on the layout direction this might be a x or y coordinate
    let beginCoordinate = (direction === 0 || direction === 1 || direction === 3) ? Number.MAX_VALUE : Number.MIN_VALUE
    // End coordinate of layer, depending of on the layout direction this might be a x or y coordinate
    let endCoordinate = (direction === 0 || direction === 1 || direction === 3) ? Number.MIN_VALUE : Number.MAX_VALUE
    let topBorder = Number.MAX_VALUE // naming fits to the RIGHT direction (1)
    let bottomBorder = Number.MIN_VALUE
    // calculate bounds of the layers
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i]
        if (node.layerId !== layer) {
            // node is in the next layer
            // TODO if the direction changes the y coordinate might be significant
            layers[layer] = new Layer(beginCoordinate, endCoordinate, beginCoordinate + (endCoordinate - beginCoordinate) / 2, direction)
            beginCoordinate = (direction === 0 || direction === 1 || direction === 3) ? Number.MAX_VALUE : Number.MIN_VALUE
            endCoordinate = (direction === 0 || direction === 1 || direction === 3) ? Number.MIN_VALUE : Number.MAX_VALUE
            layer++
        }

        // coordinates of the current node for case 1
        let currentBegin = 0
        let currentEnd = 0
        let currentTopBorder = 0
        let currentBottomBorder = 0
        switch (direction) {
            case 0: case 1: {
                currentBegin = node.shadow ? node.shadowX : node.position.x
                currentEnd = currentBegin + node.size.width
                currentTopBorder = node.shadow ? node.shadowY : node.position.y
                currentBottomBorder = currentTopBorder + node.size.height
                break;
            }
            case 2: {
                currentEnd = node.shadow ? node.shadowX : node.position.x
                currentBegin = currentEnd + node.size.width
                currentTopBorder = node.shadow ? node.shadowY : node.position.y
                currentBottomBorder = currentTopBorder + node.size.height
                break;
            }
            case 3: {
                currentBegin = node.shadow ? node.shadowY : node.position.y
                currentEnd = currentBegin + node.size.height
                currentTopBorder = node.shadow ? node.shadowX : node.position.x
                currentBottomBorder = currentTopBorder + node.size.width
                break;
            }
            case 4: {
                currentEnd = node.shadow ? node.shadowY : node.position.y
                currentBegin = currentEnd + node.size.height
                currentTopBorder = node.shadow ? node.shadowX : node.position.x
                currentBottomBorder = currentTopBorder + node.size.width
                break;
            }
        }

        // update coordinates of the current layer
        beginCoordinate = (direction === 0 || direction === 1 || direction === 3) ? Math.min(currentBegin, beginCoordinate) : Math.max(currentBegin, beginCoordinate)
        endCoordinate = (direction === 0 || direction === 1 || direction === 3) ? Math.max(currentEnd, endCoordinate) : Math.min(currentEnd, endCoordinate)
        topBorder = Math.min(currentTopBorder, topBorder)
        bottomBorder = Math.max(currentBottomBorder, bottomBorder)
    }
    // add last layer
    layers[layer] = new Layer(beginCoordinate, endCoordinate, beginCoordinate + ((endCoordinate - beginCoordinate) / 2), direction)
    // offset above & below the layers
    // TODO no magic numbers
    topBorder = topBorder - 20
    bottomBorder = bottomBorder + 20
    // update left and right bounds of the layers and set y bounds
    for (let i = 0; i < layers.length - 1; i++) {
        // calculate the mid between two layers
        let currentLayer = layers[i]
        let precedingLayer = layers[i + 1]
        let mid = currentLayer.end + (precedingLayer.begin - currentLayer.end) / 2
        // set right bound of the first and left bound of the second layer to the calculated mid
        currentLayer.end = mid
        precedingLayer.begin = mid
        // set y coordinates
        currentLayer.topBorder = topBorder
        currentLayer.bottomBorder = bottomBorder
    }

    // special case: only one layer exists
    if (layers.length === 1) {
        let firstLayer = layers[0]
        // add padding to x bounds
        switch (direction) {
            case 0: case 1: {
                firstLayer.begin = firstLayer.begin - 10 // TODO remove magic constants
                firstLayer.end = firstLayer.end + 10
                firstLayer.topBorder = topBorder
                firstLayer.bottomBorder = bottomBorder
                break;
            }
            case 2: {
                firstLayer.begin = firstLayer.begin + 10 // TODO remove magic constants
                firstLayer.end = firstLayer.end - 10
                firstLayer.topBorder = topBorder
                firstLayer.bottomBorder = bottomBorder
                break;
            }
            case 3: {
                firstLayer.begin = firstLayer.begin - 10 // TODO remove magic constants
                firstLayer.end = firstLayer.end + 10
                firstLayer.topBorder = topBorder
                firstLayer.bottomBorder = bottomBorder
                break;
            }
            case 4: {
                firstLayer.begin = firstLayer.begin + 10 // TODO remove magic constants
                firstLayer.end = firstLayer.end - 10
                firstLayer.topBorder = topBorder
                firstLayer.bottomBorder = bottomBorder
                break;
            }
        }
    } else {
        // update left bound of the first layer
        // add padding
        let firstLayer = layers[0]
        firstLayer.begin = firstLayer.mid - (firstLayer.end - firstLayer.mid)

        // update bounds of the last layer
        // left bound of the layer is the right bound of the layer left of it
        let lastLayer = layers[layers.length - 1]
        lastLayer.begin = layers[layers.length - 2].end
        // distance from mid of the last layer to the right bound should be the same as to the left bound
        let distance = lastLayer.mid - lastLayer.begin
        lastLayer.end = lastLayer.mid + distance
        // set y coordinates
        lastLayer.topBorder = topBorder
        lastLayer.bottomBorder = bottomBorder
    }
    return layers
}

/**
 * Calculates the nodes that are in the given layer based on the layer IDs of the nodes.
 * @param layer The layer which containing nodes should be calculated.
 * @param nodes All nodes the graph contains.
 */
export function getNodesOfLayer(layer: number, nodes: KNode[]): KNode[] {
    let nodesOfLayer: KNode[] = []
    for (let node of nodes) {
        if (node.layerId === layer) {
            nodesOfLayer[nodesOfLayer.length] = node
        }
    }
    return nodesOfLayer
}

/**
 * Calculates the position of the target node in relation to the nodes in the layer based on their y coordinates.
 * @param nodes Nodes of the layer the target is in.
 * @param target Node which position should be calculated.
 */
export function getPositionInLayer(nodes: KNode[], target: KNode): number {
    // Sort the layer array by y coordinate.
    nodes.sort((a, b) => a.position.y - b.position.y)
    // Find the position of the target
    if (nodes.indexOf(target) !== -1) {
        // target is already in the list
        return nodes.indexOf(target)
    }

    for (let i = 0; i < nodes.length; i++) {
        if (target.position.y < nodes[i].position.y) {
            return i
        }
    }
    return nodes.length
}

/**
 * Filters the KNodes out of graphElements.
 * @param graphElements Elements which should be filtered.
 */
export function filterKNodes(graphElements: any): KNode[] {
    let nodes: KNode[] = []
    for (let elem of graphElements) {
        if (elem instanceof SNode) {
            nodes[nodes.length] = elem as KNode
        }
    }
    return nodes
}

/**
 * Calculates the layer the selected node is in.
 * Returns -1 if no node of the nodes is selected.
 * @param nodes All nodes of one hierarchical level.
 */
export function getSelectedNode(nodes: KNode[]): KNode | undefined {
    for (let node of nodes) {
        if (node.selected) {
            return node
        }
    }
    return undefined
}

/**
* Determines whether one of the children is selected.
* @param root Node which children should be checked.
*/
export function isChildSelected(root: KNode): boolean {
    let nodes = root.children
    if (nodes !== undefined) {
        for (let node of nodes) {
            if (node instanceof SNode && node.selected) {
                return true
            }
        }
    }
    return false
}

/**
 * Determines whether the layer is forbidden for the given node.
 * The layer is forbidden if another node is in the layer that
 * is connected to the given node by an edge and has a layer constraint.
 * @param node The KNode.
 * @param layer The number indicating the layer.
 */
export function isLayerForbidden(node: KNode, layer: number): boolean {
    // collect the connected nodes
    let connectedNodes: KNode[] = []
    let edges = node.outgoingEdges as any as KEdge[]
    for (let edge of edges) {
        connectedNodes[connectedNodes.length] = edge.target as KNode
    }
    edges = node.incomingEdges as any as KEdge[]
    for (let edge of edges) {
        connectedNodes[connectedNodes.length] = edge.source as KNode
    }

    // check the connected nodes for layer constraints
    for (let node of connectedNodes) {
        if (node.layerId === layer && node.layerCons !== -1) {
            // layer is forbidden for the given node
            return true
        }
    }

    // layer is valid for the given node
    return false
}

/**
 * Determines whether only the layer constraint should be set.
 * @param node The node that is moved.
 * @param layers The layers in the graph.
 */
export function shouldOnlyLCBeSet(node: KNode, layers: Layer[], direction: number): boolean {
    let coordinateToCheck = (direction === 0 || direction === 1 || direction === 2) ? node.position.y : node.position.x
    if (layers.length !== 0) {
        let layerTop = layers[0].topBorder
        let layerBot = layers[0].bottomBorder
        // if the node is below or above the layer only the layer constraint should be set
        return coordinateToCheck < layerTop || coordinateToCheck > layerBot
    }
    return false
}