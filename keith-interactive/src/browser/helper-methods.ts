/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { KNode } from "./constraint-classes"
import { SNode } from "sprotty/lib/graph/sgraph"

/**
 * Filters the KNodes out of graphElements.
 * @param graphElements Elements which should be filtered.
 */
export function filterKNodes(graphElements: any): KNode[] {
    let nodes: KNode[] = []
    for (let elem of graphElements) {
        if (elem instanceof SNode) {
            nodes[nodes.length] = elem as KNode
        }
    }
    return nodes
}

/**
 * Calculates the layer the selected node is in.
 * Returns -1 if no node of the nodes is selected.
 * @param nodes All nodes of one hierarchical level.
 */
export function getSelectedNode(nodes: KNode[]): KNode | undefined {
    for (let node of nodes) {
        if (node.selected) {
            return node
        }
    }
    return undefined
}

/**
* Determines whether one of the children is selected.
* @param root Node which children should be checked.
*/
export function isChildSelected(root: KNode): boolean {
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