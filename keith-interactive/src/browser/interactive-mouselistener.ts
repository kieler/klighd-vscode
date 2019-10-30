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

import { MoveMouseListener, SModelElement, Action } from "sprotty";

import { injectable } from 'inversify';

@injectable()
export class InteractiveMouseListener extends MoveMouseListener {

    mouseMove(target: SModelElement, event: MouseEvent): Action[] {
        return []
    }

    mouseDown(target: SModelElement, event: MouseEvent): Action[] {
        return []
    }

    mouseUp(target: SModelElement, event: MouseEvent): Action[] {
        return []
    }

    /**
     * Sets properties of the target accordingly to the position the target is moved to
     * @param target SModelElement that is moved
     */
    public setProperty(target: SModelElement): void {
        return
    }

}