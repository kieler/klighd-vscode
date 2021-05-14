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
import { Connection, createKeithDiagramContainer, requestModel } from "@kieler/keith-sprotty/lib";
import { LSPConnection } from "./connection";
import { getDiagramSourceUri, getLanguageId, sleep } from "./helpers";
import { hideSpinner } from "./spinner";

const sourceUri = getDiagramSourceUri();

if (!sourceUri) {
    document.body.innerHTML = "Please specify a sourceUri for your diagram as a search parameter.";
} else {
    main(sourceUri).then(() => hideSpinner());
}

async function main(sourceUri: string) {
    const languageId = getLanguageId(sourceUri);
    const socketUrl = `ws://${location.host}/socket`;

    const connection = new LSPConnection();
    const diagramContainer = createKeithDiagramContainer("sprotty");
    diagramContainer.bind(Connection).toConstantValue(connection);

    // Connect to a language server and request a diagram.
    await connection.connect(socketUrl);
    await connection.sendInitialize();
    connection.sendDocumentDidOpen(sourceUri, languageId);
    // TODO: If this does not sleep, the LS send two requestTextBounds and updateOptions actions...
    await sleep(200);
    await requestModel(diagramContainer, sourceUri);
}
