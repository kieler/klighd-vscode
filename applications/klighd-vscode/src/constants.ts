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
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

/** Extension ID corresponding to the name property in the package.json */
export const extensionId = "klighd-vscode";

/**
 * Diagram type that KEITH uses to communicate Sprotty diagrams with the LS.
 * The diagramType is also the name that is used by Sprotty for the webview.
 *
 * This key can also be used together with the "-focused" suffix (keith-diagram-focused)
 * for VSCode contribution points that are only active when the diagram view is focused.
 *
 * Webview creation: @see https://github.com/eclipse/sprotty-vscode/blob/master/sprotty-vscode-extension/src/sprotty-webview.ts#L76
 * Active tracking: @see https://github.com/eclipse/sprotty-vscode/blob/master/sprotty-vscode-extension/src/sprotty-webview.ts#L76
 * Webview contribution: @see https://stackoverflow.com/a/54917749/7569889
 */
export const diagramType = "keith-diagram";

const withPrefix = (name: string) => `${extensionId}.${name}`;

/** Commands that are registered by this extension or `sprotty-vscode`.*/
export const command = {
    setLanguageClient: withPrefix("setLanguageClient"),
    addActionHandler: withPrefix("addActionHandler"),
    // The following commands are registered by `sprotty-vscode`
    diagramOpen: withPrefix("diagram.open"),
    diagramExport: withPrefix("diagram.export"),
    diagramCenter: withPrefix("diagram.center"),
    diagramFit: withPrefix("diagram.fit"),
    diagramLayout: withPrefix("diagram.layout"),
    diagramRefresh: withPrefix("diagram.refresh")
};
