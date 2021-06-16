/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import { injectable } from 'inversify';
import { Action, Bounds, HoverMouseListener, RequestPopupModelAction, SModelElement } from 'sprotty';
import { getSemanticElement } from '../skgraph-utils';

/**
 * Triggered when the user hovers the mouse pointer over an element to get a popup with details on
 * that element. This action is sent from the client to the model source, e.g. a DiagramServer.
 * The response is a SetPopupModelAction.
 */
export class RequestKeithPopupModelAction extends RequestPopupModelAction {

    constructor(public readonly element: SVGElement,
                public readonly parent: SModelElement,
                public readonly bounds: Bounds,
                public readonly requestId = '') {
                    super(parent.id, bounds, requestId)
                }
}

@injectable()
export class KeithHoverMouseListener extends HoverMouseListener {
    protected startMouseOverTimer(target: SModelElement, event: MouseEvent): Promise<Action> {
        this.stopMouseOverTimer();
        return new Promise((resolve) => {
            this.state.mouseOverTimer = window.setTimeout(() => {
                const popupBounds = this.computePopupBounds(target, {x: event.pageX, y: event.pageY})
                const semanticElement = getSemanticElement(event.target)

                if (semanticElement) {
                    resolve(new RequestKeithPopupModelAction(semanticElement, target, popupBounds))

                    this.state.popupOpen = true;
                    this.state.previousPopupElement = target;
                }
            }, this.options.popupOpenDelay);
        })
    }
}