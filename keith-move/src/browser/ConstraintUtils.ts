import { SNode } from "sprotty";
import { KNode, Layer } from "./ConstraintClasses";


export class ConstraintUtils {
   /**
     * Checks whether two arrays of SNodes are equal based on the id of their nodes.
     * It's explicitly no set equality. Two shuffled arrays are not equal according to this function.
     * @param ar1
     * @param ar2
     */
    public static nodeArEquals(ar1: SNode[], ar2: SNode[]): Boolean {
        if (ar1.length !== ar2.length) {
            return false
        }
        for (let i = 0; i < ar1.length; i++) {
            if (ar1[i].id !== ar2[i].id) {
                return false
            }
        }


        return true
    }

    /**
     *Checks whether two SNode arrays include the same nodes.
     * @param ar1
     * @param ar2
     */
    public static sameNodeSet(ar1: SNode[], ar2: SNode[]): Boolean {
        if (ar1.length !== ar2.length) {
            return false
        }

        for (let e1 of ar1) {
            if ( !ar1.includes(e1)) {
                return false
            }
        }

        for (let e2 of ar2) {
            if ( !ar2.includes(e2)) {
                return false
            }
        }
        return true
    }

    /**
     * Calculates the layer the node is in
     * @param node node which layer should be calculated
     * @param nodes all nodes the graph contains
     * @param shadow Shadow of the node that is moved
     */
    public static getLayerOfNode(node: KNode, nodes: KNode[]) {
        // TODO: doesn't work properly when the layerCons of some nodes are greater than their layerId
        let layers = this.getLayers(nodes)
        let curX = node.position.x + node.size.width / 2
        for (let i = 0; i < layers.length; i++) {
            let layer = layers[i]
            if (curX < layer.rightX) {
                return i
            }
        }

        // node is in a new last layer
        let lastLNodes = this.getNodesOfLayer(layers.length - 1, nodes)
        if (lastLNodes.length !== 1 || !lastLNodes[0].selected) {
            return layers.length
        }

        // node is in new last layer
        return layers.length - 1
    }

    /**
     * Calculates the layers in a graph
     * @param nodes all nodes the graph which layers should be calculated
     * @param shadow Shadow of the node that is moved
     */
    public static getLayers(nodes: KNode[]) {
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
                let l = new Layer(leftX, rightX, leftX + (rightX - leftX) / 2)
                layers[layer] = l
                leftX = Number.MAX_VALUE
                rightX = Number.MIN_VALUE
                layer++
            }

            // coordinates of the current node
            let curLX = 0
            let curRX = 0
            let curTY = 0
            let curBY = 0
            if (!node.shadow) {
                curLX = node.position.x
                curRX = node.position.x + node.size.width
                curTY = node.position.y
                curBY = node.position.y + node.size.height
            } else {
                curLX = node.shadowX
                curRX = node.shadowX + node.size.width
                curTY = node.shadowY
                curBY = node.shadowY + node.size.height
            }

            // update coordinates of the current layer
            if (curLX < leftX) {
                leftX = curLX
            }
            if (curRX > rightX) {
                rightX = curRX
            }
            if (curTY < topY) {
                topY = curTY
            }
            if (curBY > botY) {
                botY = curBY
            }
        }
        let l = new Layer(leftX, rightX, leftX + (rightX - leftX) / 2)
        layers[layer] = l

        // update left and right bounds of the layers
        // set y bounds of the layers
        for (let i = 0; i < layers.length - 1; i++) {
            let leftL = layers[i]
            let rightL = layers[i + 1]
            let mid = leftL.rightX + (rightL.leftX - leftL.rightX) / 2
            leftL.rightX = mid
            rightL.leftX = mid
            leftL.topY = topY
            leftL.botY = botY
            rightL.topY = topY
            leftL.botY = botY
        }

        // special case: only one layer exists
        if (layers.length === 1) {
            let firstL = layers[0]
            firstL.leftX = firstL.leftX - 10
            firstL.rightX = firstL.rightX + 10
            firstL.topY = topY
            firstL.botY = botY
        } else {
            // update left bound of the first layer
            let firstL = layers[0]
            firstL.leftX = firstL.mid - (firstL.rightX - firstL.mid)

            // update bounds of the last layer
            let lastL = layers[layers.length - 1]
            lastL.leftX = layers[layers.length - 2].rightX
            let dist = lastL.mid - lastL.leftX
            lastL.rightX = lastL.mid + dist
            lastL.topY = topY
            lastL.botY = botY
        }

        return layers
    }

    /**
     * Calculates the nodes that are in the layer
     * @param layer the layer which containing nodes should be calculated
     * @param nodes all nodes the graph contains
     */
    public static getNodesOfLayer(layer: number, nodes: KNode[]): KNode[] {
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
     * Calculates the position of the target node in relation to the nodes in layerNs based on their y coordinates
     * @param layerNs nodes of the layer the target is in
     * @param target node which position should be calculated
     */
    public static getPosInLayer (layerNs: KNode[], target: KNode): number {
        // Sort the layer array by y.
        layerNs.sort((a, b) => a.position.y - b.position.y)
        // Find the position of the target
        if (layerNs.indexOf(target) !== -1) {
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
     * @param graphElements all elements that the graph contains
     * @returns all KNodes that the graph contains
     */
    public static filterKNodes(graphElements: any) {
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
     * determines if one fo the children is selected
     * @param root node which children should be checked
     */
    public static isChildSelected(root: SNode): boolean {
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
}