/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { InitializeParams } from 'vscode-languageserver-protocol';

/**
 * Additional options that can be passed to the server during the initialize method.
 */
export interface KeithInitializationOptions {
    shouldSelectDiagram?: boolean
    shouldSelectText?: boolean
}

/**
 * Parameter for the initialize method containing the additional options for Keith.
 */
export type KeithInitializeParams = InitializeParams & {
    initializationOptions?: KeithInitializationOptions
}