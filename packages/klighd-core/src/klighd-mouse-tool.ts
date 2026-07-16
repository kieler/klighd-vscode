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

import { injectable } from 'inversify'
import { VNode } from 'snabbdom'
import { MouseListener, MouseTool, SModelElementImpl, SModelRootImpl, on } from 'sprotty'
import { PROXY_SUFFIX, isProxy } from './proxy-view/proxy-view-util'
/* global Element, MouseEvent, WheelEvent */

@injectable()
/**
 * This copies and extends the MouseTool class from Sprotty, but with the
 * decorate method changed to also add mouse listeners to proxy nodes.
 */
export class KlighdMouseTool extends MouseTool {
    decorate(vnode: VNode, element: SModelElementImpl): VNode {
        if (element instanceof SModelRootImpl || isProxy(vnode)) {
            const root = element as SModelRootImpl
            on(vnode, 'mouseover', (event) => this.mouseOver(root, event as MouseEvent))
            on(vnode, 'mouseout', (event) => this.mouseOut(root, event as MouseEvent))
            on(vnode, 'mouseenter', (event) => this.mouseEnter(root, event as MouseEvent))
            on(vnode, 'mouseleave', (event) => this.mouseLeave(root, event as MouseEvent))
            on(vnode, 'mousedown', (event) => this.mouseDown(root, event as MouseEvent))
            on(vnode, 'mouseup', (event) => this.mouseUp(root, event as MouseEvent))
            on(vnode, 'mousemove', (event) => this.mouseMove(root, event as MouseEvent))
            on(vnode, 'wheel', (event) => this.wheel(root, event as WheelEvent))
            on(vnode, 'contextmenu', (event) => this.contextMenu(root, event as MouseEvent))
            on(vnode, 'dblclick', (event) => this.doubleClick(root, event as MouseEvent))
        }
        vnode = this.mouseListeners.reduce((n: VNode, listener: MouseListener) => listener.decorate(n, element), vnode)
        return vnode
    }

    getTargetElement(model: SModelRootImpl, event: MouseEvent): SModelElementImpl | undefined {
        let target = event.target as Element
        const { index } = model
        while (target) {
            if (target.id) {
                let nodeId = this.domHelper.findSModelIdByDOMElement(target)
                if (nodeId.endsWith(PROXY_SUFFIX)) {
                    nodeId = nodeId.substring(0, nodeId.length - PROXY_SUFFIX.length)
                } else {
                    nodeId = this.domHelper.findSModelIdByDOMElement(target)
                }
                const element = index.getById(nodeId)
                if (element !== undefined) return element
            }
            target = target.parentNode as Element
        }
        return undefined
    }
}
