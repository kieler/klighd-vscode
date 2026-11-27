import { Action } from 'sprotty-protocol'
import { InteractionEvent } from '../core/event'

export type SprottyEventData = SprottyMouseEvent | SprottyKeyEvent | SprottyActionEvent

export interface SprottyEvent extends InteractionEvent {
    type: 'sprotty'
    data: SprottyEventData
}

export interface SprottyEventTarget {
    id: string
    type: string
    revision?: number
}

export interface SprottyMouseEvent {
    type: 'mouse'
    mouseEventType: string
    target: SprottyEventTarget
    button: number
    clientX: number
    clientY: number
    altKey: boolean
    ctrlKey: boolean
    shiftKey: boolean
    metaKey: boolean
    deltaX?: number
    deltaY?: number
}

export interface SprottyKeyEvent {
    type: 'key'
    keyEventType: 'keyDown' | 'keyUp'
    target: SprottyEventTarget
    key: string
    code: string
    repeat: boolean
    altKey: boolean
    ctrlKey: boolean
    shiftKey: boolean
    metaKey: boolean
}

export interface SprottyActionEvent {
    type: 'action'
    actionKind: string
    /** Complete JSON-safe action payload, including full model snapshots in model-setting and model-updating actions. */
    action: Action
}
