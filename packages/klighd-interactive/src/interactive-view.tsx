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
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
/** @jsx svg */
import { VNode } from 'snabbdom';
import { svg } from 'sprotty'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { KNode } from './constraint-classes';
import { filterKNodes, getSelectedNode } from './helper-methods';
import { renderHierarchyLevel as renderHierarchyLevelLayered, renderLayeredConstraint } from './layered/layered-interactive-view';
import { renderPositionIndicators, renderSetRelativeConstraint, setForbiddenOnNodes } from './layered/layered-relative-constraint-view';
import { renderHierarchyLevel as renderHierarchyLevelRectPacking, renderRectPackConstraint } from './rect-packing/rect-packing-interactive-view';
import { renderHierarchyLevel as renderHierarchyLevelTree, renderTreeConstraint } from './tree/tree-interactive-view';

/**
 * Visualize the layers and available positions in the graph
 * 
 * @param root Root of the hierarchical level for which the layers and positions should be visualized.
 * @param relativeConstraint Whether a relative constraint should be rendered.
 * @returns The VNode that represents the view overlay for interactive layout.
 */
export function renderInteractiveLayout(root: KNode, relativeConstraint: boolean): VNode {
    // Filter KNodes
    const nodes = filterKNodes(root.children)
    let result = undefined
    if (root.properties['org.eclipse.elk.algorithm'] === undefined || (root.properties['org.eclipse.elk.algorithm'] as string).endsWith('layered')) {
        if (relativeConstraint) {
            const selNode = getSelectedNode(nodes)
            if (selNode !== undefined) {
                setForbiddenOnNodes(nodes, selNode)
                result = renderPositionIndicators(nodes, selNode)
            }
        } else {
            result = renderHierarchyLevelLayered(nodes)
        }
    } else if ((root.properties['org.eclipse.elk.algorithm'] as string).endsWith('rectpacking')) {
        result = renderHierarchyLevelRectPacking(nodes)
    } else if ((root.properties['org.eclipse.elk.algorithm'] as string).endsWith('mrtree')) {
        result = renderHierarchyLevelTree(nodes)
    } else {
        // Not supported
    }
    return <g>
        {result}
    </g>
}

/**
 * Generates an icon to visualize the set constraints of the node.
 * 
 * @param node KNode which Constraints should be rendered.
 * @returns The VNode that includes the node icons that indicate their constraint.
 */
export function renderConstraints(node: KNode): VNode {
    let result = <g></g>
    const algorithm = (node.parent as KNode).properties['org.eclipse.elk.algorithm'] as string
    if (algorithm === undefined || algorithm.endsWith('layered')) {
        result = <g>{renderLayeredConstraint(node)}{renderSetRelativeConstraint(node)}</g>
    } else if (algorithm.endsWith('rectpacking')) {
        if (node.properties['org.eclipse.elk.rectpacking.desiredPosition'] !== undefined && node.properties['org.eclipse.elk.rectpacking.desiredPosition'] !== -1) {
            result = renderRectPackConstraint(node)
        }
    } else if (algorithm.endsWith('mrtree')) {
        result = renderTreeConstraint(node)
    } else {
        // Not supported
    }
    return result
}
