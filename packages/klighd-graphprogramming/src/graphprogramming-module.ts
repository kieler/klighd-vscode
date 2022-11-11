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
import { TYPES, MouseListener, IContextMenuService } from 'sprotty';
import { graphprogrammingMouseListener } from './contextmenu/klightd-graphprogMouseListener'; 
import { DeleteContextMenuItemProvider } from './menuproviders/menuproviders';
import { ContextMenueProvider } from './contextmenu/klightd-contextmenuprovider';


/**
 * Bindings for the interactive mouse listener.
 */
export const graphprogrammingModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    // const context = { bind, unbind, isBound, rebind }
    // TODO: same as the one in sprotty but sprottys throws errors 
    bind(TYPES.IContextMenuServiceProvider).toProvider<IContextMenuService>(ctx => {
        return () => {
            return new Promise<IContextMenuService>((resolve, reject) => {
                if (ctx.container.isBound(TYPES.IContextMenuService)) {
                    resolve(ctx.container.get<IContextMenuService>(TYPES.IContextMenuService));
                } else {
                    reject();
                }
            });
        };
    });

    bind(graphprogrammingMouseListener).toSelf().inSingletonScope()
    bind(TYPES.MouseListener).toService(graphprogrammingMouseListener)
    bind(MouseListener).toService(graphprogrammingMouseListener)

    bind(TYPES.IContextMenuService).to(ContextMenueProvider);  
    bind(TYPES.IContextMenuProviderRegistry).to(DeleteContextMenuItemProvider);

    // bind(EditingPanel).toSelf().inSingletonScope();
    // bind(DISymbol.SidebarPanel).toService(EditingPanel);
});

export default graphprogrammingModule;
