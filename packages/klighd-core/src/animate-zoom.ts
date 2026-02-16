/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2026 by
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
import { SModelElementImpl, ZoomMouseListener, findParentByFeature, isViewport } from 'sprotty'
import { Action, SetViewportAction } from 'sprotty-protocol'
/* global WheelEvent */

@injectable()
/**
 * This copies and extends the ZoomMouseListener class from Sprotty, but with the
 * wheel method changed to animate the zoom action.
 */
export class AnimateZoomMouseListener extends ZoomMouseListener {
    override wheel(target: SModelElementImpl, event: WheelEvent): Action[] {
        const viewport = findParentByFeature(target, isViewport)
        if (!viewport) {
            return []
        }
        const newViewport = this.isScrollMode(event)
            ? this.processScroll(viewport, event)
            : this.processZoom(viewport, target, event)
        if (newViewport) {
            return [SetViewportAction.create(viewport.id, newViewport, { animate: true })]
        }
        return []
    }
}
