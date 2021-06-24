/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018-2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import { Action, MouseListener, SModelElement } from 'sprotty/lib';
import { KAction, ModifierState, SKGraphElement, Trigger } from '../skgraph-models';
import { findRendering, getSemanticElement } from '../skgraph-utils';
import { PerformActionAction } from './actions';

/**
 * Mouse listener handling KLighD actions that can be defined on SKGraphElements in the model.
 */
export class ActionListener extends MouseListener {
    mouseMoved: boolean = false

    doubleClick(target: SModelElement, event: WheelEvent): (Action | Promise<Action>)[] {
        // Ignore the event if the top level graph element is clicked, as that is not a SKGraphElement.
        if (target.type !== 'graph') {
            return this.actions(target as SKGraphElement, event, event.type)
        }
        return [];
    }

    mouseDown(): (Action | Promise<Action>)[] {
        this.mouseMoved = false
        return [];
    }

    mouseMove(): (Action | Promise<Action>)[] {
        this.mouseMoved = true
        return [];
    }

    mouseUp(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        // counts as a click if the mouse has not moved since the last mouseDown event.
        if (!this.mouseMoved && target.type !== 'graph' && target.type !== 'NONE') {
            return this.actions(target as SKGraphElement, event, 'click')
        }
        return [];
    }

    /**
     * Returns the actions defined on the target SKGraphElement that should be performed with the given event.
     * @param target The SKGraphElement under the mouse when this event is issued.
     * @param event The MouseEvent that triggered this listener.
     * @param eventType The event type of the event (e.g. 'dblclk', 'clk', etc.).
     */
    protected actions(target: SKGraphElement, event: MouseEvent, eventType: string): (Action | Promise<Action>)[] {
        const actions: Action[] = []
        // Look up the ID of the semantic element that was clicked.
        const semanticElement = getSemanticElement(event.target)
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
                actions.push(new PerformActionAction(action.actionId, target.id, semanticElementId, target.root.revision))
            }
        })
        return actions
    }

    /**
     * Finds the actions defined in the SKGraphElement in its rendering with the given ID.
     * @param element The SKGraphElement to look in.
     * @param id The ID of the KRendering within that SKGraphElement.
     */
    protected findActions(element: SKGraphElement, id: string): KAction[] {
        const rendering = findRendering(element, id)
        if (rendering) {
            return rendering.actions
        } else {
            return []
        }
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