/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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
/* eslint-disable no-redeclare */

import { Action } from 'sprotty-protocol'
import { TreeSetPositionConstraint } from './constraint-types'

/**
 * Sent from client to server to set a position to force a node on a specific position.
 */
export interface TreeSetPositionConstraintAction extends Action {
    kind: typeof TreeSetPositionConstraintAction.KIND
    constraint: TreeSetPositionConstraint
}

export namespace TreeSetPositionConstraintAction {
    export const KIND = 'treeSetPositionConstraint'

    export function create(constraint: TreeSetPositionConstraint): TreeSetPositionConstraintAction {
        return {
            kind: KIND,
            constraint,
        }
    }
}
