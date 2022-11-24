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
/** @jsx svg */
import { VNode } from 'snabbdom';
import { svg } from 'sprotty'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Direction, KNode, RelativeConstraintType } from '../constraint-classes';
import { getSelectedNode } from '../helper-methods';
import { createRectangle, createVerticalLine, renderArrow, renderCircle, renderLock } from '../interactive-view-objects';
import { Layer } from './constraint-types';
import { getLayerOfNode, getLayers, getNodesOfLayer, getPositionInLayer, HORIZONTAL_ARROW_X_OFFSET, HORIZONTAL_ARROW_Y_OFFSET, isLayerForbidden, isOnlyLayerConstraintSet, VERTICAL_ARROW_X_OFFSET, VERTICAL_ARROW_Y_OFFSET } from './constraint-utils';
import { determineRelativeConstraint, isRelativeConstraintForbidden } from './relative-constraint-utils';


/**
 * Visualize the layer the selected node is in as a rectangle and all other layers as a vertical line.
 * The rectangle contains circles indicating the available positions.
 * 
 * @param node All nodes in the hierarchical level for which the layers should be visualized.
 * @param root Root of the hierarchical level.
 * @returns The constructed VNode to be added to the view, which visualizes the available layers and positions in the current hierarchy level.
 */
export function renderHierarchyLevel(nodes: KNode[]): VNode {
    const direction = nodes[0].direction
    const selectedNode = getSelectedNode(nodes)
    if (selectedNode !== undefined) {
        const layers = getLayers(nodes, direction)
        const currentLayer = getLayerOfNode(selectedNode, nodes, layers, direction)
        const forbidden = isLayerForbidden(selectedNode, currentLayer) 
        const color = forbidden ? "indianred" : "grey"

        // y coordinates of the layers
        const topBorder = layers[0].topBorder
        const bottomBorder = layers[0].bottomBorder

        // Determines whether only the layer constraint will be set when the node is released.
        const onlyLayerConstraint = isOnlyLayerConstraintSet(selectedNode, layers, direction) && selectedNode.properties['org.eclipse.elk.layered.layering.layerId'] !== currentLayer

        let existingCurrentLayer = null
        // Create layers.
        let result = <g></g>
        for (const layer of layers) {
            if (layer.id === currentLayer) {
                existingCurrentLayer = layer
                result = <g>{result}{createRectangle(layer.begin, layer.end, topBorder, bottomBorder, forbidden, onlyLayerConstraint, direction)}</g>
            } else {
                if (!isLayerForbidden(selectedNode, layer.id)) {
                    result = <g>{result}{createVerticalLine(layer.mid, topBorder, bottomBorder, direction)}</g>
                }
            }
        }

        // Show a new empty last layer the node can be moved to
        const lastLayer = layers[layers.length - 1]
        const lastLayerNodes = getNodesOfLayer(layers.length - 1, nodes)
        if (lastLayerNodes.length !== 1 || !lastLayerNodes[0].selected) {
            // Only show the layer if the moved node is not (the only node) in the last layer
            if (currentLayer === lastLayer.id + 1) {
                result = <g>{result}{createRectangle(lastLayer.end, lastLayer.end + (lastLayer.end - lastLayer.begin), topBorder, bottomBorder, forbidden, onlyLayerConstraint, direction)}</g>
            } else {
                result = <g>{result}{createVerticalLine(lastLayer.mid + (lastLayer.end - lastLayer.begin), topBorder, bottomBorder, direction)}</g>
            }
        }
        // Show a new empty first layer the node can be moved to
        const firstLayer = layers[0]
        const firstLayerNodes = getNodesOfLayer(0, nodes)
        let newFirstLayer = false
        if (firstLayerNodes.length !== 1 || !firstLayerNodes[0].selected) {
            // Only show the layer if the moved node is not (the only node) in the first layer
            if (currentLayer === -1) {
                newFirstLayer = true
                result = <g>{result}{createRectangle(firstLayer.begin - (firstLayer.end - firstLayer.begin), firstLayer.begin, topBorder, bottomBorder, forbidden, onlyLayerConstraint, direction)}</g>
            } else {
                result = <g>{result}{createVerticalLine(firstLayer.begin - (firstLayer.end - firstLayer.begin) / 2, topBorder, bottomBorder, direction)}</g>
            }
        }


        // Positions should only be rendered if a position constraint will be set
        if (!onlyLayerConstraint) {
            // @ts-ignore
            return <g>{result}{renderPositions(existingCurrentLayer, nodes, layers, color, direction, false, newFirstLayer)}</g>
        } else {
            // Add available positions
            return result
        }
    }
    return <g></g>
}

/**
 * Creates circles that indicate the available positions.
 * The position the node would be set to if it released is indicated by a filled circle.
 * 
 * @param current The layer the selected node is currently in.
 * @param nodes All nodes in the hierarchical level for which the layers should be visualized.
 * @param layers All layers in the graph at the hierarchical level.
 * @param forbidden Determines whether the current layer is forbidden.
 * @returns VNode that adds indicators for available positions to the view.
 */
 export function renderPositions(currentLayer: Layer, nodes: KNode[], layers: Layer[], color: string, direction: Direction, relativeConstraintMode: boolean, newFirstLayer: boolean): VNode {
    let layerNodes: KNode[] = []
    if (currentLayer !== null) {
        layerNodes = getNodesOfLayer(currentLayer.id, nodes)
    }

    // Get the selected node.
    let target = nodes[0]
    for (const node of nodes) {
        if (node.selected) {
            target = node
        }
    }
    // Position of selected node.
    const currentPosition = getPositionInLayer(layerNodes, target, direction)

    // Determine relative constraint.
    let constraint = undefined
    if (relativeConstraintMode) {
        constraint = determineRelativeConstraint(nodes, layers, target)
    }

    layerNodes.sort((a, b) => (a.properties['org.eclipse.elk.layered.crossingMinimization.positionId'] as number) - (b.properties['org.eclipse.elk.layered.crossingMinimization.positionId'] as number))
    if (layerNodes.length > 0) {
        let result = <g></g>
        // mid of the current layer

        let shift = 1
        let x = 0, y = 0;
        // calculate positions between nodes
        for (let i = 0; i < layerNodes.length - 1; i++) {
            // The constraint is undefined if target is an adjacent node.
            // If this is the case, the circle should not be filled.
            let fill = constraint !== undefined ? constraint.relCons !== RelativeConstraintType.UNDEFINED && currentPosition === i + shift : currentPosition === i + shift
            const node = layerNodes[i]
            // Coordinates for both inspected nodes.
            let nodeY = node.position.y
            let nodeX = node.position.x
            let nextNodeY = layerNodes[i + 1].position.y
            let nextNodeX = layerNodes[i + 1].position.x
            if (node.selected) {
                nodeY = node.shadowY
                nodeX = node.shadowX
                shift = 0
                fill = constraint !== undefined && constraint.node.id === layerNodes[i + 1].id && constraint.relCons === RelativeConstraintType.IN_LAYER_PREDECESSOR_OF
            } else if (layerNodes[i + 1].selected) {
                nextNodeY = layerNodes[i + 1].shadowY
                nextNodeX = layerNodes[i + 1].shadowX
                fill = constraint !== undefined && constraint.node.id === node.id && constraint.relCons === RelativeConstraintType.IN_LAYER_SUCCESSOR_OF
            }
            // At the old position of the selected node should only be a circle if a rel cons will be set
            if (relativeConstraintMode || (!node.selected && !layerNodes[i + 1].selected)) {
                // Calculate y coordinate of the mid between the two nodes
                switch (direction) {
                    case Direction.UNDEFINED: case Direction.RIGHT: {
                        x = currentLayer.mid
                        const topY = nodeY + node.size.height
                        const botY = nextNodeY
                        y = topY + (botY - topY) / 2
                        break;
                    }
                    case Direction.LEFT: {
                        x = currentLayer.mid
                        const topY = nodeY + node.size.height
                        const botY = nextNodeY
                        y = topY + (botY - topY) / 2
                        break;
                    }
                    case Direction.DOWN: {
                        y = currentLayer.mid
                        const topX = nodeX + node.size.width
                        const botX = nextNodeX
                        x = topX + (botX - topX) / 2
                        break;
                    }
                    case Direction.UP: {
                        y = currentLayer.mid
                        const topX = nodeX + node.size.width
                        const botX = nextNodeX
                        x = topX + (botX - topX) / 2
                        break;
                    }
                }
                result = <g>{result}{renderCircle(fill, x, y, color)}</g>
            } else {
                shift = 0
            }
        }

        // Position above the first node is available if the first node is not the selected one.
        const first = layerNodes[0]
        if (!first.selected && (constraint === undefined || !isRelativeConstraintForbidden(first, target))) {
            switch (direction) {
                case Direction.UNDEFINED: case Direction.RIGHT: {
                    x = currentLayer.mid
                    y = currentLayer.topBorder + (first.position.y - currentLayer.topBorder) / 2
                    break;
                }
                case Direction.LEFT: {
                    x = currentLayer.mid
                    y = currentLayer.topBorder + (first.position.y - currentLayer.topBorder) / 2
                    break;
                }
                case Direction.DOWN: {
                    y = currentLayer.mid
                    x = currentLayer.topBorder + (first.position.x - currentLayer.topBorder) / 2
                    break;
                }
                case Direction.UP: {
                    y = currentLayer.mid
                    x = currentLayer.topBorder + (first.position.x - currentLayer.topBorder) / 2
                    break;
                }
            }
            result = <g>{result}{renderCircle(currentPosition === 0, x, y, color)}</g>
        }
        // Position below the last node is available if the last node is not the selected one.
        const last = layerNodes[layerNodes.length - 1]
        if (!last.selected && (constraint === undefined || !isRelativeConstraintForbidden(last, target))) {
            switch (direction) {
                case Direction.UNDEFINED: case Direction.RIGHT: {
                    x = currentLayer.mid
                    y = currentLayer.bottomBorder - (currentLayer.bottomBorder - (last.position.y + last.size.height)) / 2
                    break;
                }
                case Direction.LEFT: {
                    x = currentLayer.mid
                    y = currentLayer.bottomBorder - (currentLayer.bottomBorder - (last.position.y + last.size.height)) / 2
                    break;
                }
                case Direction.DOWN: {
                    y = currentLayer.mid
                    x = currentLayer.bottomBorder - (currentLayer.bottomBorder - (last.position.x + last.size.width)) / 2
                    break;
                }
                case Direction.UP: {
                    y = currentLayer.mid
                    x = currentLayer.bottomBorder - (currentLayer.bottomBorder - (last.position.x + last.size.width)) / 2
                    break;
                }
            }
            result = <g>{result}{renderCircle(currentPosition === layerNodes.length - 1 + shift, x, y, color)}</g>
        }
        return result
    } else {
        // There are no nodes in the layer.
        // Show a circle in the middle of the layer.
        let x = 0, y = 0
        if (newFirstLayer) {
            const firstLayer = layers[0]
            switch (direction) {
                case Direction.UNDEFINED: case Direction.RIGHT: {
                    x = firstLayer.begin - (firstLayer.end - firstLayer.begin)/2
                    y = firstLayer.topBorder + (firstLayer.bottomBorder - firstLayer.topBorder) / 2
                    break;
                }
                case Direction.LEFT: {
                    x = firstLayer.begin + (firstLayer.end - firstLayer.begin)/2
                    y = firstLayer.topBorder + (firstLayer.bottomBorder - firstLayer.topBorder) / 2
                    break;
                }
                case Direction.DOWN: {
                    y = firstLayer.begin - (firstLayer.end - firstLayer.begin)/2
                    x = firstLayer.topBorder + (firstLayer.bottomBorder - firstLayer.topBorder) / 2
                    break;
                }
                case Direction.UP: {
                    y = firstLayer.begin + (firstLayer.end - firstLayer.begin)/2
                    x = firstLayer.topBorder + (firstLayer.bottomBorder - firstLayer.topBorder) / 2
                    break;
                }
            }
        } else {
            switch (direction) {
                case Direction.UNDEFINED: case Direction.RIGHT: {
                    const lastLayer = layers[layers.length - 1]
                    x = lastLayer.mid + (lastLayer.end - lastLayer.begin)
                    y = lastLayer.topBorder + (lastLayer.bottomBorder - lastLayer.topBorder) / 2
                    break;
                }
                case Direction.LEFT: {
                    const lastLayer = layers[layers.length - 1]
                    x = lastLayer.mid + (lastLayer.end - lastLayer.begin)
                    y = lastLayer.topBorder + (lastLayer.bottomBorder - lastLayer.topBorder) / 2
                    break;
                }
                case Direction.DOWN: {
                    const lastLayer = layers[layers.length - 1]
                    y = lastLayer.mid + (lastLayer.end - lastLayer.begin)
                    x = lastLayer.topBorder + (lastLayer.bottomBorder - lastLayer.topBorder) / 2
                    break;
                }
                case Direction.UP: {
                    const lastLayer = layers[layers.length - 1]
                    y = lastLayer.mid + (lastLayer.end - lastLayer.begin)
                    x = lastLayer.topBorder + (lastLayer.bottomBorder - lastLayer.topBorder) / 2
                    break;
                }
            }
        }
        return <g>{renderCircle(true, x, y, color)}</g>
    }
}

/**
 * Render something to indicate the constraint set on a node.
 * 
 * @param node Node with a constraint
 * @returns The VNode that visualizes whether an absolute constraint is set on a node.
 */
export function renderLayeredConstraint(node: KNode): VNode {
    let result = <g></g>
    const x = node.size.width
    const y = 0
    const constraintOffset = 2
    const positionConstraint = node.properties['org.eclipse.elk.layered.crossingMinimization.positionChoiceConstraint'] as number
    const layerConstraint = node.properties['org.eclipse.elk.layered.layering.layerChoiceConstraint']
    if (layerConstraint !== -1 && positionConstraint !== -1 && layerConstraint !== undefined && positionConstraint !== undefined) {
        // layer and position Constraint are set
        result = <g>{renderLock(x, y)}</g>
    } else if (layerConstraint !== -1 && layerConstraint !== undefined) {
        // only layer Constraint is set
        result = <g>{renderLayerConstraint(x + constraintOffset, y - constraintOffset, node.direction)}</g>
    } else if (positionConstraint !== -1 && positionConstraint !== undefined) {
        // only position Constraint is set
        result = <g>{renderPositionConstraint(x + constraintOffset, y - constraintOffset, node.direction)}</g>
    }
    // @ts-ignore
    return result
}

/**
 * Creates an icon that visualizes a layer constraint.
 * 
 * @param x The x coordinate of the icon.
 * @param y The y coordinate of the icon.
 * @returns The VNode that visualizes a layer constraint.
 */
function renderLayerConstraint(x: number, y: number, direction: Direction): VNode {
    const vertical = !(direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.LEFT)
    const xOffset = vertical ? VERTICAL_ARROW_X_OFFSET : HORIZONTAL_ARROW_X_OFFSET
    const yOffset = vertical ? VERTICAL_ARROW_Y_OFFSET : HORIZONTAL_ARROW_Y_OFFSET
    // @ts-ignore
    return <g> {renderLock(x, y)}
        {renderArrow(x + xOffset, y + yOffset, vertical)}
    </g>
}

/**
 * Creates an icon that visualizes a position constraint.
 * 
 * @param x The x coordinate of the icon.
 * @param y The y coordinate of the icon.
 * @returns The VNode that visualizes a position constraint.
 */
function renderPositionConstraint(x: number, y: number, direction: Direction): VNode {
    const vertical = (direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.LEFT)
    const xOffset = vertical ? VERTICAL_ARROW_X_OFFSET : HORIZONTAL_ARROW_X_OFFSET
    const yOffset = vertical ? VERTICAL_ARROW_Y_OFFSET : HORIZONTAL_ARROW_Y_OFFSET
    // @ts-ignore
    return <g> {renderLock(x, y)}
        {renderArrow(x + xOffset, y + yOffset, vertical)}
    </g>
}