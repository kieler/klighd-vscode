/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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
import { SModelElementImpl } from 'sprotty'
import { Action } from 'sprotty-protocol'
import { RefreshLayoutAction } from '../actions'
import { Direction, KEdge, KNode, RelativeConstraintData, RelativeConstraintType } from '../constraint-classes'
import { filterKNodes } from '../helper-methods'
import { SetInLayerPredecessorOfConstraintAction, SetInLayerSuccessorOfConstraintAction } from './actions'
import { Layer } from './constraint-types'
import { getLayerOfNode, getNodesOfLayer, getPositionInLayer } from './constraint-utils'

/**
 * Sets properties of the target accordingly to the position the target is moved to.
 *
 * @param nodes All nodes of the graph.
 * @param layers Layers of the graph.
 * @param target SModelElement that is moved.
 * @returns The resulting action.
 */
export function setRelativeConstraint(nodes: KNode[], layers: Layer[], target: SModelElementImpl): Action {
    const constraint = determineRelativeConstraint(nodes, layers, target)

    switch (constraint.relCons) {
        case RelativeConstraintType.IN_LAYER_SUCCESSOR_OF:
            return SetInLayerSuccessorOfConstraintAction.create({
                id: constraint.target.id,
                referencedNode: constraint.node.id,
            })
        case RelativeConstraintType.IN_LAYER_PREDECESSOR_OF:
            return SetInLayerPredecessorOfConstraintAction.create({
                id: constraint.target.id,
                referencedNode: constraint.node.id,
            })
        default:
            // If the node was moved without setting a constraint - let it snap back
            return RefreshLayoutAction.create()
    }
}

/**
 * Determines the relative constraint that would be set and the target of the constraint.
 * @param nodes All nodes of the graph
 * @param layers Layer of the graph
 * @param target Node that is moved
 * @returns The relative constraint that should be set based on the target element's coordinates.
 */
export function determineRelativeConstraint(
    nodes: KNode[],
    layers: Layer[],
    target: SModelElementImpl
): RelativeConstraintData {
    const targetNode: KNode = target as KNode
    const { direction } = targetNode

    // calculate layer and position the target has in the graph at the new position
    const layerOfTarget = getLayerOfNode(targetNode, nodes, layers, direction)
    const nodesOfLayer = getNodesOfLayer(layerOfTarget, nodes)
    const positionOfTarget = getPositionInLayer(nodesOfLayer, targetNode, direction)

    let predecessor = nodesOfLayer[positionOfTarget - 1]
    let successor = nodesOfLayer[positionOfTarget]

    // Since targeted node is also in the layer it can be pred of succ.
    // Make sure to select the next one (if it exists) in that case.
    if (successor !== undefined && successor.id === targetNode.id) {
        // node should not be its own successor
        successor = nodesOfLayer[positionOfTarget + 1]
    }
    if (predecessor !== undefined && predecessor.id === targetNode.id) {
        // node should not be its own predecessor
        predecessor = nodesOfLayer[positionOfTarget - 2]
    }

    // Calculate whether an in-layer-predecessor-of (iLPredOf) or in-layer-successor-of (iLSuccOf) constraint
    // will be added by comparing the distance from the middle of the target node
    // to the biggest border of the predecessor and the smallest border of the successor.
    let isInLayerPredecessorOf = false
    let isInLayerSuccessorOf = false
    const midY = targetNode.position.y + 0.5 * targetNode.size.height
    const midX = targetNode.position.x + 0.5 * targetNode.size.width

    let predecessorX = Number.MIN_VALUE
    let predecessorY = Number.MIN_VALUE
    if (predecessor) {
        predecessorX = predecessor.position.x
        predecessorY = predecessor.position.y
    }
    let successorX = Number.MIN_VALUE
    let successorY = Number.MIN_VALUE
    if (successor) {
        successorX = successor.position.x
        successorY = successor.position.y
    }

    // Determine which relative constraint is set based on the coordinates of nodes and the layer direction.
    switch (direction) {
        case Direction.UNDEFINED:
        case Direction.LEFT:
        case Direction.RIGHT: {
            if (successor === undefined && predecessor !== undefined && predecessor.id !== targetNode.id) {
                isInLayerSuccessorOf = true
            } else if (successor !== undefined && predecessor !== undefined) {
                isInLayerSuccessorOf =
                    Math.abs(midY - (predecessorY + predecessor.size.height)) < Math.abs(midY - successorY)
                isInLayerPredecessorOf =
                    Math.abs(midY - (predecessorY + predecessor.size.height)) > Math.abs(midY - successorY)
            } else if (predecessor === undefined && successor !== undefined && successor.id !== targetNode.id) {
                isInLayerPredecessorOf = true
            }
            break
        }
        case Direction.UP:
        case Direction.DOWN: {
            if (successor === undefined && predecessor !== undefined && predecessor.id !== targetNode.id) {
                isInLayerSuccessorOf = true
            } else if (successor !== undefined && predecessor !== undefined) {
                isInLayerSuccessorOf =
                    Math.abs(midX - (predecessorX + predecessor.size.width)) < Math.abs(midX - successorX)
                isInLayerPredecessorOf =
                    Math.abs(midX - (predecessorX + predecessor.size.width)) > Math.abs(midX - successorX)
            } else if (predecessor === undefined && successor !== undefined && successor.id !== targetNode.id) {
                isInLayerPredecessorOf = true
            }
            break
        }
        default: {
            console.error('error in relative-constraint-utils.ts, unexpected direction in switch')
        }
    }

    // Check whether the target is allowed to be successors/predecessor of the preceding/succeeding node.
    if (isInLayerSuccessorOf) {
        if (!isRelativeConstraintForbidden(targetNode, predecessor)) {
            return new RelativeConstraintData(RelativeConstraintType.IN_LAYER_SUCCESSOR_OF, predecessor, targetNode)
        }
    } else if (isInLayerPredecessorOf) {
        if (!isRelativeConstraintForbidden(targetNode, successor)) {
            return new RelativeConstraintData(RelativeConstraintType.IN_LAYER_PREDECESSOR_OF, successor, targetNode)
        }
    }
    // If no successor or predecessor exist
    return new RelativeConstraintData(RelativeConstraintType.UNDEFINED, targetNode, targetNode)
}

/**
 * Determines the nodes that are connected to the given node by relative constraints.
 * The nodes are not sorted.
 *
 * @param node The node to determine the chain for.
 * @param layerNodes Nodes that are in the same layer as node.
 * @returns A list of nodes that are connected to the given node by relative constraints.
 */
export function getChain(node: KNode, layerNodes: KNode[]): KNode[] {
    layerNodes.sort(
        (a, b) =>
            (a.properties['org.eclipse.elk.layered.crossingMinimization.positionId'] as number) -
            (b.properties['org.eclipse.elk.layered.crossingMinimization.positionId'] as number)
    )
    const position = layerNodes.indexOf(node)
    const chainNodes: KNode[] = []
    chainNodes[0] = node
    // Check nodes before the given node.
    for (let i = position - 1; i >= 0; i--) {
        if (
            layerNodes[i].properties['org.eclipse.elk.layered.crossingMinimization.inLayerPredOf'] != null ||
            layerNodes[i + 1].properties['org.eclipse.elk.layered.crossingMinimization.inLayerSuccOf'] != null
        ) {
            chainNodes[chainNodes.length] = layerNodes[i]
        } else {
            i = -1
        }
    }
    // Check nodes after the given node.
    for (let i = position + 1; i < layerNodes.length; i++) {
        if (
            layerNodes[i].properties['org.eclipse.elk.layered.crossingMinimization.inLayerSuccOf'] != null ||
            layerNodes[i - 1].properties['org.eclipse.elk.layered.crossingMinimization.inLayerPredOf'] != null
        ) {
            chainNodes[chainNodes.length] = layerNodes[i]
        } else {
            i = layerNodes.length
        }
    }

    return chainNodes
}

/**
 * Determines whether a relative constraint can be set between {@code node1} and {@code node2}.
 *
 * @param node1 The first node.
 * @param node2 The second node.
 * @returns True if setting a relative constraint between the given nodes is forbidden.
 */
export function isRelativeConstraintForbidden(node1: KNode, node2: KNode): boolean {
    // A relative constraint can not be set if the given nodes or nodes in their chains are connected.
    let layerNodes = getNodesOfLayer(
        node1.properties['org.eclipse.elk.layered.layering.layerId'] as number,
        filterKNodes(node1.parent.children as KNode[])
    )
    let chainNodes = getChain(node1, layerNodes)
    // Collect the connected nodes of the chain linked by relative constraints of the first node..
    const connectedNodes: KNode[] = []
    for (const chainNode of chainNodes) {
        let edges = chainNode.outgoingEdges as any as KEdge[]
        for (const edge of edges) {
            connectedNodes[connectedNodes.length] = edge.target as KNode
        }
        edges = chainNode.incomingEdges as any as KEdge[]
        for (const edge of edges) {
            connectedNodes[connectedNodes.length] = edge.source as KNode
        }
    }

    layerNodes = getNodesOfLayer(
        node2.properties['org.eclipse.elk.layered.layering.layerId'] as number,
        filterKNodes(node2.parent.children as KNode[])
    )
    chainNodes = getChain(node2, layerNodes)

    // Check whether a node connected to the first chain occurs in the second chain.
    for (const node of connectedNodes) {
        if (chainNodes.includes(node)) {
            // Setting a relative constraint is forbidden for the given node.
            return true
        }
    }

    // It is allowed to set a constraint between these two nodes.
    return false
}
