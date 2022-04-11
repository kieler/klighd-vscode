/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

import { ContainerModule } from "inversify";
import { TYPES } from "sprotty";
import { DISymbol } from "../di.symbols";
import { ProxyView } from "./proxy-view";
import { ProxyViewActionHandler } from "./proxy-view-actions";

export const proxyViewModule = new ContainerModule((bind) => {
    // The class needs to be bound to itself and
    // we have to let sprotty know our service is an UIExtension
    bind(DISymbol.ProxyViewUI).to(ProxyView).inSingletonScope();
    bind(TYPES.IUIExtension).toService(DISymbol.ProxyViewUI);
    
    bind(ProxyViewActionHandler).toSelf().inSingletonScope();
    bind(TYPES.IActionHandlerInitializer).toService(ProxyViewActionHandler);
});

