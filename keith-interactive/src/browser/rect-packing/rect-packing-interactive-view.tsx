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
/** @jsx svg */
import { KNode } from '../constraint-classes';
import { svg } from 'snabbdom-jsx';
import { VNode } from "snabbdom/vnode";
import React = require("react")
import { renderLock } from '../interactive-view-objects';

 /**
 * Visualize the layer the selected node is in as a rectangle and all other layers as a vertical line.
 * The rectangle contains circles indicating the available positions.
 * @param node All nodes in the hierarchical level for which the layers should be visualized.
 * @param root Root of the hierarchical level.
 */
export function renderHierarchyLevel(nodes: KNode[], root: KNode): VNode {
    let backgroundColor = 'lightgrey'
    const rects: VNode[] = []
    nodes.forEach(node => {
        // @ts-ignore
        rects.push(<rect
            x={node.position.x}
            y={node.position.y}
            width={node.size.width}
            height={node.size.width}
            fill={backgroundColor}
            stroke={'grey'}
            style={{ 'stroke-dasharray': "4" } as React.CSSProperties}>
        </rect>)
    });
    // @ts-ignore
    return <g>{rects}</g>
}

export function renderRectPackConstraint(node: KNode) {
    return <g>{renderLock(node.size.width - 7, 7)}</g>
}