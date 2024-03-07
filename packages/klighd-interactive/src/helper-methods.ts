/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2020-2023 by
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

import { SNodeImpl } from 'sprotty'
import { Direction, KNode } from './constraint-classes'

/**
 * Filters the KNodes out of graphElements.
 * @param graphElements Elements which should be filtered.
 */
export function filterKNodes(graphElements: any): KNode[] {
    // eslint-disable-line
    const nodes: KNode[] = []
    for (const elem of graphElements) {
        if (elem instanceof SNodeImpl) {
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
            if (node instanceof SNodeImpl && node.selected) {
                return true
            }
        }
    }
    return false
}

/**
 * Calculates dot product of two vectors of size 2.
 * This is used for directional vectors.
 * @param vector1 First vector.
 * @param vector2 Second vector.
 * @returns The dot product.
 */
export function dotProduct(vector1: [number, number], vector2: [number, number]): number {
    return vector1[0] * vector2[0] + vector1[1] * vector2[1]
}

/**
 * Get directional vector for a node.
 * UP is [0, -1], DOWN is [0, 1], RIGHT is [1, 0] and LEFT is [-1, 0].
 * @param node  The node.
 * @returns The directional vector.
 */
export function getDirectionVector(node: KNode): [number, number] {
    const { direction } = node
    if (!direction || direction === Direction.DOWN) return [0, 1]
    if (direction === Direction.LEFT) return [-1, 0]
    if (direction === Direction.RIGHT) return [1, 0]
    if (direction === Direction.UP) return [0, -1]
    return [0, 1]
}
