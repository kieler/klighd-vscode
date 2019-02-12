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
import { ContainerModule } from "inversify"
import { TYPES } from "sprotty/lib";
import { ActionListener } from "./action-listener";

const actionModule = new ContainerModule(bind => {
    bind(TYPES.MouseListener).to(ActionListener)
});

export default actionModule