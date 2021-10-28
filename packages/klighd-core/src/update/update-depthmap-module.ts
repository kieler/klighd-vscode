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
import { configureCommand } from "sprotty";
import { UpdateDepthMapModelCommand } from './update-depthmap-model';

/**
 * Module for updating the DepthMap whenever needed.
 */
const updateDepthMapModule = new ContainerModule((bind, _unbind, isBound) => {
    configureCommand({ bind, isBound }, UpdateDepthMapModelCommand);
});

export default updateDepthMapModule;