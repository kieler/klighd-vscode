import { inject, injectable } from 'inversify'
import { KeyListener, SModelElementImpl } from 'sprotty'
import { Action } from 'sprotty-protocol'

import { SprottyProducer } from '../sprotty.producer'

/* global KeyboardEvent */

@injectable()
export class SprottyKeyListener extends KeyListener {
    constructor(@inject(SprottyProducer) private readonly producer: SprottyProducer) {
        super()
    }

    override keyDown(target: SModelElementImpl, event: KeyboardEvent): Action[] {
        this.producer.key('keyDown', target, event)
        return super.keyDown(target, event)
    }

    override keyUp(target: SModelElementImpl, event: KeyboardEvent): Action[] {
        this.producer.key('keyUp', target, event)
        return super.keyUp(target, event)
    }
}
