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
import { renderLock } from '../interactive-view-objects';

 /**
 * Visualize the layer the selected node is in as a rectangle and all other layers as a vertical line.
 * The rectangle contains circles indicating the available positions.
 * @param node All nodes in the hierarchical level for which the layers should be visualized.
 * @param root Root of the hierarchical level.
 */
export function renderHierarchyLevel(nodes: KNode[], root: KNode) {
    // Draw rect around all child nodes
    let color = 'grey'
    let x: number = Number.MAX_VALUE
    let y: number = Number.MAX_VALUE
    let maxX: number = Number.MIN_VALUE
    let maxY: number = Number.MIN_VALUE
    nodes.forEach(node => {
        if (node.position.x < x) {
            x = node.position.x
        }
        if (node.position.y < y) {
            y = node.position.y
        }
        if (node.position.x + node.size.width > maxX) {
            maxX = node.position.x + node.size.width
        }
        if (node.position.y + node.size.height > maxY) {
            maxY = node.position.y + node.size.height
        }
    })
    return <g><rect
        x={x - 5}
        y={y - 5}
        width={maxX - x + 10}
        height={maxY - y + 10}
        stroke={color}
        fill= 'rgba(0,0,0,0)'
        strokeWidth={10}
        style={{ 'stroke-dasharray': "4" } as React.CSSProperties}>
    </rect></g>
}

export function renderRectPackConstraint(node: KNode) {
    return <g>{renderLock(node.size.width - 7, 7)}</g>
}