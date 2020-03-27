/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { Action } from 'sprotty/lib/base/actions/action';
import { DeleteConstraint } from './layered/constraint-types';

export class RefreshDiagramAction implements Action {
    static readonly KIND: string = 'refreshDiagram'
    readonly kind = RefreshDiagramAction.KIND
    constructor() {}
}
export class DeleteConstraintAction implements Action {
    static readonly KIND: string = 'deleteStaticConstraint'
    readonly kind = DeleteConstraintAction.KIND

    constructor(public readonly constraint: DeleteConstraint) {
    }
}