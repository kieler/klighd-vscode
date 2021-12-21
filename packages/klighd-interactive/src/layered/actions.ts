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

import { Action } from 'sprotty-protocol';
import { DeleteConstraint, LayerConstraint, PositionConstraint, StaticConstraint } from './constraint-types';

/**
 * Sent from client to server to set a position and layer constraint.
 */
export interface SetStaticConstraintAction extends Action {
    kind: typeof SetStaticConstraintAction.KIND
    constraint: StaticConstraint
}

export namespace SetStaticConstraintAction {
    export const KIND = 'setStaticConstraint'

    export function create(constraint: StaticConstraint): SetStaticConstraintAction {
        return {
            kind: KIND,
            constraint,
        }
    }
}

/**
 * Sent from client to server to delete position and layer constraint on a node.
 */
export interface DeleteStaticConstraintAction extends Action {
    kind: typeof DeleteStaticConstraintAction.KIND
    constraint: DeleteConstraint
}

export namespace DeleteStaticConstraintAction {
    export const KIND = 'deleteStaticConstraint'

    export function create(constraint: DeleteConstraint): DeleteStaticConstraintAction {
        return {
            kind: KIND,
            constraint,
        }
    }
}

/**
 * Sent from client to server to delete position constraint on a node.
 * Currently unused.
 */
export interface DeletePositionConstraintAction extends Action {
    kind: typeof DeletePositionConstraintAction.KIND
    constraint: DeleteConstraint
}

export namespace DeletePositionConstraintAction {
    export const KIND = 'deletePositionConstraint'

    export function create(constraint: DeleteConstraint): DeletePositionConstraintAction {
        return {
            kind: KIND,
            constraint,
        }
    }
}

/**
 * Sent from client to server to delete layer constraint on a node.
 * Currently unused.
 */
export interface DeleteLayerConstraintAction extends Action {
    kind: typeof DeleteLayerConstraintAction.KIND
    constraint: DeleteConstraint
}

export namespace DeleteLayerConstraintAction {
    export const KIND = 'deleteLayerConstraint'

    export function create(constraint: DeleteConstraint): DeleteLayerConstraintAction {
        return {
            kind: KIND,
            constraint,
        }
    }
}

/**
 * Sent from client to server to set a layer constraint on a node.
 */
export interface SetLayerConstraintAction extends Action {
    kind: typeof SetLayerConstraintAction.KIND
    constraint: LayerConstraint
}

export namespace SetLayerConstraintAction {
    export const KIND = 'setLayerConstraint'

    export function create(constraint: LayerConstraint): SetLayerConstraintAction {
        return {
            kind: KIND,
            constraint,
        }
    }
}

/**
 * Sent from client to server to set a position constraint on a node.
 */
export interface SetPositionConstraintAction extends Action {
    kind: typeof SetPositionConstraintAction.KIND
    constraint: PositionConstraint
}

export namespace SetPositionConstraintAction {
    export const KIND = 'setPositionConstraint'

    export function create(constraint: PositionConstraint): SetPositionConstraintAction {
        return {
            kind: KIND,
            constraint,
        }
    }
}