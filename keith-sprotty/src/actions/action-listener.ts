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
import { isContainerRendering, isRendering, KAction, KGraphElement, KPolyline, KRendering, K_POLYLINE, K_RENDERING_REF, ModifierState, Trigger } from '../kgraph-models';
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
        if (!this.mouseMoved && target.type !== 'graph' && target.type !== 'NONE') {
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
                if (this.modifierStateMatches(action.altPressed, event.altKey)
                    && this.modifierStateMatches(action.ctrlCmdPressed, event.ctrlKey)
                    && this.modifierStateMatches(action.shiftPressed, event.shiftKey)
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
        let currentElement: KRendering = element.data.find(possibleRendering => {
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
            // The rendering id is build hierarchically and the first rendering is already found, so start with index 1 as a $ sign can be skipped.
            for (let i = 1; i < idPath.length; i++) {
                let nextElement
                if (isContainerRendering(currentElement)) {
                    // First, look for the ID in the child renderings.
                    nextElement = currentElement.children.find(childRendering => {
                        return id.startsWith(childRendering.id)
                    }) as KRendering
                }
                if (nextElement === undefined && currentElement.type === K_POLYLINE) {
                    // If the rendering was not found yet, take the junction point rendering.
                    if (id.startsWith((currentElement as KPolyline).junctionPointRendering.id)) {
                        nextElement = (currentElement as KPolyline).junctionPointRendering
                    }
                } if (nextElement === undefined) {
                    console.error(id + ' can not be found in the renderings of the element:')
                    console.error(element)
                    return []
                }
                currentElement = nextElement
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
     * Returns if the acutal pressed state of a key matches the expected modifier state of any action.
     * @param state The modifier state to match against.
     * @param pressed The actual key pressed value.
     */
    private modifierStateMatches(state: ModifierState, pressed: boolean) {
        switch (state) {
            case ModifierState.DONT_CARE: {
                return true
            }
            case ModifierState.NOT_PRESSED: {
                return !pressed
            }
            case ModifierState.PRESSED: {
                return pressed
            }
        }
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