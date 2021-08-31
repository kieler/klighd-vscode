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

// Main package entry point. Exports the public API

export { default as createKlighdDiagramContainer } from "./di.config";
export * from "./services";
export { diagramType, getActionDispatcher, requestModel } from "./base/external-helpers";

// Export actions
export * from "./actions/actions";
export * from "./options/actions";
export { ToggleSidebarPanelAction } from "./sidebar/actions";
export { SetSynthesesAction, SetSynthesisAction } from "./syntheses/actions";
export { SetPreferencesAction } from "./preferences-registry";
export { SetInitialBookmark, Bookmark } from "./bookmarks/bookmark"
export { RefreshDiagramAction } from "@kieler/klighd-interactive/lib/actions";
export { ActionMessage } from "sprotty";
