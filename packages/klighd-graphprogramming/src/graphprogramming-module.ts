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
import { TYPES, MouseListener, ContextMenuProviderRegistry, IContextMenuService } from 'sprotty';

import { graphprogrammingMouseListener } from './contextmenu/klightd-graphprogMouseListener';

import { ContextMenueProvider } from './contextmenu/klightd-contextmenuprovider';

import { GetIOContextMenuItemProvider } from './Commands_Providers/input_output';
import { GetNodesContextMenuItemProvider } from './Commands_Providers/Node';
import { GetEdgesContextMenuItemProvider } from './Commands_Providers/Edge';
import { GetRegionContextMenuItemProvider } from './Commands_Providers/Region';


/**
 * Bindings for the interactive mouse listener.
 */
export const graphprogrammingModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    // const context = { bind, unbind, isBound, rebind }
    // basicly redoing what is done in sprottys contextMenuModule due to the unintuitive nature of the contextmenu handeling
    // the sprotty version would require one to select and then open the context menu
    // now the context menu will open for the node under the cursor or for all selected Nodes if the node under the cursor is selected
    // This fix is done in the mouselistener and is already pushed to the master in sprotty (27.11.22) 
    // once the fix has its own version one could get rid of the code to the ----- and import said module instead.

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


    bind(TYPES.IContextMenuProviderRegistry).to(ContextMenuProviderRegistry);

    bind(graphprogrammingMouseListener).toSelf().inSingletonScope();
    bind(TYPES.MouseListener).toService(graphprogrammingMouseListener);
    bind(MouseListener).toService(graphprogrammingMouseListener);

    //------------------------------------------------------

    bind(TYPES.IContextMenuService).to(ContextMenueProvider);

    bind(TYPES.IContextMenuItemProvider).to(GetIOContextMenuItemProvider);
    bind(TYPES.IContextMenuItemProvider).to(GetNodesContextMenuItemProvider);
    bind(TYPES.IContextMenuItemProvider).to(GetEdgesContextMenuItemProvider);
    bind(TYPES.IContextMenuItemProvider).to(GetRegionContextMenuItemProvider);
    

});

export default graphprogrammingModule;
