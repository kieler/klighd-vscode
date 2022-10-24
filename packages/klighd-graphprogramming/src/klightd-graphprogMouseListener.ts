/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2021 by
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

import { injectable } from 'inversify';
import { MouseListener, SModelElement } from 'sprotty';
import { Action } from "sprotty-protocol";

@injectable()
export class graphprogrammingMouseListener extends MouseListener {
    contextMenu(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        console.log("test");
        return [];
    }
}