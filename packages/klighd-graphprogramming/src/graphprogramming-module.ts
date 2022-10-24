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
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { ContainerModule } from 'inversify';
import { TYPES, MouseListener } from 'sprotty';
import { graphprogrammingMouseListener } from './klightd-graphprogMouseListener'; 
import { DeleteContextMenuItemProvider } from './menuproviders';
//import { ContextMenueProvider } from './klightd-contextmenuprovider';

/**
 * Bindings for the interactive mouse listener.
 */
export const graphprogrammingModule = new ContainerModule((bind, _unbind, isBound) => {
    bind(graphprogrammingMouseListener).toSelf().inSingletonScope()
    bind(TYPES.MouseListener).toService(graphprogrammingMouseListener)
    bind(MouseListener).toService(graphprogrammingMouseListener)

    //bind(TYPES.IContextMenuService).to(ContextMenueProvider);  
    bind(TYPES.IContextMenuProviderRegistry).to(DeleteContextMenuItemProvider);
});

export default graphprogrammingModule;
