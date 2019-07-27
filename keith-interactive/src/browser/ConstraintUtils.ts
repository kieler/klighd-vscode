import { SNode } from "sprotty";
import { KNode, Layer } from "@kieler/keith-constraints/lib/ConstraintClasses"

/**
 * Calculates the layer the node is in.
 * @param node Node which layer should be calculated.
 * @param nodes All nodes in the same hierarchical level as the node which layer should be calculated.
 */
export function getLayerOfNode(node: KNode, nodes: KNode[]): number {
    // TODO: doesn't work properly when the layerCons of some nodes are greater than their layerId
    let layers = getLayers(nodes)
    let curX = node.position.x + node.size.width / 2
    // check for all layers if the node is in the layer
    for (let i = 0; i < layers.length; i++) {
        let layer = layers[i]
        if (curX < layer.rightX) {
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
 * Calculates the layers in a graph based on the layer IDs and positions of the nodes.
 * @param nodes All nodes of the graph which layers should be calculated.
 */
export function getLayers(nodes: KNode[]): Layer[] {
    nodes.sort((a, b) => a.layerId - b.layerId)
    let layers = []
    let layer = 0
    let leftX = Number.MAX_VALUE
    let rightX = Number.MIN_VALUE
    let topY = Number.MAX_VALUE
    let botY = Number.MIN_VALUE
    // calculate bounds of the layers
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i]
        if (node.layerId !== layer) {
            // node is in the next layer
            layers[layer] = new Layer(leftX, rightX, leftX + (rightX - leftX) / 2)
            leftX = Number.MAX_VALUE
            rightX = Number.MIN_VALUE
            layer++
        }

        // coordinates of the current node
        let curLX = node.shadow ? node.shadowX : node.position.x
        let curRX = curLX + node.size.width
        let curTY = node.shadow ? node.shadowY : node.position.y
        let curBY = curTY + node.size.height

        // update coordinates of the current layer
        leftX = min(curLX, leftX)
        rightX = max(curRX, rightX)
        topY = min(curTY, topY)
        botY = max(curBY, botY)
    }
    // add last layer
    layers[layer] = new Layer(leftX, rightX, leftX + (rightX - leftX) / 2)

    // update left and right bounds of the layers and set y bounds
    for (let i = 0; i < layers.length - 1; i++) {
        // calculate the mid between two layers
        let leftL = layers[i]
        let rightL = layers[i + 1]
        let mid = leftL.rightX + (rightL.leftX - leftL.rightX) / 2

        // set right bound of the first and left bound of the second layer to the calculated mid
        leftL.rightX = mid
        rightL.leftX = mid

        // set y coordinates
        leftL.topY = topY
        leftL.botY = botY
        rightL.topY = topY
        leftL.botY = botY
    }

    // special case: only one layer exists
    if (layers.length === 1) {
        let firstL = layers[0]
        // add padding to x bounds
        firstL.leftX = firstL.leftX - 10
        firstL.rightX = firstL.rightX + 10
        firstL.topY = topY
        firstL.botY = botY
    } else {
        // update left bound of the first layer
        // add padding
        let firstL = layers[0]
        firstL.leftX = firstL.mid - (firstL.rightX - firstL.mid)

        // update bounds of the last layer
        // left bound of the layer is the right bound of the layer left of it
        let lastL = layers[layers.length - 1]
        lastL.leftX = layers[layers.length - 2].rightX
        // distance from mid of the last layer to the right bound should be the same as to the left bound
        let dist = lastL.mid - lastL.leftX
        lastL.rightX = lastL.mid + dist
        // set y coordinates
        lastL.topY = topY
        lastL.botY = botY
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
    let counter = 0
    for (let node of nodes) {
        if (node.layerId === layer) {
            nodesOfLayer[counter] = node
            counter++
        }
    }
    return nodesOfLayer
}

/**
 * Calculates the position of the target node in relation to the nodes in layerNs based on their y coordinates.
 * @param layerNs Nodes of the layer the target is in.
 * @param target Node which position should be calculated.
 */
export function getPosInLayer(layerNs: KNode[], target: KNode): number {
    // Sort the layer array by y coordinate.
    layerNs.sort((a, b) => a.position.y - b.position.y)
    // Find the position of the target
    if (layerNs.indexOf(target) !== -1) {
        // target is already in the list
        return layerNs.indexOf(target)
    }

    for (let i = 0; i < layerNs.length; i++) {
        if (target.position.y < layerNs[i].position.y) {
            return i
        }
    }
    return layerNs.length
}

/**
 * Filters the KNodes out of graphElements.
 * @param graphElements Elements which should be filtered.
 */
export function filterKNodes(graphElements: any): KNode[] {
    let nodes: KNode[] = []
    let counter = 0
    for (let elem of graphElements) {
        if (elem instanceof SNode) {
            nodes[counter] = elem as KNode
            counter++
        }
    }
    return nodes
}

/**
 * Calculates the maximum of two numbers.
 * @param a First number.
 * @param b Second nummber.
 */
function max(a: number, b: number): number {
    if (a < b) {
        return b
    } else {
        return a
    }
}

/**
 * Calculates the minimum of two numbers.
 * @param a First number.
 * @param b Second nummber.
 */
function min(a: number, b: number): number {
    if (a < b) {
        return a
    } else {
        return b
    }
}