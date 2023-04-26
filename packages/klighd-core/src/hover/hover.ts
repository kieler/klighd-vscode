/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2023 by
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
import { SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes';
import { injectable } from 'inversify';
import { HoverMouseListener, SModelElement } from 'sprotty';
import { Action, Bounds, generateRequestId, RequestPopupModelAction } from "sprotty-protocol";
import { getSemanticElement } from '../skgraph-utils';

/**
 * Triggered when the user hovers the mouse pointer over an element to get a popup with details on
 * that element. This action is sent from the client to the model source, e.g. a DiagramServer.
 * The response is a SetPopupModelAction.
 */
export interface RequestKlighdPopupModelAction extends RequestPopupModelAction {
    /** The SVG element of the rendering (i.e. the KRendering) to request the popup for. */
    element: SVGElement
    /** The underlying graph element for this popup request. */
    parent: SModelElement
}

export namespace RequestKlighdPopupModelAction {
    export function create(
        element: SVGElement,
        parent: SModelElement,
        bounds: Bounds): RequestKlighdPopupModelAction {
        return {
            kind: RequestPopupModelAction.KIND,
            parent,
            element,
            elementId: parent.id,
            bounds,
            requestId: generateRequestId(),
        };
    }

    /** Type predicate to narrow an action to this action. */
    export function isThisAction(action: Action): action is RequestKlighdPopupModelAction {
        return action.kind === RequestPopupModelAction.KIND && 'parent' in action && 'element' in action;
    }
}

@injectable()
export class KlighdHoverMouseListener extends HoverMouseListener {
    protected startMouseOverTimer(target: SModelElement, event: MouseEvent): Promise<Action> {
        this.stopMouseOverTimer();
        return new Promise((resolve) => {
            this.state.mouseOverTimer = window.setTimeout(() => {
                const popupBounds = this.computePopupBounds(target, {x: event.pageX, y: event.pageY})
                const semanticElement = getSemanticElement(target as SKGraphElement, event.target)

                if (semanticElement) {
                    resolve(RequestKlighdPopupModelAction.create(semanticElement, target, popupBounds))

                    this.state.popupOpen = true;
                    this.state.previousPopupElement = target;
                }
            }, this.options.popupOpenDelay);
        })
    }
}