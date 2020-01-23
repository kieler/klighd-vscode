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
import { RefreshLayoutAction } from '../actions';
import { RectPackSetPositionConstraintAction } from './actions';
import { getAbsoluteBounds, translate } from 'sprotty';

export function setGenerateRectPackAction(nodes: KNode[], target: KNode, event: MouseEvent) {
    // Check containment of event.x, event,y in each node that is not the targetNode
    // const targetBounds = getAbsoluteBounds(target)
    // const canvasBounds = target.root.canvasBounds;
    // const boundsInWindow = translate(targetBounds, canvasBounds);
    let index = 0
    let result = new RefreshLayoutAction()
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
                    // FIXME determine actual position
                    const actualPosition = index
                    if (actualPosition !== target.properties.desiredPosition) {
                        result = new RectPackSetPositionConstraintAction(
                            {id: target.id, order: actualPosition}
                        )
                    }
                }
        }
        index++
    });
    return result
}