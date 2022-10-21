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
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import { Action, SModelElement } from "sprotty"
import { RefreshDiagramAction } from "../actions"
import { Direction, KNode, RelConsData, RelCons, KEdge } from "../constraint-classes"
import { filterKNodes } from "../helper-methods"
import { SetILPredOfConstraintAction, SetILSuccOfConstraintAction } from "./actions"
import { Layer } from "./constraint-types"
import { getLayerOfNode, getNodesOfLayer, getPositionInLayer } from "./constraint-utils"

/**
 * Sets properties of the target accordingly to the position the target is moved to
 * @param nodes All nodes of the graph
 * @param layers Layers of the graph
 * @param target SModelElement that is moved
 */
export function setRelativeConstraint(nodes: KNode[], layers: Layer[], target: SModelElement): Action {
    const cons = determineCons(nodes, layers, target)

    switch (cons.relCons) {
        case RelCons.IN_LAYER_SUCC_OF:
            return new SetILSuccOfConstraintAction({
                id: cons.target.id,
                otherNode: cons.node.id
            })
        case RelCons.IN_LAYER_PRED_OF:
            return new SetILPredOfConstraintAction({
                id: cons.target.id,
                otherNode: cons.node.id
            })
        default:
            // If the node was moved without setting a constraint - let it snap back
            return RefreshDiagramAction.create()
    }

}

/**
 * Determines the relative constraint that would be set and the target of the constraint.
 * @param nodes All nodes of the graph
 * @param layers Layer of the graph
 * @param target Node that is moved
 */
export function determineCons(nodes: KNode[], layers: Layer[], target: SModelElement): RelConsData {
    const targetNode: KNode = target as KNode
    const direction = targetNode.direction

    // calculate layer and position the target has in the graph at the new position
    const layerOfTarget = getLayerOfNode(targetNode, nodes, layers, direction)
    const nodesOfLayer = getNodesOfLayer(layerOfTarget, nodes)
    const positionOfTarget = getPositionInLayer(nodesOfLayer, targetNode, direction)

    let pred = nodesOfLayer[positionOfTarget - 1]
    let succ = nodesOfLayer[positionOfTarget]

    // Since targeted node is also in the layer it can be pred of succ.
    // Make sure to select the next one (if it exists) in that case.
    if (succ !== undefined && succ.id === targetNode.id) {
        // node should not be its own successor
        succ = nodesOfLayer[positionOfTarget + 1]
    }
    if (pred !== undefined && pred.id === targetNode.id) {
        // node should not be its own predecessor
        pred = nodesOfLayer[positionOfTarget - 2]
    }

    // Calculate whether an in-layer-predecessor-of (iLPredOf) or in-layer-successor-of (iLSuccOf) constraint
    // will be added by comparing the distance from the middle of the target node
    // to the biggest border of the predecessor and the smallest border of the successor.
    let iLPredOf = false
    let iLSuccOf = false
    const midY = targetNode.position.y + 0.5 * targetNode.size.height
    const midX = targetNode.position.x + 0.5 * targetNode.size.width

    let predX = Number.MIN_VALUE
    let predY = Number.MIN_VALUE
    if (pred) {
        predX = pred.position.x
        predY = pred.position.y
    }
    let succX = Number.MIN_VALUE
    let succY = Number.MIN_VALUE
    if (succ) {
        succX = succ.position.x
        succY = succ.position.y
    }

    switch (direction) {
        case Direction.UNDEFINED:
        case Direction.LEFT:
        case Direction.RIGHT: {
            if (succ === undefined && pred !== undefined && pred.id !== targetNode.id) {
                iLSuccOf = true
            } else if (succ !== undefined && pred !== undefined) {
                iLSuccOf = Math.abs(midY - (predY + pred.size.height)) < Math.abs(midY - succY)
                iLPredOf = Math.abs(midY - (predY + pred.size.height)) > Math.abs(midY - succY)
            } else if (pred === undefined && succ !== undefined && succ.id !== targetNode.id) {
                iLPredOf = true
            }
            break;
        }
        case Direction.UP:
        case Direction.DOWN: {
            if (succ === undefined && pred !== undefined && pred.id !== targetNode.id) {
                iLSuccOf = true
            } else if (succ !== undefined && pred !== undefined) {
                iLSuccOf = Math.abs(midX - (predX + pred.size.width)) < Math.abs(midX - succX)
                iLPredOf = Math.abs(midX - (predX + pred.size.width)) > Math.abs(midX - succX)
            } else if (pred === undefined && succ !== undefined && succ.id !== targetNode.id) {
                iLPredOf = true
            }
            break;
        }
    }

    // Check whether the target is allowed to be successors/predecessor of the preceding/succeeding node.
    if (iLSuccOf) {
        if (!forbiddenRC(targetNode, pred)) {
            return new RelConsData(RelCons.IN_LAYER_SUCC_OF, pred, targetNode)
        }
    } else if (iLPredOf) {
        if (!forbiddenRC(targetNode, succ)) {
            return new RelConsData(RelCons.IN_LAYER_PRED_OF, succ, targetNode)
        }
    }
    // If no successor or predecessor exist 
    return new RelConsData(RelCons.UNDEFINED, targetNode, targetNode)
}

/**
 * Determines the nodes that are connected to {@code node} by relative constraints.
 * The nodes are not sorted.
 * @param node One node of the chain
 * @param layerNodes Nodes that are in the same layer as {@code node}
 */
export function getChain(node: KNode, layerNodes: KNode[]): KNode[] {
    layerNodes.sort((a, b) => a.properties['org.eclipse.elk.layered.crossingMinimization.positionId'] as number
        - (b.properties['org.eclipse.elk.layered.crossingMinimization.positionId'] as number))
    const pos = layerNodes.indexOf(node)
    const chainNodes: KNode[] = []
    chainNodes[0] = node
    // from node to the start
    for (let i = pos - 1; i >= 0; i--) {
        if (layerNodes[i].properties['org.eclipse.elk.layered.crossingMinimization.inLayerPredOf'] != null
            || layerNodes[i + 1].properties['org.eclipse.elk.layered.crossingMinimization.inLayerSuccOf'] != null) {
            chainNodes[chainNodes.length] = layerNodes[i]
        } else {
            i = -1
        }
    }
    // from node to the end
    for (let i = pos + 1; i < layerNodes.length; i++) {
        if (layerNodes[i].properties['org.eclipse.elk.layered.crossingMinimization.inLayerSuccOf'] != null
            || layerNodes[i - 1].properties['org.eclipse.elk.layered.crossingMinimization.inLayerPredOf'] != null) {
            chainNodes[chainNodes.length] = layerNodes[i]
        } else {
            i = layerNodes.length
        }
    }

    return chainNodes
}

/**
 * Determines whether a rel cons can be set between {@code node1} and {@code node2}
 * @param node1 One of the nodes
 * @param node2 The other one of the nodes
 */
export function forbiddenRC(node1: KNode, node2: KNode): boolean {
    // rel cons can not be set if the given nodes or nodes in their chains are addjacent
    let layerNodes = getNodesOfLayer(node1.properties['org.eclipse.elk.layered.layering.layerId']  as number,
        filterKNodes(node1.parent.children as KNode []))
    let chainNodes = getChain(node1, layerNodes)
    // collect the connected nodes
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

    layerNodes = getNodesOfLayer(node2.properties['org.eclipse.elk.layered.layering.layerId']  as number,
        filterKNodes(node2.parent.children as KNode []))
    chainNodes = getChain(node2, layerNodes)

    // check the connected nodes for adjacent nodes
    for (const node of connectedNodes) {
        if (chainNodes.includes(node)) {
            // rel cons is forbidden for the given node
            return true
        }
    }

    // layer is valid for the given node
    return false
}