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
    return result
}