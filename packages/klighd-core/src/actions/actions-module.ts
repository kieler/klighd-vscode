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
import { TYPES } from 'sprotty/lib';
import { ActionListener } from './action-listener';

/**
 * Dependency injection module that adds functionality for triggering KLighD actions.
 */
const actionModule = new ContainerModule(bind => {
    bind(TYPES.MouseListener).to(ActionListener)
});

export default actionModule