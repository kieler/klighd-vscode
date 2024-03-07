/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2020-2021 by
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
// We follow Sprotty's way of redeclaring the interface and its create function, so disable this lint check for this file.
/* eslint-disable no-redeclare */

import { Action } from 'sprotty-protocol'
import { DeleteConstraint } from './layered/constraint-types'

/**
 * A sprotty action to refresh the diagram. Sent from client to server.
 */
export interface RefreshDiagramAction extends Action {
    kind: typeof RefreshDiagramAction.KIND
}

export namespace RefreshDiagramAction {
    export const KIND = 'refreshDiagram'

    export function create(): RefreshDiagramAction {
        return {
            kind: KIND,
        }
    }
}

/**
 * A sprotty action to refresh the layout. Sent from client to server.
 */
 export interface RefreshLayoutAction extends Action {
    kind: typeof RefreshLayoutAction.KIND
}

export namespace RefreshLayoutAction {
    export const KIND = 'refreshLayout'

    export function create(): RefreshLayoutAction {
        return {
            kind: KIND,
        }
    }
}

/**
 * A sprotty action to delete a constraint on a specific node.
 */
export interface DeleteConstraintAction extends Action {
    kind: typeof DeleteConstraintAction.KIND
    constraint: DeleteConstraint
}

export namespace DeleteConstraintAction {
    export const KIND = 'deleteStaticConstraint'

    export function create(constraint: DeleteConstraint): DeleteConstraintAction {
        return {
            kind: KIND,
            constraint,
        }
    }
}
