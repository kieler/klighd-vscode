import { ContainerModule } from 'inversify'
import { TYPES } from 'sprotty'

import { SprottyProducer } from './sprotty.producer'
import { SprottyMouseListener } from './listeners/mouse.listener'
import { SprottyKeyListener } from './listeners/key.listener'
import { SprottyActionDispatcher } from './listeners/action-dispatcher.listener'

export function createSprottyModule(producer: SprottyProducer): ContainerModule {
    return new ContainerModule((bind, _unbind, _isBound, rebind) => {
        bind(SprottyProducer).toConstantValue(producer)

        bind(SprottyMouseListener).toSelf().inSingletonScope()
        bind(TYPES.MouseListener).toService(SprottyMouseListener)

        bind(SprottyKeyListener).toSelf().inSingletonScope()
        bind(TYPES.KeyListener).toService(SprottyKeyListener)

        rebind(TYPES.IActionDispatcher).to(SprottyActionDispatcher).inSingletonScope()
    })
}
