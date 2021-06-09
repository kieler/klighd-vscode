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

import { window } from "vscode";
import {
    CloseAction,
    ErrorAction,
    ErrorHandler,
    Message,
} from "vscode-languageclient";

/**
 * Simple LS connection error handling that informs the user about encountered
 * errors.
 */
export class KeithErrorHandler implements ErrorHandler {
    constructor(private defaultHandler: ErrorHandler) {}

    error(error: Error, message: Message, count: number): ErrorAction {
        window.showErrorMessage("Connection to KIELER Language Server produced an error!");
        console.error(error);

        return this.defaultHandler.error(error, message, count);
    }

    closed(): CloseAction {
        window.showErrorMessage("Connection to KIELER Language Server got closed!");

        return this.defaultHandler.closed();
    }
}
