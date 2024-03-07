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
/** @jsx svg */
import { VNode } from 'snabbdom'
import { svg } from 'sprotty' // eslint-disable-line @typescript-eslint/no-unused-vars
import { Direction, KEdge, KNode, RelativeConstraintType } from '../constraint-classes'
import { filterKNodes } from '../helper-methods'
import { renderArrowInDirection } from '../interactive-view-objects'
import {
    getLayerOfNode,
    getLayers,
    getNodesOfLayer,
    HORIZONTAL_ARROW_X_OFFSET,
    HORIZONTAL_ARROW_Y_OFFSET,
    VERTICAL_ARROW_X_OFFSET,
    VERTICAL_ARROW_Y_OFFSET,
} from './constraint-utils'
import { renderPositions } from './layered-interactive-view'
import { determineRelativeConstraint, getChain } from './relative-constraint-utils'

/**
 * Highlights the moved and target node & visualize the constraint that will be set.
 *
 * @param root Root node of the graph
 * @param selectedNode The selected node
 * @returns The VNode that displays what relative constraints are possible and which will be set.
 */
export function renderRelativeConstraint(root: KNode, selectedNode: KNode): VNode {
    const nodes = filterKNodes(root.children)
    const { direction } = nodes[0]
    const layers = getLayers(nodes, direction)

    const result = undefined
    const constraint = determineRelativeConstraint(nodes, layers, selectedNode)

    switch (constraint.relCons) {
        case RelativeConstraintType.IN_LAYER_SUCCESSOR_OF:
            // highlight nodes
            constraint.target.highlight = true
            constraint.node.highlight = true
            break
        case RelativeConstraintType.IN_LAYER_PREDECESSOR_OF:
            // highlight nodes
            constraint.target.highlight = true
            constraint.node.highlight = true
            break
        default: {
            console.error('error in layered-relative-constraint-view.tsx, unexpected direction in switch')
        }
    }
    return <g>{result}</g>
}

/**
 * Renders an arrow indicating the in-layer-successor-of constraint.
 *
 * @param x The desired x coordinate of the icon.
 * @param y The desired y coordinate of the icon.
 * @param direction The layout direction of the graph
 * @returns The VNode that indicates the in-layer-successor-of constraint.
 */
function renderInLayerSuccessorOf(x: number, y: number, direction: Direction, color: string): VNode {
    const vertical = !(
        direction === Direction.UNDEFINED ||
        direction === Direction.RIGHT ||
        direction === Direction.LEFT
    )
    const xOffset = vertical ? VERTICAL_ARROW_X_OFFSET : HORIZONTAL_ARROW_X_OFFSET
    const yOffset = vertical ? VERTICAL_ARROW_Y_OFFSET : HORIZONTAL_ARROW_Y_OFFSET
    const arrowDirection = vertical ? Direction.LEFT : Direction.UP
    return <g>{renderArrowInDirection(x + xOffset, y + yOffset, arrowDirection, color)}</g>
}

/**
 * Renders an arrow indicating the in-layer-predecessor-of constraint.
 *
 * @param x The desired x coordinate of the icon.
 * @param y The desired y coordinate of the icon.
 * @param direction The layout direction of the graph.
 * @returns The VNode that indicates the in-layer-predecessor-of constraint.
 */
function renderInLayerPredecessorOf(x: number, y: number, direction: Direction, color: string): VNode {
    const vertical = !(
        direction === Direction.UNDEFINED ||
        direction === Direction.RIGHT ||
        direction === Direction.LEFT
    )
    const xOffset = vertical ? VERTICAL_ARROW_X_OFFSET : HORIZONTAL_ARROW_X_OFFSET
    const yOffset = vertical ? VERTICAL_ARROW_Y_OFFSET : HORIZONTAL_ARROW_Y_OFFSET
    const arrowDirection = vertical ? Direction.RIGHT : Direction.DOWN
    return <g>{renderArrowInDirection(x + xOffset, y + yOffset, arrowDirection, color)}</g>
}

/**
 * Render something to indicate the constraint set on a node.
 *
 * @param node Node with a constraint.
 * @returns The VNode that indicates which relative constraint will be set on the node.
 */
export function renderSetRelativeConstraint(node: KNode): VNode {
    let result = <g></g>
    const inLayerPredecessorOfConstraint = node.properties['org.eclipse.elk.layered.crossingMinimization.inLayerPredOf']
    const inLayerSuccessorOfConstraint = node.properties['org.eclipse.elk.layered.crossingMinimization.inLayerSuccOf']

    // Relative constraint icon is shown to the right of the node.
    const x = node.size.width
    const y = 0
    const constraintOffset = 2

    if (inLayerPredecessorOfConstraint != null && inLayerSuccessorOfConstraint != null) {
        // Both relative constraint are set.
        result = (
            <g>
                {renderInLayerPredecessorOf(x + constraintOffset, y + 2 * constraintOffset, node.direction, 'grey')}
                {renderInLayerSuccessorOf(x + constraintOffset, y + constraintOffset, node.direction, 'grey')}
            </g>
        )
    } else if (inLayerPredecessorOfConstraint != null) {
        // The predecessor-of constraint is set.
        result = <g>{renderInLayerPredecessorOf(x + constraintOffset, y + constraintOffset, node.direction, 'grey')}</g>
    } else if (inLayerSuccessorOfConstraint != null) {
        // The successor-of constraint is set.
        result = <g>{renderInLayerSuccessorOf(x + constraintOffset, y + constraintOffset, node.direction, 'grey')}</g>
    }
    return result
}

/**
 * Creates circles that indicate the available positions.
 * The position the node would be set to if it released is indicated by a filled circle.
 *
 * @param nodes All nodes of the graph.
 * @param selectedNode Node that is currently selected.
 */
export function renderPositionIndicators(nodes: KNode[], selectedNode: KNode): VNode {
    const { direction } = selectedNode
    const layers = getLayers(nodes, direction)
    const currentLayer = getLayerOfNode(selectedNode, nodes, layers, direction)
    let existingCurrentLayer = null
    for (const layer of layers) {
        if (layer.id === currentLayer) {
            existingCurrentLayer = layer
        }
    }
    if (existingCurrentLayer !== null) {
        return renderPositions(existingCurrentLayer, nodes, layers, '#03A9F4', direction, true, false)
    }
    return <g></g>
}

/**
 * Sets the forbidden property of the nodes that can not have a relative constraint to the selected node.
 *
 * @param nodes All nodes of the graph.
 * @param selectedNode Node that is currently selected.
 */
export function setForbiddenOnNodes(nodes: KNode[], selectedNode: KNode): void {
    const layerOfTarget = selectedNode.properties['org.eclipse.elk.layered.layering.layerId']
    let layerNodes = getNodesOfLayer(layerOfTarget as number, nodes)
    let chainNodes = getChain(selectedNode, layerNodes)
    // collect the connected nodes
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

    // connected nodes and the ones in their chain are forbidden
    for (const connectedNode of connectedNodes) {
        layerNodes = getNodesOfLayer(
            connectedNode.properties['org.eclipse.elk.layered.layering.layerId'] as number,
            nodes
        )
        chainNodes = getChain(connectedNode, layerNodes)
        for (const chainNode of chainNodes) {
            chainNode.forbidden = true
        }
    }
}
