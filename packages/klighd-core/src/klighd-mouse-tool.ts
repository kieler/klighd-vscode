/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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

import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { MouseListener, MouseTool, SModelElement, SModelRoot, on } from 'sprotty';
import { PROXY_SUFFIX, isProxy } from './proxy-view/proxy-view-util';

@injectable()
/**
 * This copies and extends the MouseTool class from Sprotty, but with the
 * decorate method changed to also add mouse listeners to proxy nodes.
 */
export class KlighdMouseTool extends MouseTool {

    decorate(vnode: VNode, element: SModelElement): VNode {
        if (element instanceof SModelRoot || isProxy(vnode)) {
            on(vnode, 'mouseover', this.mouseOver.bind(this, element))
            on(vnode, 'mouseout', this.mouseOut.bind(this, element))
            on(vnode, 'mouseenter', this.mouseEnter.bind(this, element))
            on(vnode, 'mouseleave', this.mouseLeave.bind(this, element))
            on(vnode, 'mousedown', this.mouseDown.bind(this, element))
            on(vnode, 'mouseup', this.mouseUp.bind(this, element))
            on(vnode, 'mousemove', this.mouseMove.bind(this, element))
            on(vnode, 'wheel', this.wheel.bind(this, element))
            on(vnode, 'contextmenu', this.contextMenu.bind(this, element))
            on(vnode, 'dblclick', this.doubleClick.bind(this, element))
        }
        vnode = this.mouseListeners.reduce(
            (n: VNode, listener: MouseListener) => listener.decorate(n, element),
            vnode)
        return vnode
    }

    getTargetElement(model: SModelRoot, event: MouseEvent): SModelElement | undefined {
        let target = event.target as Element
        const index = model.index
        while (target) {
            if (target.id) {
                let nodeId = this.domHelper.findSModelIdByDOMElement(target)
                if (nodeId.endsWith(PROXY_SUFFIX)) {
                    nodeId = nodeId.substring(0, nodeId.length - PROXY_SUFFIX.length)
                } else {
                    nodeId = this.domHelper.findSModelIdByDOMElement(target)
                }
                const element = index.getById(nodeId)
                if (element !== undefined)
                    return element
            }
            target = target.parentNode as Element
        }
        return undefined;
    }

}