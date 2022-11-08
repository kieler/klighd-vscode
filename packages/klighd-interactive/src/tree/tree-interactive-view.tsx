/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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
import { Direction, KNode } from '../constraint-classes';
import { renderCircle, renderLock } from '../interactive-view-objects';
import { getOriginalNodePositionX, getOriginalNodePositionY, getSiblings } from './constraint-util';

const boundingBoxMargin = 5

 /**
 * Visualize the layer the selected node is in as a rectangle and all other layers as a vertical line.
 * The rectangle contains circles indicating the available positions.
 * 
 * @param node All nodes in the hierarchical level for which the layers should be visualized.
 * @returns The VNode that shows the available positions on the current level.
 */
export function renderHierarchyLevel(nodes: KNode[]): VNode {
    const direction = nodes[0].direction
    let result: VNode = <g></g>

    // Render Valid locations
    const selectedNode = nodes.find(x => x.selected)
    const selectedKNode = selectedNode as KNode
    if (selectedNode) {
        const selectedSiblings = getSiblings(nodes, selectedNode);
        let highlightedIndex, approxNodeSpacing = 999999

        if (direction === Direction.LEFT || direction === Direction.RIGHT) {
            selectedSiblings.sort((x, y) => getOriginalNodePositionY(x) - getOriginalNodePositionY(y));
            highlightedIndex = selectedSiblings.findIndex(x => getOriginalNodePositionY(x) + x.size.height / 2
                >= selectedKNode.position.y + selectedKNode.size.height / 2);
        } else {
            selectedSiblings.sort((x, y) => getOriginalNodePositionX(x) - getOriginalNodePositionX(y));
            highlightedIndex = selectedSiblings.findIndex(x => getOriginalNodePositionX(x) + x.size.width / 2
                >= selectedKNode.position.x + selectedKNode.size.width / 2);
        }

        for (let i = 0; i < selectedSiblings.length - 1; i++) {
            let dist
            if (direction === Direction.LEFT || direction === Direction.RIGHT)
                dist = getOriginalNodePositionY(selectedSiblings[i + 1])
                    - getOriginalNodePositionY(selectedSiblings[i]) - selectedSiblings[i].size.height
            else
                dist = getOriginalNodePositionX(selectedSiblings[i + 1])
                    - getOriginalNodePositionX(selectedSiblings[i]) - selectedSiblings[i].size.width

            if (approxNodeSpacing > dist)
                approxNodeSpacing = dist
        }

        if (selectedSiblings.length === 1)
            approxNodeSpacing = 0

        // Dashed rect
        const color = 'grey'
        let minX: number = Number.MAX_VALUE
        let minY: number = Number.MAX_VALUE
        let maxX: number = Number.MIN_VALUE
        let maxY: number = Number.MIN_VALUE
        selectedSiblings.forEach(n => {
            const x = getOriginalNodePositionX(n), y = getOriginalNodePositionY(n)
            if (x < minX) {
                minX = x
            }
            if (y < minY) {
                minY = y
            }
            if (x + n.size.width > maxX) {
                maxX = x + n.size.width
            }
            if (y + n.size.height > maxY) {
                maxY = y + n.size.height
            }
        })
        let x, y, width, height
        if (direction === Direction.LEFT || direction === Direction.RIGHT) {
            x = minX - boundingBoxMargin
            y = minY - boundingBoxMargin - approxNodeSpacing / 2
            width = maxX - minX + 2 * boundingBoxMargin
            height = maxY - minY + 2 * (boundingBoxMargin + approxNodeSpacing / 2)
        } else {
            x = minX - boundingBoxMargin - approxNodeSpacing / 2
            y = minY - boundingBoxMargin
            width = maxX - minX + 2 * (boundingBoxMargin + approxNodeSpacing / 2)
            height = maxY - minY + 2 * boundingBoxMargin
        }
        result = <g>{result}<rect
            x={x}
            y={y}
            width={width}
            height={height}
            stroke={color}
            fill='rgba(0,0,0,0)'
            strokeWidth={2 * boundingBoxMargin}
            style={{ 'stroke-dasharray': '4' }}>
        </rect></g>

        // Draw preview positions
        for (let i = 0; i < selectedSiblings.length - 1; i++) {
            let x1, y1, x2, y2;
            if (direction === Direction.LEFT || direction === Direction.RIGHT) {
                x1 = getOriginalNodePositionX(selectedSiblings[i]) + selectedSiblings[i].size.width / 2;
                y1 = getOriginalNodePositionY(selectedSiblings[i]) + selectedSiblings[i].size.height;
                x2 = getOriginalNodePositionX(selectedSiblings[i + 1]) + selectedSiblings[i + 1].size.width / 2;
                y2 = getOriginalNodePositionY(selectedSiblings[i + 1]);
            } else {
                x1 = getOriginalNodePositionX(selectedSiblings[i]) + selectedSiblings[i].size.width;
                y1 = getOriginalNodePositionY(selectedSiblings[i]) + selectedSiblings[i].size.height / 2;
                x2 = getOriginalNodePositionX(selectedSiblings[i + 1]);
                y2 = getOriginalNodePositionY(selectedSiblings[i + 1]) + selectedSiblings[i + 1].size.height / 2;
            }

            // Get middle coords between current and next sibling
            let middleX, middleY
            if (direction === Direction.LEFT || direction === Direction.RIGHT) {
                middleX = x1
                middleY = (y1 + y2) / 2
            } else {
                middleX = (x1 + x2) / 2
                middleY = y1
            }

            // Start point
            if (i === 0 && selectedSiblings[i].id !== selectedNode.id) {
                let x, y

                if (direction === Direction.LEFT || direction === Direction.RIGHT) {
                    x = x1
                    y = y1 - selectedSiblings[i].size.height - approxNodeSpacing / 4 - boundingBoxMargin / 2
                } else {
                    x = x1 - selectedSiblings[i].size.width - approxNodeSpacing / 4 - boundingBoxMargin / 2
                    y = y1
                }

                result = <g>{result}{renderCircle(i === highlightedIndex, x, y, false)}</g>;
            }

            // Intermediate points
            if (selectedSiblings[i].id !== selectedNode.id &&
                selectedSiblings[i + 1].id !== selectedNode.id)
                result = <g>{result}{renderCircle(i === highlightedIndex - 1, middleX, middleY, false)}</g>;

            // End point
            if (i === selectedSiblings.length - 2 && selectedSiblings[i + 1].id !== selectedNode.id) {
                let x, y;

                if (direction === Direction.LEFT || direction === Direction.RIGHT) {
                    x = x2
                    y = y2 + selectedSiblings[selectedSiblings.length - 1].size.height + approxNodeSpacing / 4 + boundingBoxMargin / 2
                } else {
                    x = x2 + selectedSiblings[selectedSiblings.length - 1].size.width + approxNodeSpacing / 4 + boundingBoxMargin / 2
                    y = y2
                }

                result = <g>{result}{renderCircle(highlightedIndex === -1, x, y, false)}</g>;
            }
        }
    }

    return result
}

/**
 * Renders a lock inside the node.
 * 
 * @param node The node with the constraint set.
 * @returns The VNode with the lock icon for the view.
 */
export function renderTreeConstraint(node: KNode): VNode {
    return <g>{renderLock(node.size.width + 2, -2)}</g>
}