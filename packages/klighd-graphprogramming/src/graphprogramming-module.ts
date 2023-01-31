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
import { MouseListener, TYPES } from 'sprotty';
import { DISymbol } from './symbols';
import { KlighdIContextMenuService } from './contextmenu/klighd-service';

import { graphprogrammingMouseListener } from './contextmenu/klightd-graphprogMouseListener';


import { ContextMenueProvider } from './contextmenu/klightd-contextmenuprovider';
import { graphprogrammingMoveMouseListener } from './contextmenu/klighd-graphprogramming-TargetingMouseListener';
// import { graphprogrammingMoveMouseListener } from './contextmenu/klighd-graphprogramming-TargetingMouseListener';


export const graphprogrammingModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    // const context = { bind, unbind, isBound, rebind }
    

    bind(DISymbol.KlighdIContextMenuServiceProvider).toProvider<KlighdIContextMenuService>(ctx => {
        return () => {
            return new Promise<KlighdIContextMenuService>((resolve, reject) => {
                if (ctx.container.isBound(DISymbol.KlighdIContextMenuService)) {
                    resolve(ctx.container.get<KlighdIContextMenuService>(DISymbol.KlighdIContextMenuService));
                } else {
                    reject();
                }
            });
        };
    });

    bind(graphprogrammingMouseListener).toSelf().inSingletonScope();
    bind(TYPES.MouseListener).toService(graphprogrammingMouseListener);
    bind(MouseListener).toService(graphprogrammingMouseListener);

    bind(graphprogrammingMoveMouseListener).toSelf().inSingletonScope();
    bind(TYPES.MouseListener).toService(graphprogrammingMoveMouseListener);
    bind(MouseListener).toService(graphprogrammingMoveMouseListener);
    
    //------------------------------------------------------

    bind(DISymbol.KlighdIContextMenuService).to(ContextMenueProvider);

});

export default graphprogrammingModule;
