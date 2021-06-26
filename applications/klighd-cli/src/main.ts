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

import "reflect-metadata";
import "./styles/main.css";
import "klighd-core/styles/main.css";
import {
    createKlighdDiagramContainer,
    requestModel,
    getActionDispatcher,
    SetPreferencesAction,
    bindServices,
} from "klighd-core";
import { LSPConnection } from "./services/connection";
import { getDiagramSourceUri, getLanguageId, readSearchParam, sleep } from "./helpers";
import { showSpinner, hideSpinner } from "./spinner";
import { showPopup } from "./popup";

// IIFE booting the application
(async function main() {
    const sourceUri = getDiagramSourceUri();

    if (!sourceUri) {
        showPopup(
            "warn",
            "Wrong usage",
            "Please specify a file URI to your diagram as a search parameter. (?source=...)",
            { persist: true }
        );
        return;
    }

    try {
        showSpinner("Initializing connection...");
        await initDiagramView(sourceUri);
        hideSpinner();
    } catch (e) {
        console.error(e);
        showPopup(
            "error",
            "Initialization error",
            "Something went wrong while initializing the diagram. Please reload and try again."
        );
    }
})();

/**
 * Opens a connection to the LS, prepares the `klighd-core` view and start a
 * visualization by dispatching a model request.
 * @see `klighd-core` for more getting started information.
 */
async function initDiagramView(sourceUri: string) {
    const languageId = getLanguageId(sourceUri);
    const socketUrl = `ws://${location.host}/socket`;

    const connection = new LSPConnection();
    const diagramContainer = createKlighdDiagramContainer("sprotty");
    bindServices(diagramContainer, { connection, sessionStorage });
    const actionDispatcher = getActionDispatcher(diagramContainer);

    sendUrlSearchParamPreferences(actionDispatcher);

    // Connect to a language server and request a diagram.
    await connection.connect(socketUrl);
    await connection.sendInitialize();
    connection.sendDocumentDidOpen(sourceUri, languageId);
    // TODO: If this does not sleep, the LS send two requestTextBounds and updateOptions actions.
    // Properly because the document changes from the open notification. However, there is no way to await
    // notification in the vscode-languageclient api.
    await sleep(500);
    await requestModel(actionDispatcher, sourceUri);
}

/** Communicates preferences to the diagram container which are red from the url search params. */
function sendUrlSearchParamPreferences(actionDispatcher: ReturnType<typeof getActionDispatcher>) {
    actionDispatcher.dispatch(
        new SetPreferencesAction({
            resizeToFit: readSearchParam("resizeToFit") === "false" ? false : true,
        })
    );
}