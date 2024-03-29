/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2023 by
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
import { inject, injectable } from 'inversify'
import { CommandExecutionContext, CommandResult, ResetCommand, SModelRootImpl, TYPES } from 'sprotty'
import { RequestAction, ResponseAction, SModelElement } from 'sprotty-protocol'
import { insertSModelElementIntoModel } from './smodel-util'

/**
 * Sent from client to request a certain piece of the diagram.
 */
export interface RequestDiagramPieceAction extends RequestAction<SetDiagramPieceAction> {
    kind: typeof RequestDiagramPieceAction.KIND
    modelElementId: string
}

export namespace RequestDiagramPieceAction {
    export const KIND = 'requestDiagramPiece'

    export function create(requestId: string, modelElementId: string): RequestDiagramPieceAction {
        return {
            kind: KIND,
            requestId,
            modelElementId,
        }
    }
}

/**
 * Response to {@link RequestDiagramPieceAction}. Contains the requested SModelElement.
 */
export interface SetDiagramPieceAction extends ResponseAction {
    kind: typeof SetDiagramPieceAction.KIND
    diagramPiece: SModelElement
}

export namespace SetDiagramPieceAction {
    export const KIND = 'setDiagramPiece'

    export function create(responseId: string, diagramPiece: SModelElement): SetDiagramPieceAction {
        return {
            kind: KIND,
            responseId,
            diagramPiece,
        }
    }
}

/**
 * Command to trigger re-rendering of diagram when new pieces arrive.
 */
@injectable()
export class SetDiagramPieceCommand extends ResetCommand {
    static readonly KIND: string = 'setDiagramPiece'

    root: SModelRootImpl

    constructor(@inject(TYPES.Action) protected action: SetDiagramPieceAction) {
        super()
    }

    execute(context: CommandExecutionContext): CommandResult {
        this.root = context.root
        insertSModelElementIntoModel(this.root, context.modelFactory.createElement(this.action.diagramPiece))
        return {
            model: this.root,
            modelChanged: true,
            cause: this.action,
        }
    }

    undo(_context: CommandExecutionContext): SModelRootImpl {
        return this.root
    }

    redo(_context: CommandExecutionContext): SModelRootImpl {
        return this.root
    }
}
