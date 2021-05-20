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
export const extensionId = "klighd-diagram";
/** Diagram type that has been used by KEITH to communicate with the LS. */
export const diagramType = "keith-diagram";

const withPrefix = (name: string) => `${extensionId}.${name}`;

/** Commands that are register by this extension or `sprotty-vscode`.*/
export const command = {
    setLanguageClient: withPrefix("setLanguageClient"),
    diagramOpen: withPrefix("diagram.open"),
    diagramExport: withPrefix("diagram.export"),
    diagramCenter: withPrefix("diagram.center"),
    diagramFit: withPrefix("diagram.fit"),
};
