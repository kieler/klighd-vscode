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
import { Action, MouseListener, SModelElement } from 'sprotty/lib';
import { isRendering, KAction, KContainerRendering, KGraphElement, KPolyline, KRendering, K_RENDERING_REF, Trigger } from '../kgraph-models';
import { PerformActionAction } from './actions';

/**
 * Mouse listener handling KLighD actions that can be defined on KGraphElements in the model.
 */
export class ActionListener extends MouseListener {
    mouseMoved: boolean = false

    doubleClick(target: SModelElement, event: WheelEvent): (Action | Promise<Action>)[] {
        // Ignore the event if the top level graph element is clicked, as that is not a KGraphElement.
        if (target.type !== 'graph') {
            return this.actions(target as KGraphElement, event, event.type)
        }
        return [];
    }

    mouseDown(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        this.mouseMoved = false
        return [];
    }

    mouseMove(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        this.mouseMoved = true
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        // counts as a click if the mouse has not moved since the last mouseDown event.
        if (!this.mouseMoved && target.type !== 'graph') {
            return this.actions(target as KGraphElement, event, 'click')
        }
        return [];
    }

    /**
     * Returns the actions defined on the target KGraphElement that should be performed with the given event.
     * @param target The KGraphElement under the mouse when this event is issued.
     * @param event The MouseEvent that triggered this listener.
     * @param eventType The event type of the event (e.g. 'dblclk', 'clk', etc.).
     */
    protected actions(target: KGraphElement, event: MouseEvent, eventType: string): (Action | Promise<Action>)[] {
        let actions: Action[] = []
        // Look up the ID of the semantic element that was clicked.
        const targetSvg = event.target
        if (targetSvg instanceof SVGElement) {
            const semanticElement = this.getSemanticElement(targetSvg)
            if (semanticElement === undefined) {
                return actions
            }
            const semanticElementId = semanticElement.id

            // Search the actions in the target element.
            const kActions = this.findActions(target, semanticElementId)

            if (kActions === undefined) {
                return actions
            }
            // For each kAction, return an ActionAction if the event matches the event in the kAction.
            kActions.forEach(action => {
                if (event.altKey === action.altPressed
                    && event.ctrlKey === action.ctrlCmdPressed
                    && event.shiftKey === action.shiftPressed
                    && this.eventsMatch(event, eventType, action.trigger)) {
                    actions.push(new PerformActionAction(action.actionId, target.id, semanticElementId))
                }
            })
        }
        return actions
    }

    /**
     * Returns the SVG element in the DOM that represents the topmost KRendering in the hierarchy.
     * @param element The topmost SVG element clicked.
     */
    protected getSemanticElement(element: SVGElement): SVGElement | undefined {
        let currentElement: Element | null = element
        let semanticElement = undefined
        while (semanticElement === undefined && currentElement instanceof SVGElement) {
            if (currentElement.id !== '') {
                semanticElement = currentElement
            } else {
                currentElement = currentElement.parentElement
            }
        }
        return semanticElement
    }

    /**
     * Finds the actions defined in the KGraphElement in its rendering with the given ID.
     * @param element The KGraphElement to look in.
     * @param id The ID of the KRendering within that KGraphElement.
     */
    protected findActions(element: KGraphElement, id: string): KAction[] {
        // The first rendering has to be extracted from the KGraphElement. It is the first data object that is a KRendering.
        let currentElement: KRendering = element.data.find(possibleRendering => { // TODO: We could be looking at a KRenderingRef!
            return isRendering(possibleRendering)
        }) as KRendering
        const idPath = id.split('$')
        if (currentElement.type === K_RENDERING_REF) {
            // KRenderingRefs' ids always start with the identifying name of the reference and may continue with $<something> to refer to renderings within that reference.
            // Start with index 1 since the currentElement already contains the rendering with the identifying name.
            // for (let i = 1; i < idPath.length; i++) {
            if (idPath.length > 1) {
                console.error('Actions in rendering references hierarchies are not supported yet.')
                return []
            }
        } else {
            // The rendering id always starts with rendering$R<number>$<something> and the first rendering is already found, so start with index 2 as two $ signs can be skipped.
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
        }
        // Now the currentElement should be the element searched for by the id.
        if (currentElement.id !== id) {
            console.error('The found element does not match the searched id! id: ' + id + ', found element: ' + currentElement)
            return []
        }
        return currentElement.actions
    }

    /**
     * Returns true if the event type and button match the trigger.
     * @param event The MouseEvent to check.
     * @param eventType The eventType of that MouseEvent
     * @param trigger The trigger to check against.
     */
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