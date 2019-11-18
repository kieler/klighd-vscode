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

import {
    Action
} from 'sprotty/lib';
import { StaticConstraint, DeleteConstraint, LayerConstraint, PositionConstraint } from './constraint-types';

/**
 * Sent from client to server to set a static constraint
 */
export class SetStaticConstraintAction implements Action {
    static readonly KIND: string = 'setStaticConstraint'
    readonly kind = SetStaticConstraintAction.KIND

    constructor(public readonly constraint: StaticConstraint) {
    }
}

export class DeleteConstraintAction implements Action {
    static readonly KIND: string = 'deleteConstraint'
    readonly kind = DeleteConstraintAction.KIND

    constructor(public readonly constraint: DeleteConstraint) {
    }
}

export class SetLayerConstraintAction implements Action {
    static readonly KIND: string = 'setLayerConstraint'
    readonly kind = SetLayerConstraintAction.KIND

    constructor(public readonly constraint: LayerConstraint) {
    }
}

export class SetPositionConstraintAction implements Action {
    static readonly KIND: string = 'setPositionConstraint'
    readonly kind = SetPositionConstraintAction.KIND

    constructor(public readonly constraint: PositionConstraint) {
    }
}

export class RefreshLayoutAction implements Action {
    static readonly KIND: string = 'refreshLayout'
    readonly kind = RefreshLayoutAction.KIND
    constructor() {}
}