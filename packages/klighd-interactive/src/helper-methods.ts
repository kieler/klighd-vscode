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
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { SNode } from "sprotty/lib/graph/sgraph"
import { KNode } from "./constraint-classes"

/**
 * Filters the KNodes out of graphElements.
 * @param graphElements Elements which should be filtered.
 */
export function filterKNodes(graphElements: any): KNode[] { // eslint-disable-line
    const nodes: KNode[] = []
    for (const elem of graphElements) {
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
    for (const node of nodes) {
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
    const nodes = root.children
    if (nodes !== undefined) {
        for (const node of nodes) {
            if (node instanceof SNode && node.selected) {
                return true
            }
        }
    }
    return false
}