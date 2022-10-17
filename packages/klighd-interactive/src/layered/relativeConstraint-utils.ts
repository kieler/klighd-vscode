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
    if (!succ === undefined && succ.id === targetNode.id) {
        // node should not be its own successor
        succ = nodesOfLayer[positionOfTarget + 1]
    }

    // if node is in its original layer, it can be its own pred or succ
    if (positionOfTarget === targetNode.properties['org.eclipse.elk.layered.crossingMinimization.positionId']
        && layerOfTarget === targetNode.properties['org.eclipse.elk.layered.layering.layerId']) {
        switch (direction) {
            case Direction.UNDEFINED:
            case Direction.LEFT:
            case Direction.RIGHT: {
                if (targetNode.position.y > targetNode.shadowY) {
                    pred = targetNode
                } else {
                    succ = targetNode
                }
                break;
            }
            case Direction.UP:
            case Direction.DOWN: {
                if (targetNode.position.x > targetNode.shadowX) {
                    pred = targetNode
                } else {
                    succ = targetNode
                }
                break;
            }
        }
    }


    let iLPredOf = false
    let iLSuccOf = false
    const midY = targetNode.position.y + 0.5 * targetNode.size.height
    const midX = targetNode.position.x + 0.5 * targetNode.size.width

    // coordinates for the case the node is its own pred/succ
    let predY = 0
    if (pred !== undefined) {
        if (pred.id === targetNode.id) {
            predY = targetNode.shadowY
        } else {
            predY = pred.position.y
        }
    }
    let succY = 0
    if (succ !== undefined) {
        if (succ.id === targetNode.id) {
            succY = targetNode.shadowY
        } else {
            succY = succ.position.y
        }
    }

    switch (direction) {
        case Direction.UNDEFINED:
        case Direction.LEFT:
        case Direction.RIGHT: {
            if (succ === undefined || (pred !== undefined && midY - predY - pred.size.height < succY - midY)) {
                // distance between current node and predecessor is lower
                if (!pred === undefined && pred.id !== targetNode.id) {
                    // no constraint should be set if the moved node is in range of its original position
                    iLSuccOf = true
                }
            } else if (succ !== undefined && succ.id !== targetNode.id) {
                // moved node must be in certain x range
                iLPredOf = true
            }
            break;
        }
        case Direction.UP:
        case Direction.DOWN: {
            if (succ === undefined || (pred !== undefined && midX - pred.position.x - pred.size.width < succ.position.x - midX)) {
                // distance between current node and predecessor is lower
                if (pred !== undefined && pred.id !== targetNode.id) {
                    // no constraint should be set if the moved node is in range of its original position
                    iLSuccOf = true
                }
            } else if (succ !== undefined && succ.id !== targetNode.id) {
                // moved node must be in certain y range
                iLPredOf = true
            }
            break;
        }
    }

    if (iLSuccOf) {
        if (!forbiddenRC(targetNode, pred)) {
            return {relCons: RelCons.IN_LAYER_SUCC_OF, node: pred, target: targetNode}
        }
    } else if (iLPredOf) {
        if (!forbiddenRC(targetNode, succ)) {
            return {relCons: RelCons.IN_LAYER_PRED_OF, node: succ, target: targetNode}
        }
    }

    return {relCons: RelCons.UNDEFINED, node: targetNode, target: targetNode}
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