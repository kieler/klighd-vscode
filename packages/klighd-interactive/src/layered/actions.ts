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

import { Action } from 'sprotty';
import { DeleteConstraint, LayerConstraint, PositionConstraint, StaticConstraint } from './constraint-types';

/**
 * Sent from client to server to set a position and layer constraint.
 */
export class SetStaticConstraintAction implements Action {
    static readonly KIND: string = 'setStaticConstraint'
    readonly kind = SetStaticConstraintAction.KIND

    constructor(public readonly constraint: StaticConstraint) {
    }
}

/**
 * Sent from client to server to delete position and layer constraint on a node.
 */
export class DeleteStaticConstraintAction implements Action {
    static readonly KIND: string = 'deleteStaticConstraint'
    readonly kind = DeleteStaticConstraintAction.KIND

    constructor(public readonly constraint: DeleteConstraint) {
    }
}

/**
 * Sent from client to server to delete position constraint on a node.
 * Currently unused.
 */
export class DeletePositionConstraintAction implements Action {
    static readonly KIND: string = 'deletePositionConstraint'
    readonly kind = DeletePositionConstraintAction.KIND

    constructor(public readonly constraint: DeleteConstraint) {
    }
}

/**
 * Sent from client to server to delete layer constraint on a node.
 * Currently unused.
 */
export class DeleteLayerConstraintAction implements Action {
    static readonly KIND: string = 'deleteLayerConstraint'
    readonly kind = DeleteLayerConstraintAction.KIND

    constructor(public readonly constraint: DeleteConstraint) {
    }
}

/**
 * Sent from client to server to set a layer constraint on a node.
 */
export class SetLayerConstraintAction implements Action {
    static readonly KIND: string = 'setLayerConstraint'
    readonly kind = SetLayerConstraintAction.KIND

    constructor(public readonly constraint: LayerConstraint) {
    }
}

/**
 * Sent from client to server to set a position constraint on a node.
 */
export class SetPositionConstraintAction implements Action {
    static readonly KIND: string = 'setPositionConstraint'
    readonly kind = SetPositionConstraintAction.KIND

    constructor(public readonly constraint: PositionConstraint) {
    }
}