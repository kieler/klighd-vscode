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

import { Action } from 'sprotty/lib/base/actions/action';
import { DeleteConstraint } from './layered/constraint-types';

/**
 * A sprotty action to refresh the diagram. Send from client to server.
 */
export class RefreshDiagramAction implements Action {
    static readonly KIND: string = 'refreshDiagram'
    readonly kind = RefreshDiagramAction.KIND
}

/**
 * A sprotty action to delete a constraint on a specific node.
 */
export class DeleteConstraintAction implements Action {
    static readonly KIND: string = 'deleteStaticConstraint'
    readonly kind = DeleteConstraintAction.KIND

    constructor(public readonly constraint: DeleteConstraint) {
    }
}