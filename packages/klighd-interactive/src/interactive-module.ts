/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { ContainerModule } from 'inversify';
import { TYPES, configureCommand, MoveCommand, LocationPostprocessor, MoveMouseListener } from 'sprotty';
import { KlighdInteractiveMouseListener } from './klighd-interactive-mouselistener';

/**
 * Bindings for the interactive mouse listener.
 */
export const interactiveModule = new ContainerModule((bind, _unbind, isBound) => {
    bind(KlighdInteractiveMouseListener).toSelf().inSingletonScope()
    bind(TYPES.MouseListener).toService(KlighdInteractiveMouseListener)
    bind(MoveMouseListener).toService(KlighdInteractiveMouseListener)
    configureCommand({ bind, isBound }, MoveCommand);
    bind(TYPES.IVNodePostprocessor).to(LocationPostprocessor);
    bind(TYPES.HiddenVNodePostprocessor).to(LocationPostprocessor);
});

export default interactiveModule;
