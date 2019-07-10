import { SNode } from "sprotty";
import { KNode } from "./ConstraintClasses";

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
     * Calculates the layer the noe is in
     * @param node node which layer should be calculated
     * @param nodes all nodes the graph contains
     */
    public static getLayerOfNode(node: KNode, nodes: KNode[]) {
        // if the moved node is the last of a layer, it can not be moved back to this layer
        // TODO: doesn't work properly when the layerCons of some nodes are greater than their layerId
        let layerCoords = this.getLayerCoordinates(nodes)
        let curX = node.position.x
        if (curX < layerCoords[0]) {
            return 0
        }
        for (let i = 2; i < layerCoords.length; i = i + 2) {
            let coordinate = layerCoords[i]
            if (coordinate !== Number.MIN_VALUE && curX < coordinate) {
                let shift = 1
                if (layerCoords[i - 1] === Number.MIN_VALUE) {
                    shift = 2
                }
                let mid = layerCoords[i - shift] + (coordinate - layerCoords[i - shift]) / 2
                if (curX < mid) {
                    return i / 2 - shift
                } else {
                    return i / 2
                }
            }
        }
        // TODO: add offset for last layer
        if (curX < layerCoords[layerCoords.length - 1]) {
            return layerCoords.length / 2 - 1
        }
        return layerCoords.length / 2
    }

    /**
     * Calculates the left and right coordinates of the layers in a graph
     * @param nodes all nodes the graph which layer coordinates should be calculated contains
     */
    public static getLayerCoordinates(nodes: KNode[]) {
        nodes.sort((a, b) => a.layerId - b.layerId)
        let coordinates = []
        let layer = 0
        let leftX = Number.MAX_VALUE
        let rightX = Number.MIN_VALUE
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i]
            if (!node.selected) {
                if (node.layerId !== layer) {
                    // node is in the next layer
                    coordinates[2 * layer] = leftX
                    coordinates[2 * layer + 1] = rightX
                    leftX = Number.MAX_VALUE
                    rightX = Number.MIN_VALUE
                    layer++
                    if (node.layerId !== layer) {
                        coordinates[2 * layer] = Number.MIN_VALUE
                        coordinates[2 * layer + 1] = Number.MIN_VALUE
                        // TODO: calcEmptyLayerCoordinates?
                        layer++
                    }
                }

                if (node.position.x < leftX) {
                    leftX = node.position.x
                }
                if (node.size.width + node.position.x > rightX) {
                    rightX = node.position.x + node.size.width
                }
            }
        }
        coordinates[2 * layer] = leftX
        coordinates[2 * layer + 1] = rightX
        return coordinates
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
}