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

import { getAbsoluteBounds, translate } from 'sprotty';
import { RectPackSetPositionConstraintAction, SetAspectRatioAction } from './actions';
import { RefreshDiagramAction } from '../actions';
import { KNode } from '../constraint-classes';

/**
 * Generate the correct action for the target node released at the specific position.
 * @param nodes The nodes of the graph in that hierarchy level.
 * @param target The moved node.
 * @param parent The parent node.
 * @param event The mouse released event.
 */
export function setGenerateRectPackAction(nodes: KNode[], target: KNode, parent: KNode | undefined, event: MouseEvent): SetAspectRatioAction | RefreshDiagramAction {
    // If node is not put to a valid position the diagram will be refreshed.
    let result = new RefreshDiagramAction()
    // If the node is moved on top of another node it takes its place.
    nodes.forEach(node => {
        if (node.id !== target.id) {
            const targetBounds = getAbsoluteBounds(node)
            const canvasBounds = target.root.canvasBounds;
            const boundsInWindow = translate(targetBounds, canvasBounds);
            const lowX = boundsInWindow.x
            const lowY = boundsInWindow.y
            const highX = boundsInWindow.x + boundsInWindow.width
            const highY = boundsInWindow.y + boundsInWindow.height
            if (event.pageX > lowX && event.pageX < highX
                && event.pageY > lowY && event.pageY < highY) {
                    let actualPosition = node.properties.currentPosition
                    if (node.properties.desiredPosition !== -1) {
                        actualPosition = node.properties.desiredPosition
                    }
                    let actualTargetPosition = target.properties.currentPosition
                    if (node.properties.desiredPosition !== -1) {
                        actualTargetPosition = target.properties.desiredPosition
                    }
                    if (actualPosition !== actualTargetPosition && actualPosition !== -1) {
                        result = new RectPackSetPositionConstraintAction(
                            {id: target.id, order: actualPosition}
                        )
                    }
                }
        }
    });
    if (result instanceof RefreshDiagramAction) {
        // Case node should not be swapped.

        // Calculate aspect ratio.
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
        const aspectRatio = (maxX - x) / (maxY - y)

        // If changed update aspect ratio.
        if (parent && parent.properties.aspectRatio !== aspectRatio) {
            return new SetAspectRatioAction({
                id: parent.id,
                aspectRatio: aspectRatio
            })
        }
    }
    return result
}