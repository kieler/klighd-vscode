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

// ------------------ Base ------------------

// Import styles that are required to display beautiful diagrams. Implementing
// applications can decide how they bundle the styles. (Extract, dynamic inlining, etc.)
import "../styles/options.css";
import "sprotty/css/sprotty.css";

import createKeithDiagramContainer from "./di.config";
export { createKeithDiagramContainer };
export { requestModel } from "./diagram-server";
export { Connection, SessionStorage, NotificationType } from "./services";
