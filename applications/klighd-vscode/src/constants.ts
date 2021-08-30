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

import { diagramType as originalDiagramType } from "@kieler/klighd-core";

/** Extension ID corresponding to the name property in the package.json */
export const extensionId = "klighd-vscode";

/**
 * Diagram type that KLighD uses to communicate Sprotty diagrams with the LS.
 * The diagramType is also the name that is used by Sprotty for the webview.
 *
 * This key can also be used together with the "-focused" suffix (keith-diagram-focused)
 * for VS Code contribution points that are only active when the diagram view is focused.
 *
 * Webview creation: @see https://github.com/eclipse/sprotty-vscode/blob/master/sprotty-vscode-extension/src/sprotty-webview.ts#L76
 * Active tracking: @see https://github.com/eclipse/sprotty-vscode/blob/master/sprotty-vscode-extension/src/sprotty-webview.ts#L76
 * Webview contribution: @see https://stackoverflow.com/a/54917749/7569889
 *
 * _PS. This value is reexported here to not loose the extra documentation about sprotty-vscode
 * specific diagramType usage and behavior._
 */
export const diagramType = originalDiagramType;

const withPrefix = (name: string) => `${extensionId}.${name}`;

/** Commands that are registered by this extension or `sprotty-vscode`.*/
export const command = {
    setLanguageClient: withPrefix("setLanguageClient"),
    addActionHandler: withPrefix("addActionHandler"),
    clearData: withPrefix("data.clear"),
    // The following commands are registered by `sprotty-vscode`
    diagramOpen: withPrefix("diagram.open"),
    diagramExport: withPrefix("diagram.export"),
    diagramCenter: withPrefix("diagram.center"),
    diagramFit: withPrefix("diagram.fit"),
    diagramLayout: withPrefix("diagram.layout"),
    diagramRefresh: withPrefix("diagram.refresh"),
    diagramSync: withPrefix("diagram.sync"),
    diagramNoSync: withPrefix("diagram.noSync"),
};

export const contextKeys = {
    syncWithEditor: withPrefix("syncWithEditor"),
};
