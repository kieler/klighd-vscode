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
/** @jsx svg */
import { KNode, Layer } from './constraint-classes';
import {
    getSelectedNode, getLayerOfNode, filterKNodes, getLayers, getNodesOfLayer, getPositionInLayer, isLayerForbidden,
    shouldOnlyLCBeSet
} from './constraint-utils';
import { svg } from 'snabbdom-jsx';
import { createRect, createVerticalLine, renderCircle, renderLock, renderArrow } from "./interactiveView-objects";
import { VNode } from "snabbdom/vnode";

/**
 * Visualize the layers and available positions in the graph
 * @param root Root of the hierarchical level for which the layers and positions should be visualized.
 */
export function renderInteractiveLayout(root: KNode): VNode {
    // Filter KNodes
    let nodes = filterKNodes(root.children)
    // @ts-ignore
    return <g>
        {renderLayer(nodes, root)}
    </g>
}

/**
 * Visualize the layer the selected node is in as a rectangle and all other layers as a vertical line.
 * The rectangle contains circles indicating the available positions.
 * @param node All nodes in the hierarchical level for which the layers should be visualized.
 * @param root Root of the hierarchical level.
 */
function renderLayer(nodes: KNode[], root: KNode): VNode {
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
function renderPositions(current: number, nodes: KNode[], layers: Layer[], forbidden: boolean, direction: number): VNode {
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
                    case 0: case 1: {
                        x = layers[current].mid
                        let topY = node.position.y + node.size.height
                        let botY = layerNodes[i + 1].position.y
                        y = topY + (botY - topY) / 2
                        break;
                    }
                    case 2: {
                        x = layers[current].mid
                        let topY = node.position.y + node.size.height
                        let botY = layerNodes[i + 1].position.y
                        y = topY + (botY - topY) / 2
                        break;
                    }
                    case 3: {
                        y = layers[current].mid
                        let topX = node.position.x + node.size.width
                        let botX = layerNodes[i + 1].position.x
                        x = topX + (botX - topX) / 2
                        break;
                    }
                    case 4: {
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
                case 0: case 1: {
                    x = layers[current].mid
                    y = layers[current].topBorder + (first.position.y - layers[current].topBorder) / 2
                    break;
                }
                case 2: {
                    x = layers[current].mid
                    y = layers[current].topBorder + (first.position.y - layers[current].topBorder) / 2
                    break;
                }
                case 3: {
                    y = layers[current].mid
                    x = layers[current].topBorder + (first.position.x - layers[current].topBorder) / 2
                    break;
                }
                case 4: {
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
                case 0: case 1: {
                    x = layers[current].mid
                    y = layers[current].bottomBorder - (layers[current].bottomBorder - (last.position.y + last.size.height)) / 2
                    break;
                }
                case 2: {
                    x = layers[current].mid
                    y = layers[current].bottomBorder - (layers[current].bottomBorder - (last.position.y + last.size.height)) / 2
                    break;
                }
                case 3: {
                    y = layers[current].mid
                    x = layers[current].bottomBorder - (layers[current].bottomBorder - (last.position.x + last.size.width)) / 2
                    break;
                }
                case 4: {
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
            case 0: case 1: {
                let lastLayer = layers[layers.length - 1]
                x = lastLayer.mid + (lastLayer.end - lastLayer.begin)
                y = lastLayer.topBorder + (lastLayer.bottomBorder - lastLayer.topBorder) / 2
                break;
            }
            case 2: {
                let lastLayer = layers[layers.length - 1]
                x = lastLayer.mid + (lastLayer.end - lastLayer.begin)
                y = lastLayer.topBorder + (lastLayer.bottomBorder - lastLayer.topBorder) / 2
                break;
            }
            case 3: {
                let lastLayer = layers[layers.length - 1]
                y = lastLayer.mid + (lastLayer.end - lastLayer.begin)
                x = lastLayer.topBorder + (lastLayer.bottomBorder - lastLayer.topBorder) / 2
                break;
            }
            case 4: {
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
 * Generates an icon to visualize the set Constraints of the node.
 * @param node KNode which Constraints should be rendered.
 */
export function renderConstraints(node: KNode): VNode {
    let result = <g></g>
    let x = node.hierWidth !== 0 ? node.hierWidth : node.size.width
    let y = 0
    const positionConstraint = node.properties.positionConstraint
    const layerConstraint = node.properties.layerConstraint
    if (layerConstraint !== -1 && positionConstraint !== -1) {
        // layer and position COnstraint are set
        result = <g>{result}{renderLock(x, y)}</g>
    } else if (layerConstraint !== -1) {
        // only layer Constraint is set
        result = <g>{result}{renderLayerConstraint(x + 2, y - 2, node.direction)}</g>
    } else if (positionConstraint !== -1) {
        // only position Constraint is set
        result = <g>{result}{renderPositionConstraint(x + 2, y - 2, node.direction)}</g>
    }
    // @ts-ignore
    return result
}

/**
 * Creates an icon that visualizes a layer constraint.
 * @param x
 * @param y
 */
function renderLayerConstraint(x: number, y: number, direction: number): VNode {
    // @ts-ignore
    return <g> {renderLock(x, y)}
        {renderArrow(x - 2.15, y + 2.6, !(direction === 0 || direction === 1 || direction === 2))}
    </g>
}

/**
 * Creates an icon that visualizes a position constraint.
 * @param x
 * @param y
 */
function renderPositionConstraint(x: number, y: number, direction: number): VNode {
    // @ts-ignore
    return <g> {renderLock(x, y)}
        {renderArrow(x + 0.1, y + 2.5, (direction === 0 || direction === 1 || direction === 2))}
    </g>
}
