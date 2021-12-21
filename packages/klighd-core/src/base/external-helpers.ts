/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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

import { Container } from "inversify";
import { IActionDispatcher, TYPES } from "sprotty";
import { RequestModelAction, Viewport } from "sprotty-protocol";

// This module contains helper methods that can simplify the interaction with the Sprotty container from outside this package.
// The main goal of each helper is to abstract Sprotty internal implementations.

/** Diagram type that is communicated with the diagram server. */
export const diagramType = "keith-diagram";

/** Queries and returns an ActionDispatcher from the given DI Container. */
export function getActionDispatcher(container: Container): IActionDispatcher {
    return container.get<IActionDispatcher>(TYPES.IActionDispatcher);
}

/** Starts a model communication with the diagram server by dispatching a model request. */
export async function requestModel(
    actionDispatcher: IActionDispatcher,
    sourceUri: string
): Promise<void> {
    await actionDispatcher.dispatch(RequestModelAction.create({ sourceUri, diagramType }));
}

export function getBookmarkViewport(x: number, y: number, zoom: number): Viewport | null {
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(zoom)) {
        return { scroll: { x: x, y: y }, zoom: zoom }
    }
    return null
}
