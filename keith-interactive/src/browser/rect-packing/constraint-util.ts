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

import { KNode } from '../constraint-classes';
import { RefreshDiagramAction } from '../actions';
import { RectPackSetPositionConstraintAction, SetAspectRatioAction } from './actions';
import { getAbsoluteBounds, translate } from 'sprotty';

export function setGenerateRectPackAction(nodes: KNode[], target: KNode, parent: KNode | undefined, event: MouseEvent) {
    let result = new RefreshDiagramAction()
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
                    // How the position should be calculated FIXME currentPosition is -1
                    const actualPosition = node.properties.currentPosition
                    if (actualPosition !== target.properties.currentPosition && actualPosition !== -1) {
                        result = new RectPackSetPositionConstraintAction(
                            {id: target.id, order: actualPosition}
                        )
                    }
                }
        }
    });
    if (result instanceof RefreshDiagramAction) {

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
        if (parent && parent.properties.aspectRatio !== aspectRatio) {
            return new SetAspectRatioAction({
                id: parent.id,
                aspectRatio: aspectRatio
            })
        }
    }
    return result
}