/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import { MouseListener, Action } from "sprotty/lib"
import { Trigger, KAction, KGraphElement, isRendering, KRendering, KContainerRendering, KPolyline } from "../kgraph-models"
import { PerformActionAction } from "./actions";

export class ActionListener extends MouseListener {
    mouseMoved: boolean = false

    doubleClick(target: KGraphElement, event: WheelEvent): (Action | Promise<Action>)[] {
        return this.actions(target, event, event.type)
    }

    mouseDown(target: KGraphElement, event: MouseEvent): (Action | Promise<Action>)[] {
        this.mouseMoved = false
        return [];
    }

    mouseMove(target: KGraphElement, event: MouseEvent): (Action | Promise<Action>)[] {
        this.mouseMoved = true
        return [];
    }

    mouseUp(target: KGraphElement, event: MouseEvent): (Action | Promise<Action>)[] {
        // counts as a click if the mouse has not moved since the last mouseDown event.
        if (!this.mouseMoved) {
            return this.actions(target, event, 'click')
        }
        return [];
    }

    protected actions(target: KGraphElement, event: MouseEvent, eventType: string): (Action | Promise<Action>)[] {
        // Look up the ID of the semantic element that was clicked.
        const semanticElementId = this.getSemanticElement(event.target as Element).id

        // Search the actions in the target element.
        const kActions = this.findActions(target, semanticElementId)

        let actions: Action[] = []
        if (kActions === undefined) {
            return actions
        }
        // For each kAction, return a ActionAction if the event matches the event in the kAction.
        kActions.forEach(action => {
            if (event.altKey === action.altPressed
                && event.ctrlKey === action.ctrlCmdPressed
                && event.shiftKey === action.shiftPressed
                && this.eventsMatch(event, eventType, action.trigger)) {
                    actions.push(new PerformActionAction(action.actionId, target.id + '$' + semanticElementId))
                }
        })
        return actions
    }

    protected getSemanticElement(element: Element): Element {
        let semanticElement = undefined
        while (semanticElement === undefined) {
            if (element.id !== '') {
                semanticElement = element
            } else {
                element = element.parentElement as Element
            }
        }
        return semanticElement
    }

    protected findActions(element: KGraphElement, id: string): KAction[] {
        // The first rendering has to be extracted from the KGraphElement. It is the first data object that is a KRendering.
        let currentElement: KRendering = element.data.find(possibleRendering => { // TODO: We could be looking at a KRenderingRef!
            return isRendering(possibleRendering)
        }) as KRendering
        const idPath = id.split('$')
        // The rendering id always starts with rendering$R[number]$[something] and the first rendering is already found, so start with index 2 as two $ signs can be skipped.
        for (let i = 2; i < idPath.length; i++) {
            if (idPath[i].startsWith('R')) {
                // Take the child rendering whose ID is the prefix if the searched ID.
                currentElement = (currentElement as KContainerRendering).children.find(childRendering => {
                    return id.startsWith(childRendering.id)
                }) as KRendering
            } else if (idPath[i].startsWith('J')) {
                // Take the junction point rendering
                currentElement = (currentElement as KPolyline).junctionPointRendering
            } else {
                console.error('Misformed rendering id found: ' + id)
            }
            if (currentElement === undefined) {
                console.error(id + ' can not be found in the renderings of the element: ' + element)
                return []
            }
        }
        // Now the currentElement should be the element searched for by the id.
        if (currentElement.id !== id) {
            console.error('The found element does not match the searched id! id: ' + id + ', found element: ' + currentElement)
            return []
        }
        return currentElement.actions
    }

    protected eventsMatch(event: MouseEvent, eventType: string, trigger: Trigger): boolean {
        switch (trigger) {
            case Trigger.SINGLECLICK: {
                return eventType === 'click' && event.button === 0
            }
            case Trigger.DOUBLECLICK: {
                return eventType === 'dblclick' && event.button === 0
            }
            case Trigger.SINGLE_OR_MULTICLICK: {
                return (eventType === 'click' || eventType === 'dblclick') && event.button === 0
            }
            case Trigger.MIDDLE_SINGLECLICK: {
                return eventType === 'click' && event.button === 1
            }
            case Trigger.MIDDLE_DOUBLECLICK: {
                return eventType === 'dblclick' && event.button === 1
            }
            case Trigger.MIDDLE_SINGLE_OR_MULTICLICK: {
                return (eventType === 'click' || eventType === 'dblclick') && event.button === 1
            }
        }
    }
}