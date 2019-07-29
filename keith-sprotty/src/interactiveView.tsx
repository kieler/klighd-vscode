/** @jsx svg */
import { KNode, Layer } from "@kieler/keith-interactive/lib/ConstraintClasses";
import { layerOfSelectedNode, filterKNodes, getLayers, getNodesOfLayer, getPosInLayer } from "@kieler/keith-interactive/lib/ConstraintUtils";
import { svg } from 'snabbdom-jsx';
import { createRect, createVerticalLine, createCircle, lock, arrow } from "./interactiveView-objects";
import { VNode } from "snabbdom/vnode";

/**
 * Visualize the layers and availabe positions in the graph
 * @param root Root of the hierarchical level for which the layers and positions should be visualized.
 */
export function renderInteractiveLayout(root: KNode): VNode {
    // filter KNodes
    let nodes = filterKNodes(root.children)
    return  <g>
                {renderLayer(nodes)}
            </g>
}

/**
 * Visualize the layer the selected node is in as a rectangle and all other layers as a vertical line.
 * The rectangle contains circles indicating the available positions.
 * @param node All nodes in the hierarchical level for which the layers should be visualized.
 */
function renderLayer(nodes: KNode[]): VNode {
    let currentLayer = layerOfSelectedNode(nodes)
    let layers: Layer[] = getLayers(nodes)

    // y coordinates of the layers
    let topY = layers[0].topY
    let botY = layers[0].botY

    // create layers
    let result = <g></g>
    for (let i = 0; i < layers.length; i++) {
        let layer = layers[i]
        if (i === currentLayer) {
            result = <g>{result}{createRect(layer.leftX, topY, layer.rightX - layer.leftX, botY - topY)}</g>
        } else {
            result  = <g>{result}{createVerticalLine(layer.mid, topY, botY)}</g>
        }
    }

    // show a new empty last layer the node can be moved to
    let lastL = layers[layers.length - 1]
    let lastLNodes = getNodesOfLayer(layers.length - 1, nodes)
    if (lastLNodes.length !== 1 || !lastLNodes[0].selected) {
        // only show the layer if the moved node is not (the only node) in the last layer
        if (currentLayer === layers.length) {
            result = <g>{result}{createRect(lastL.rightX, topY, lastL.rightX - lastL.leftX, botY - topY)}</g>
        } else {
            result = <g>{result}{createVerticalLine(lastL.mid + (lastL.rightX - lastL.leftX), topY, botY)}</g>
        }
    }

    // add available positions
    return <g>{result}{renderPositions(currentLayer, nodes, layers)}</g>
}

/**
 * Creates circles that indicate the available positions.
 * The position the node would be set to if it released is indicated by a filled circle.
 * @param current Number of the layer the selected node is currently in.
 * @param nodes All nodes in the hierarchical level for which the layers should be visualized.
 * @param layers All layers in the graph at the hierarchival level.
 */
function renderPositions(current: number, nodes: KNode[], layers: Layer[]): VNode {
    let layerNodes: KNode[] = getNodesOfLayer(current, nodes)

    // get the selected node
    let target = nodes[0]
    for (let node of nodes) {
        if (node.selected) {
            target = node
        }
    }
    // position of selected node
    let curPos = getPosInLayer(layerNodes, target)

    layerNodes.sort((a, b) => a.posId - b.posId)

    if (layerNodes.length > 0) {
        let result = <g></g>
        // mid of the current layer
        let x = layers[current].mid

        let shift = 1
        // calculate positions between nodes
        for (let i = 0; i < layerNodes.length - 1; i++) {
            let node = layerNodes[i]
            // at the old position of the selected node should not be a circle
            if (!node.selected && !layerNodes[i + 1].selected) {
                // calculate y coordinate of the mid between the two nodes
                let topY = node.position.y + node.size.height
                let botY = layerNodes[i + 1].position.y
                let midY = topY + (botY - topY) / 2
                result = <g>{result}{createCircle(curPos === i + shift, x, midY)}</g>
            } else {
                shift = 0
            }
        }

        // position above the first node is available if the first node is not the selected one
        let first = layerNodes[0]
        if (!first.selected) {
            result = <g>{result}{createCircle(curPos === 0, x, first.position.y - 10)}</g>
        }
        // position below the last node is available if the last node is not the selected one
        let last = layerNodes[layerNodes.length - 1]
        if (!last.selected) {
            result = <g>{result}{createCircle(curPos === layerNodes.length - 1 + shift, x, last.position.y + last.size.height + 10)}</g>
        }

        return result
    } else {
        // there are no nodes in the layer
        // show a circle in the middle of the layer
        let lastL = layers[layers.length - 1]
        let x = lastL.mid + (lastL.rightX - lastL.leftX)
        let y = lastL.topY + (lastL.botY - lastL.topY) / 2
        return <g>{createCircle(true, x, y)}</g>
    }
}

/**
 * Generates an icon to visualize the set Constraints of the node.
 * @param node KNode which Constraints should be rendered.
 */
export function renderConstraints(node: KNode): VNode {
    let result = <g></g>
    let x = node.size.width
    let y = 0
    if (node.layerCons !== -1 && node.posCons !== -1) {
        // layer and position COnstraint are set
        result = <g>{result}{lock(x, y)}</g>
    } else if (node.layerCons !== -1) {
        // only layer Constraint is set
        result = <g>{result}{layerCons(x + 2, y - 2)}</g>
    } else if (node.posCons !== -1) {
        // only position Constraint is set
        result = <g>{result}{posCons(x + 2, y - 2)}</g>
    }
    return result
}

/**
 * Creates an icon that visualizes a layer constraint.
 * @param x
 * @param y
 */
function layerCons(x: number, y: number): VNode {
    return  <g> {lock(x, y)}
                {arrow(x - 2.15, y + 2.6, false)}
            </g>
}

/**
 * Creates an icon that visualizes a position constraint.
 * @param x
 * @param y
 */
function posCons(x: number, y: number): VNode {
    return  <g> {lock(x, y)}
                {arrow(x + 0.1, y + 2.5, true)}
                {/* <image x="0" y="0" width="50" height="50"
                    xlinkHref="C:/Bachelorarbeit/SVG-Test/Test.svg">
                </image> */}
            </g>
}
