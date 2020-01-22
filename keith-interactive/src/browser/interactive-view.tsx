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
import { KNode } from './constraint-classes';
import { filterKNodes } from './helper-methods';
import { svg } from 'snabbdom-jsx';
import { VNode } from "snabbdom/vnode";
import { renderHierarchyLevel, renderLayeredConstraint } from './layered/layered-interactive-view';
import { isUndefined } from 'util';

/**
 * Visualize the layers and available positions in the graph
 * @param root Root of the hierarchical level for which the layers and positions should be visualized.
 */
export function renderInteractiveLayout(root: KNode): VNode {
    // Filter KNodes
    let nodes = filterKNodes(root.children)
    let result = undefined
    if (isUndefined(root.properties.algorithm) || root.properties.algorithm === 'layered') {
        result = renderHierarchyLevel(nodes, root)
    } else if (root.properties.algorithm === 'rectPacking') {
        // TODO
    } else {
        // Not supported
    }
    // @ts-ignore
    return <g>
        {result}
    </g>
}

/**
 * Generates an icon to visualize the set Constraints of the node.
 * @param node KNode which Constraints should be rendered.
 */
export function renderConstraints(node: KNode): VNode {
    let result = <g></g>
    const algorithm = (node.parent as KNode).properties.algorithm
    if (isUndefined(algorithm) || algorithm === 'layered') {
        result = renderLayeredConstraint(node)
    } else if (algorithm === 'rectPacking') {
        // TODO
    } else {
        // Not supported
    }
    // @ts-ignore
    return result
}
