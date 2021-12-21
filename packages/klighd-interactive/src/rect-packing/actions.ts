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

import { Action } from 'sprotty-protocol';
import { AspectRatio, RectPackDeletePositionConstraint, RectPackSetPositionConstraint } from './constraint-types';

/**
 * Send from client to server to set the aspect ratio.
 */
export interface SetAspectRatioAction extends Action {
    kind: typeof SetAspectRatioAction.KIND
    constraint: AspectRatio
}

export namespace SetAspectRatioAction {
    export const KIND = 'setAspectRatio'

    export function create(constraint: AspectRatio): SetAspectRatioAction {
        return {
            kind: KIND,
            constraint,
        }
    }
}

/**
 * Send from client to server to delete an position constraint on a node.
 */
export interface RectPackDeletePositionConstraintAction extends Action {
    kind: typeof RectPackDeletePositionConstraintAction.KIND
    constraint: RectPackDeletePositionConstraint
}

export namespace RectPackDeletePositionConstraintAction {
    export const KIND = 'rectPackDeletePositionConstraint'

    export function create(constraint: RectPackDeletePositionConstraint): RectPackDeletePositionConstraintAction {
        return {
            kind: KIND,
            constraint,
        }
    }
}

/**
 * Send from client to server to set a position to force a node on a specific position.
 */
export interface RectPackSetPositionConstraintAction extends Action {
    kind: typeof RectPackSetPositionConstraintAction.KIND
    constraint: RectPackSetPositionConstraint
}

export namespace RectPackSetPositionConstraintAction {
    export const KIND = 'rectPackSetPositionConstraint'

    export function create(constraint: RectPackSetPositionConstraint): RectPackSetPositionConstraintAction {
        return {
            kind: KIND,
            constraint,
        }
    }
}