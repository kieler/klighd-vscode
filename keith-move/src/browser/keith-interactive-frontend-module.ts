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

import './keith-icons';
import '../src/browser/style/index.css';

import { ContainerModule } from 'inversify';
import { KeithInteractiveMouseListener } from './keith-interactive-mouselistener';
import { InteractiveMouseListener } from '@kieler/keith-interactive/lib/interactive-mouselistener';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(KeithInteractiveMouseListener).toSelf().inSingletonScope()
    bind(InteractiveMouseListener).toService(KeithInteractiveMouseListener)
});