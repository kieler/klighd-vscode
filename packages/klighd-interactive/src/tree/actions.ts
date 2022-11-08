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

import { Action } from 'sprotty-protocol';
import { TreeDeletePositionConstraint, TreeSetPositionConstraint } from './constraint-types';

/**
 * Send from client to server to delete an position constraint on a node.
 */
export class TreeDeletePositionConstraintAction implements Action {
    static readonly KIND: string = 'treeDeletePositionConstraint'
    readonly kind = TreeDeletePositionConstraintAction.KIND

    constructor(public readonly constraint: TreeDeletePositionConstraint) {
    }
}

/**
 * Send from client to server to set a position to force a node on a specific position.
 */
export class TreeSetPositionConstraintAction implements Action {
    static readonly KIND: string = 'treeSetPositionConstraint'
    readonly kind = TreeSetPositionConstraintAction.KIND

    constructor(public readonly constraint: TreeSetPositionConstraint) {
    }
}