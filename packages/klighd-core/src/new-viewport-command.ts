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
import {
    CenterCommand,
    CommandExecutionContext,
    CommandReturn,
    FitToScreenCommand,
    isViewport,
    SetViewportCommand,
    SModelElementImpl,
    SModelRootImpl,
    ViewportAnimation,
} from 'sprotty'
import { Viewport } from 'sprotty-protocol/lib/model'

// This file and all lines with references to this file can be removed once Sprotty accepts PR 510 https://github.com/eclipse-sprotty/sprotty/pull/510 and releases that change.
// Until then, this overwrites Sprotty's most important zoom animation behavior to apply the same change from this repo.

@injectable()
export class NewSetViewportCommand extends SetViewportCommand {
    protected setViewport(
        element: SModelElementImpl,
        oldViewport: Viewport,
        newViewport: Viewport,
        context: CommandExecutionContext
    ): CommandReturn {
        if (element && isViewport(element)) {
            if (this.action.animate) {
                return new NewViewportAnimation(element, oldViewport, newViewport, context).start()
            }
            element.scroll = newViewport.scroll
            element.zoom = newViewport.zoom
        }
        return context.root
    }
}

export class NewCenterCommand extends CenterCommand {
    override undo(context: CommandExecutionContext): CommandReturn {
        const model = context.root
        if (isViewport(model) && this.newViewport !== undefined && !this.equal(this.newViewport, this.oldViewport)) {
            if (this.animate)
                return new NewViewportAnimation(model, this.newViewport, this.oldViewport, context).start()

            model.scroll = this.oldViewport.scroll
            model.zoom = this.oldViewport.zoom
        }
        return model
    }

    override redo(context: CommandExecutionContext): CommandReturn {
        const model = context.root
        if (isViewport(model) && this.newViewport !== undefined && !this.equal(this.newViewport, this.oldViewport)) {
            if (this.animate) {
                return new NewViewportAnimation(model, this.oldViewport, this.newViewport, context).start()
            }
            model.scroll = this.newViewport.scroll
            model.zoom = this.newViewport.zoom
        }
        return model
    }
}

export class NewFitToScreenCommand extends FitToScreenCommand {
    override undo(context: CommandExecutionContext): CommandReturn {
        const model = context.root
        if (isViewport(model) && this.newViewport !== undefined && !this.equal(this.newViewport, this.oldViewport)) {
            if (this.animate)
                return new NewViewportAnimation(model, this.newViewport, this.oldViewport, context).start()

            model.scroll = this.oldViewport.scroll
            model.zoom = this.oldViewport.zoom
        }
        return model
    }

    override redo(context: CommandExecutionContext): CommandReturn {
        const model = context.root
        if (isViewport(model) && this.newViewport !== undefined && !this.equal(this.newViewport, this.oldViewport)) {
            if (this.animate) {
                return new NewViewportAnimation(model, this.oldViewport, this.newViewport, context).start()
            }
            model.scroll = this.newViewport.scroll
            model.zoom = this.newViewport.zoom
        }
        return model
    }
}

export class NewViewportAnimation extends ViewportAnimation {
    override tween(t: number, context: CommandExecutionContext): SModelRootImpl {
        const newZoom = this.newViewport.zoom
        const oldZoom = this.oldViewport.zoom
        const oldX = this.oldViewport.scroll.x
        const oldY = this.oldViewport.scroll.y
        const newX = this.newViewport.scroll.x
        const newY = this.newViewport.scroll.y

        const tweenZoom = oldZoom * (newZoom / oldZoom) ** t
        this.element.zoom = tweenZoom

        // The between scroll values need to satisfy this equation for a smooth zoom:
        // offset_left_tween / offset_left_total = offset_right_tween / offset_right_total
        // where the total offset is the offset between the old and new viewport, and the tween offset is the goal offset to be calculated for the between value.
        // A similar equation holds for the top/bottom offsets.
        // Given the exponential behavior of the zoom between values, the actual width and height of the viewport, which we do not have available here,
        // cancel out when simplifying and solving the equation by the between value for x and y. This results in this calculation.
        const interimZoomDiff = 1 - oldZoom / tweenZoom
        const zoomDiff = 1 - oldZoom / newZoom

        this.element.scroll = {
            x: oldX + (interimZoomDiff * (newX - oldX)) / zoomDiff,
            y: oldY + (interimZoomDiff * (newY - oldY)) / zoomDiff,
        }
        return context.root
    }
}
