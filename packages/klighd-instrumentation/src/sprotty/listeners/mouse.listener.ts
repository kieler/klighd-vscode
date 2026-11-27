import { inject, injectable } from 'inversify'
import { MouseListener, SModelElementImpl } from 'sprotty'
import { Action } from 'sprotty-protocol'

import { SprottyProducer } from '../sprotty.producer'

/* global MouseEvent, WheelEvent */

@injectable()
export class SprottyMouseListener extends MouseListener {
    constructor(@inject(SprottyProducer) private readonly producer: SprottyProducer) {
        super()
    }

    override mouseOver(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.producer.mouse('mouseOver', target, event)
        return super.mouseOver(target, event)
    }

    override mouseOut(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.producer.mouse('mouseOut', target, event)
        return super.mouseOut(target, event)
    }

    override mouseEnter(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.producer.mouse('mouseEnter', target, event)
        return super.mouseEnter(target, event)
    }

    override mouseLeave(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.producer.mouse('mouseLeave', target, event)
        return super.mouseLeave(target, event)
    }

    override mouseDown(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.producer.mouse('mouseDown', target, event)
        return super.mouseDown(target, event)
    }

    override mouseMove(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.producer.mouse('mouseMove', target, event)
        return super.mouseMove(target, event)
    }

    override mouseUp(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.producer.mouse('mouseUp', target, event)
        return super.mouseUp(target, event)
    }

    override wheel(target: SModelElementImpl, event: WheelEvent): (Action | Promise<Action>)[] {
        this.producer.mouse('wheel', target, event)
        return super.wheel(target, event)
    }

    override doubleClick(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.producer.mouse('doubleClick', target, event)
        return super.doubleClick(target, event)
    }

    override contextMenu(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.producer.mouse('contextMenu', target, event)
        return super.contextMenu(target, event)
    }

    override dragOver(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.producer.mouse('dragOver', target, event)
        return super.dragOver(target, event)
    }

    override drop(target: SModelElementImpl, event: MouseEvent): (Action | Promise<Action>)[] {
        this.producer.mouse('drop', target, event)
        return super.drop(target, event)
    }
}
