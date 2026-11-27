import {
    Action,
    ComputedBoundsAction,
    GetViewportAction,
    RequestBoundsAction,
    RequestModelAction,
    SetBoundsAction,
    SetModelAction,
    SetViewportAction,
    UpdateModelAction,
    ViewportResult,
} from 'sprotty-protocol'
import { InitializeCanvasBoundsAction, SModelElementImpl } from 'sprotty'

import { Collector } from '../core/collector'
import { SprottyEvent, SprottyEventData, SprottyEventTarget, SprottyMouseEvent } from './sprotty.event'
import { Clock } from '../core/time'

/* global KeyboardEvent, MouseEvent, WheelEvent */

/**
 * Collects Sprotty interactions without changing how the diagram handles them.
 */
export class SprottyProducer {
    constructor(
        private readonly clock: Clock,
        private collector?: Collector
    ) {}

    setCollector(collector: Collector | undefined): void {
        this.collector = collector
    }

    get isRecording(): boolean {
        return this.collector !== undefined
    }

    mouse(eventType: string, target: SModelElementImpl, event: MouseEvent | WheelEvent): void {
        if (!this.isRecording) {
            return
        }

        const sprottyEvent: SprottyMouseEvent = {
            type: 'mouse',
            mouseEventType: eventType,
            target: this.targetOf(target),
            button: event.button,
            clientX: event.clientX,
            clientY: event.clientY,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
        }

        if (event instanceof WheelEvent) {
            sprottyEvent.deltaX = event.deltaX
            sprottyEvent.deltaY = event.deltaY
        }

        this.collect(sprottyEvent)
    }

    key(eventType: 'keyDown' | 'keyUp', target: SModelElementImpl, event: KeyboardEvent): void {
        if (!this.isRecording) {
            return
        }

        this.collect({
            type: 'key',
            keyEventType: eventType,
            target: this.targetOf(target),
            key: event.key,
            code: event.code,
            repeat: event.repeat,
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            metaKey: event.metaKey,
        })
    }

    action(action: Action): void {
        if (!this.isRecording) {
            return
        }

        const supportedActions = new Set([
            RequestModelAction.KIND,
            // Todo for SetModel: we don't need the "children" subkey?
            SetModelAction.KIND,
            UpdateModelAction.KIND,
            SetViewportAction.KIND,
            SetBoundsAction.KIND,
            RequestBoundsAction.KIND,
            ComputedBoundsAction.KIND,
            GetViewportAction.KIND,
            ViewportResult.KIND,
            InitializeCanvasBoundsAction.KIND,
        ])

        if (supportedActions.has(action.kind)) {
            this.collect({
                type: 'action',
                actionKind: action.kind,
                action,
            })
        }
    }

    private collect(event: SprottyEventData): void {
        this.collector?.collect<SprottyEvent>({
            schemaVersion: 1,
            type: 'sprotty',
            occurredAt: this.clock.now(),
            data: event,
        })
    }

    private targetOf(element: SModelElementImpl): SprottyEventTarget {
        return {
            id: element.id,
            type: element.type,
            revision: element.root.revision,
        }
    }
}
