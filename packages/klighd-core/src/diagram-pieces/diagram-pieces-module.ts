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
 * This code is provided under the terms of the Eclipse Public License 2.0 (EPL-2.0).
 */

import { ContainerModule } from "inversify";
import { configureCommand } from "sprotty";
import { SetDiagramPieceCommand } from "../actions/actions";

/**
 * Dependency injection module that adds functionality to insert diagram pieces
 * into the stored model.
 */
const diagramPieceModule = new ContainerModule((bind, _unbind, isBound) => {
    configureCommand({ bind, isBound }, SetDiagramPieceCommand);
});

export default diagramPieceModule