/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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
import { Example } from "./example";

/** Note that this module needs to be an argument in container.load()
 *  at the bottom of the file ../di.config.ts */
export const exampleModule = new ContainerModule((bind) => {
    // The class needs to be bound to itself and
    // we have to let sprotty know our service is an UIExtension
    bind(Example).toSelf().inSingletonScope();
    bind(TYPES.IUIExtension).toService(Example);
});

