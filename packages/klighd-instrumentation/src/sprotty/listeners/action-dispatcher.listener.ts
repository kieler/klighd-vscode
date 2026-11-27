import { inject, injectable } from 'inversify'
import { ActionDispatcher, InitializeCanvasBoundsAction } from 'sprotty'
import { Action, GetViewportAction } from 'sprotty-protocol'

import { SprottyProducer } from '../sprotty.producer'

@injectable()
export class SprottyActionDispatcher extends ActionDispatcher {
    constructor(@inject(SprottyProducer) private readonly producer: SprottyProducer) {
        super()
    }

    override async dispatch(action: Action): Promise<void> {
        this.producer.action(action)
        await super.dispatch(action)

        // Whenever an action to initialise the canvas bounds has occurred, we want to "snapshot"
        // the current viewport size.
        if (action.kind === InitializeCanvasBoundsAction.KIND) {
            await this.request(GetViewportAction.create())
        }
    }
}
