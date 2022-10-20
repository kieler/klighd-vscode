/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2022 by
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
import { ExportSvgAction, RequestExportSvgAction } from "sprotty";
import {
    Action, FitToScreenAction, generateRequestId, RequestAction, ResponseAction
} from "sprotty-protocol";
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
 * Extended {@link RequestExportSvgAction} to create a request action of a {@link KlighdExportSvgAction}.
 */
export type KlighdRequestExportSvgAction = RequestExportSvgAction

export namespace KlighdRequestExportSvgAction {
    export function create(): RequestAction<KlighdExportSvgAction> {
        return {
            kind: RequestExportSvgAction.KIND,
            requestId: generateRequestId()
        }
    }
}

/** 
 * Extended {@link ExportSvgAction} by a uri for a better name of the saved diagram.
 */
export interface KlighdExportSvgAction extends ExportSvgAction {
    uri: string
}
export namespace KlighdExportSvgAction {
    export const KIND = 'exportSvg';

    export function create(svg: string, requestId: string, uri: string): KlighdExportSvgAction {
        return {
            kind: KIND,
            svg,
            responseId: requestId,
            uri
        };
    }
}