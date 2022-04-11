/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019, 2021 by
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
import { inject, injectable } from 'inversify';
import {
     CommandExecutionContext, CommandResult, RenderingContext,
    ResetCommand, SGraph, SModelRoot, TYPES,
} from 'sprotty';
import {
    Action, FitToScreenAction, RequestAction, ResponseAction,
    SModelElement
} from "sprotty-protocol";
import { insertSModelElementIntoModel } from '../diagram-pieces/smodel-util';
import { KImage } from '../skgraph-models';

/**
 * Sent from the server to the client to store images in base64 format needed for rendering on the client.
 *
 * @author nre
 */
export interface StoreImagesAction extends Action {
    kind: typeof StoreImagesAction.KIND
    images: Pair<Pair<string, string>, string>[]
}

export namespace StoreImagesAction {
    export const KIND = 'storeImages'

    export function create(images: Pair<Pair<string, string>, string>[]): StoreImagesAction {
        return {
            kind: KIND,
            images,
        }
    }
}

/**
 * A key-value pair matching the interface of org.eclipse.xtext.xbase.lib.Pair
 */
export interface Pair<K, V> {
    k: K
    v: V
}

/**
 * Sent from the server to the client to check if the {@link KImage}s provided in the message are cached or if they need
 * to be sent to the client again.
 */
export interface CheckImagesAction extends RequestAction<CheckedImagesAction> {
    kind: typeof CheckImagesAction.KIND
    images: KImage[]
}

export namespace CheckImagesAction {
    export const KIND = 'checkImages'

    export function create(images: KImage[], requestId = ''): CheckImagesAction {
        return {
            kind: KIND,
            images,
            requestId,
        }
    }
}

/**
 * Sent from the client to the server to inform it whether images need to be sent to the client before accepting the next diagram.
 */
export interface CheckedImagesAction extends ResponseAction {
    kind: typeof CheckedImagesAction.KIND
    notCached: Pair<string, string>[]
}

export namespace CheckedImagesAction {
    export const KIND = 'checkedImages'

    export function create(notCached: Pair<string, string>[], responseId = ''): CheckedImagesAction {
        return {
            kind: KIND,
            notCached,
            responseId,
        }
    }
}

/**
 * Sent from the client to the diagram server to perform a klighd action on the model.
 * Causes the server to update the diagram accordingly to the action.
 */
export interface PerformActionAction extends Action {
    kind: typeof PerformActionAction.KIND
    actionId: string
    kGraphElementId: string
    kRenderingId: string
    revision?: number
}

export namespace PerformActionAction {
    export const KIND = 'performAction'

    export function create(actionId: string, kGraphElementId: string, kRenderingId: string, revision?: number): PerformActionAction {
        return {
            kind: KIND,
            actionId,
            kGraphElementId,
            kRenderingId,
            revision,
        }
    }
}

/**
 * A sprotty action to refresh the layout. Send from client to server.
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
 * Extended {@link FitToScreenAction} that always fits the root element with a padding
 * of 10px. Most of the time this is the wanted behavior in the `klighd-core`.
 */
export type KlighdFitToScreenAction = FitToScreenAction

export namespace KlighdFitToScreenAction {
    export function create( animate?: boolean): FitToScreenAction {
        return {
            kind: FitToScreenAction.KIND,
            elementIds: ["$root"],
            padding: 10,
            animate: animate ?? true
        }
    }
}

/**
 * Sent from client to request a certain piece of the diagram.
 */
export interface RequestDiagramPieceAction extends RequestAction<SetDiagramPieceAction> {
    kind: typeof RequestDiagramPieceAction.KIND
    modelElementId: string
}

export namespace RequestDiagramPieceAction {
    export const KIND = 'requestDiagramPiece'

    export function create(requestId = '', modelElementId: string): RequestDiagramPieceAction {
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

    export function create(responseId = "", diagramPiece: SModelElement): SetDiagramPieceAction {
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

    root: SModelRoot

    constructor(@inject(TYPES.Action) protected action: SetDiagramPieceAction) {
        super()
    }

    execute(context: CommandExecutionContext): CommandResult {
        this.root = context.modelFactory.createRoot(context.root)
        insertSModelElementIntoModel(
            this.root, 
            context.modelFactory.createElement(this.action.diagramPiece))
        return {
            model: this.root,
            modelChanged: true,
            cause: this.action
        }
    }

    undo(_context: CommandExecutionContext): SModelRoot {
        return this.root
    }

    redo(_context: CommandExecutionContext): SModelRoot {
        return this.root
    }
}

/** Sent from the view to the diagram server to further send the data to whoever needs it. */
export interface SendModelContextAction extends Action {
    kind: typeof SendModelContextAction.KIND
    model: SGraph
    context: RenderingContext
}

export namespace SendModelContextAction {
    export const KIND = 'sendModelContextAction'

    export function create(model: SGraph, context: RenderingContext): SendModelContextAction {
        return {
            kind: KIND,
            model,
            context
        }
    }
}
