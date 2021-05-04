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
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
/** @jsx svg */
import { svg } from 'snabbdom-jsx';
import { VNode } from "snabbdom/vnode";
import { Direction, KNode } from '../constraint-classes';
import { getSelectedNode } from '../helper-methods';
import { createRect, createVerticalLine, renderArrow, renderCircle, renderLock } from '../interactive-view-objects';
import { Layer } from './constraint-types';
import { getLayerOfNode, getLayers, getNodesOfLayer, getPositionInLayer, isLayerForbidden, shouldOnlyLCBeSet } from './constraint-utils';


/**
 * Visualize the layer the selected node is in as a rectangle and all other layers as a vertical line.
 * The rectangle contains circles indicating the available positions.
 * @param node All nodes in the hierarchical level for which the layers should be visualized.
 * @param root Root of the hierarchical level.
 */
export function renderHierarchyLevel(nodes: KNode[], root: KNode): VNode {
    const direction = nodes[0].direction
    let selNode = getSelectedNode(nodes)
    if (selNode !== undefined) {
        let layers = getLayers(nodes, direction)
        let currentLayer = getLayerOfNode(selNode, nodes, layers, direction)
        let forbidden = isLayerForbidden(selNode, currentLayer)

        // y coordinates of the layers
        let topBorder = layers[0].topBorder
        let bottomBorder = layers[0].bottomBorder

        // let globalEndCoordinate = layers[layers.length - 1].end

        // determines whether only the layer constraint will be set when the node is released
        let onlyLC = shouldOnlyLCBeSet(selNode, layers, direction) && selNode.properties.layerId !== currentLayer

        // create layers
        let result = <g></g>
        for (let i = 0; i < layers.length; i++) {
            let layer = layers[i]
            if (i === currentLayer) {
                result = <g>{result}{createRect(layer.begin, layer.end, topBorder, bottomBorder, forbidden, onlyLC, direction)}</g>
            } else {
                if (!isLayerForbidden(selNode, i)) {
                    result = <g>{result}{createVerticalLine(layer.mid, topBorder, bottomBorder, direction)}</g>
                }
            }
        }

        // Show a new empty last layer the node can be moved to
        let lastLayer = layers[layers.length - 1]
        let lastLNodes = getNodesOfLayer(layers.length - 1, nodes)
        if (lastLNodes.length !== 1 || !lastLNodes[0].selected) {
            // Only show the layer if the moved node is not (the only node) in the last layer
            // globalEndCoordinate = lastLayer.end + lastLayer.end - lastLayer.begin
            if (currentLayer === layers.length) {
                result = <g>{result}{createRect(lastLayer.end, lastLayer.end + (lastLayer.end - lastLayer.begin), topBorder, bottomBorder, forbidden, onlyLC, direction)}</g>
            } else {
                result = <g>{result}{createVerticalLine(lastLayer.mid + (lastLayer.end - lastLayer.begin), topBorder, bottomBorder, direction)}</g>
            }
        }

        // Positions should only be rendered if a position constraint will be set
        if (!onlyLC) {
            // @ts-ignore
            return <g>{result}{renderPositions(currentLayer, nodes, layers, forbidden, direction)}</g>
        } else {
            // Add available positions
    // @ts-ignore
            return result
        }
    }
    // @ts-ignore
    return <g></g>
}

/**
 * Creates circles that indicate the available positions.
 * The position the node would be set to if it released is indicated by a filled circle.
 * @param current Number of the layer the selected node is currently in.
 * @param nodes All nodes in the hierarchical level for which the layers should be visualized.
 * @param layers All layers in the graph at the hierarchical level.
 * @param forbidden Determines whether the current layer is forbidden.
 */
export function renderPositions(current: number, nodes: KNode[], layers: Layer[], forbidden: boolean, direction: Direction): VNode {
    let layerNodes: KNode[] = getNodesOfLayer(current, nodes)

    // get the selected node
    let target = nodes[0]
    for (let node of nodes) {
        if (node.selected) {
            target = node
        }
    }
    // position of selected node
    let curPos = getPositionInLayer(layerNodes, target)

    layerNodes.sort((a, b) => a.properties.positionId - b.properties.positionId)
    if (layerNodes.length > 0) {
        let result = <g></g>
        // mid of the current layer

        let shift = 1
        let x = 0, y = 0;
        // calculate positions between nodes
        for (let i = 0; i < layerNodes.length - 1; i++) {
            let node = layerNodes[i]
            // at the old position of the selected node should not be a circle
            if (!node.selected && !layerNodes[i + 1].selected) {
                // calculate y coordinate of the mid between the two nodes
                switch (direction) {
                    case Direction.UNDEFINED: case Direction.RIGHT: {
                        x = layers[current].mid
                        let topY = node.position.y + node.size.height
                        let botY = layerNodes[i + 1].position.y
                        y = topY + (botY - topY) / 2
                        break;
                    }
                    case Direction.LEFT: {
                        x = layers[current].mid
                        let topY = node.position.y + node.size.height
                        let botY = layerNodes[i + 1].position.y
                        y = topY + (botY - topY) / 2
                        break;
                    }
                    case Direction.DOWN: {
                        y = layers[current].mid
                        let topX = node.position.x + node.size.width
                        let botX = layerNodes[i + 1].position.x
                        x = topX + (botX - topX) / 2
                        break;
                    }
                    case Direction.UP: {
                        y = layers[current].mid
                        let topX = node.position.x + node.size.width
                        let botX = layerNodes[i + 1].position.x
                        x = topX + (botX - topX) / 2
                        break;
                    }
                }
                result = <g>{result}{renderCircle(curPos === i + shift, x, y, forbidden)}</g>
            } else {
                shift = 0
            }
        }

        // position above the first node is available if the first node is not the selected one
        let first = layerNodes[0]
        if (!first.selected) {
            switch (direction) {
                case Direction.UNDEFINED: case Direction.RIGHT: {
                    x = layers[current].mid
                    y = layers[current].topBorder + (first.position.y - layers[current].topBorder) / 2
                    break;
                }
                case Direction.LEFT: {
                    x = layers[current].mid
                    y = layers[current].topBorder + (first.position.y - layers[current].topBorder) / 2
                    break;
                }
                case Direction.DOWN: {
                    y = layers[current].mid
                    x = layers[current].topBorder + (first.position.x - layers[current].topBorder) / 2
                    break;
                }
                case Direction.UP: {
                    y = layers[current].mid
                    x = layers[current].topBorder + (first.position.x - layers[current].topBorder) / 2
                    break;
                }
            }
            result = <g>{result}{renderCircle(curPos === 0, x, y, forbidden)}</g>
        }
        // position below the last node is available if the last node is not the selected one
        let last = layerNodes[layerNodes.length - 1]
        if (!last.selected) {
            switch (direction) {
                case Direction.UNDEFINED: case Direction.RIGHT: {
                    x = layers[current].mid
                    y = layers[current].bottomBorder - (layers[current].bottomBorder - (last.position.y + last.size.height)) / 2
                    break;
                }
                case Direction.LEFT: {
                    x = layers[current].mid
                    y = layers[current].bottomBorder - (layers[current].bottomBorder - (last.position.y + last.size.height)) / 2
                    break;
                }
                case Direction.DOWN: {
                    y = layers[current].mid
                    x = layers[current].bottomBorder - (layers[current].bottomBorder - (last.position.x + last.size.width)) / 2
                    break;
                }
                case Direction.UP: {
                    y = layers[current].mid
                    x = layers[current].bottomBorder - (layers[current].bottomBorder - (last.position.x + last.size.width)) / 2
                    break;
                }
            }
            result = <g>{result}{renderCircle(curPos === layerNodes.length - 1 + shift, x, y, forbidden)}</g>
        }

        // @ts-ignore
        return result
    } else {
        // there are no nodes in the layer
        // show a circle in the middle of the layer
        let x = 0, y = 0
        switch (direction) {
            case Direction.UNDEFINED: case Direction.RIGHT: {
                let lastLayer = layers[layers.length - 1]
                x = lastLayer.mid + (lastLayer.end - lastLayer.begin)
                y = lastLayer.topBorder + (lastLayer.bottomBorder - lastLayer.topBorder) / 2
                break;
            }
            case Direction.LEFT: {
                let lastLayer = layers[layers.length - 1]
                x = lastLayer.mid + (lastLayer.end - lastLayer.begin)
                y = lastLayer.topBorder + (lastLayer.bottomBorder - lastLayer.topBorder) / 2
                break;
            }
            case Direction.DOWN: {
                let lastLayer = layers[layers.length - 1]
                y = lastLayer.mid + (lastLayer.end - lastLayer.begin)
                x = lastLayer.topBorder + (lastLayer.bottomBorder - lastLayer.topBorder) / 2
                break;
            }
            case Direction.UP: {
                let lastLayer = layers[layers.length - 1]
                y = lastLayer.mid + (lastLayer.end - lastLayer.begin)
                x = lastLayer.topBorder + (lastLayer.bottomBorder - lastLayer.topBorder) / 2
                break;
            }
        }
        // @ts-ignore
        return <g>{renderCircle(true, x, y, forbidden)}</g>
    }
}

/**
 * Render something to indicate the constraint set on a node.
 * @param node Node with a constraint
 */
export function renderLayeredConstraint(node: KNode): VNode {
    let result = <g></g>
    let x = node.size.width
    let y = 0
    const constraintOffset = 2
    const positionConstraint = node.properties.positionConstraint
    const layerConstraint = node.properties.layerConstraint
    if (layerConstraint !== -1 && positionConstraint !== -1) {
        // layer and position Constraint are set
        result = <g>{renderLock(x, y)}</g>
    } else if (layerConstraint !== -1) {
        // only layer Constraint is set
        result = <g>{renderLayerConstraint(x + constraintOffset, y - constraintOffset, node.direction)}</g>
    } else if (positionConstraint !== -1) {
        // only position Constraint is set
        result = <g>{renderPositionConstraint(x + constraintOffset, y - constraintOffset, node.direction)}</g>
    }
    // @ts-ignore
    return result
}

const verticalArrowXOffset = -2.5
const verticalArrowYOffset = -5
const horizontalArrowXOffset = -0.3
const horizontalArrowYOffset = -0.7

/**
 * Creates an icon that visualizes a layer constraint.
 * @param x
 * @param y
 */
function renderLayerConstraint(x: number, y: number, direction: Direction): VNode {
    const vertical = !(direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.LEFT)
    const xOffset = vertical ? verticalArrowXOffset : horizontalArrowXOffset
    const yOffset = vertical ? verticalArrowYOffset : horizontalArrowYOffset
    // @ts-ignore
    return <g> {renderLock(x, y)}
        {renderArrow(x + xOffset, y + yOffset, vertical)}
    </g>
}

/**
 * Creates an icon that visualizes a position constraint.
 * @param x
 * @param y
 */
function renderPositionConstraint(x: number, y: number, direction: Direction): VNode {
    const vertical = (direction === Direction.UNDEFINED || direction === Direction.RIGHT || direction === Direction.LEFT)
    const xOffset = vertical ? verticalArrowXOffset : horizontalArrowXOffset
    const yOffset = vertical ? verticalArrowYOffset : horizontalArrowYOffset
    // @ts-ignore
    return <g> {renderLock(x, y)}
        {renderArrow(x + xOffset, y + yOffset, vertical)}
    </g>
}