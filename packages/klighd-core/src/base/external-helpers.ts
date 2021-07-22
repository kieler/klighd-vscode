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
import { IActionDispatcher, RequestModelAction, TYPES, Viewport } from "sprotty";
import { GoToBookmarkAction } from "../bookmarks/bookmark";

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
    await actionDispatcher.dispatch(new RequestModelAction({ sourceUri, diagramType }));
}

/** Starts a model communication with the diagram server by dispatching a model request. */
export async function gotoBookmark(
    actionDispatcher: IActionDispatcher,
    viewport: Viewport,
): Promise<void> {
    await actionDispatcher.dispatch(new GoToBookmarkAction({ name: "From URI", place: viewport, elementId: "" }));
}

