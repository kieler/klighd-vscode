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
import {
    Action, RequestAction, ResponseAction, SModelRootSchema, Match, UpdateModelAction, FitToScreenAction
} from 'sprotty/lib';
import { KImage } from '../skgraph-models';

/**
 * Sent from the server to the client to store images in base64 format needed for rendering on the client.
 *
 * @author nre
 */
export class StoreImagesAction implements Action {
    static readonly KIND: string = 'storeImages'
    readonly kind = StoreImagesAction.KIND

    constructor(public readonly images: Pair<Pair<string, string>, string>[]) {
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
export class CheckImagesAction implements RequestAction<CheckedImagesAction> {
    static readonly KIND: string = 'checkImages'
    readonly kind = CheckImagesAction.KIND

    constructor(public readonly images: KImage[],
        public readonly requestId: string = '') {
    }
}

/**
 * Sent from the client to the server to inform it whether images need to be sent to the client before accepting the next diagram.
 */
export class CheckedImagesAction implements ResponseAction {
    static readonly KIND: string = 'checkedImages'
    readonly kind = CheckedImagesAction.KIND

    constructor(public readonly notCached: Pair<string, string>[],
        public readonly responseId = '') {
    }
}

/**
 * Sent from the client to the diagram server to perform a klighd action on the model.
 * Causes the server to update the diagram accordingly to the action.
 */
export class PerformActionAction implements Action {
    static readonly KIND = 'performAction'
    kind = PerformActionAction.KIND

    constructor(public readonly actionId: string, public kGraphElementId: string, protected kRenderingId: string, protected revision?: number) {
    }

    /** Type predicate to narrow an action to this action. */
    static isThisAction(action: Action): action is PerformActionAction {
        return action.kind === PerformActionAction.KIND;
    }
}

/**
 * A sprotty action to refresh the layout. Send from client to server.
 */
export class RefreshLayoutAction implements Action {
    static readonly KIND: string = 'refreshLayout'
    readonly kind = RefreshLayoutAction.KIND
}

export class KlighdUpdateModelAction extends UpdateModelAction {
    static readonly KIND = 'updateModel';

    public readonly newRoot?: SModelRootSchema;
    public readonly matches?: Match[];
    public cause: Action;

    constructor(input: SModelRootSchema | Match[], cause: Action,
                public readonly animate: boolean = true) {
        super(input, animate)
        this.cause = cause
    }
}

/** 
 * Extended {@link FitToScreenAction} that always fits the root element with a padding
 * of 10px. Most of the time this is the wanted behavior in the `klighd-core`.
 */
export class KlighdFitToScreenAction extends FitToScreenAction {
    constructor(animate?: boolean) {
        super(["$root"], 10, undefined, animate)
    }
}