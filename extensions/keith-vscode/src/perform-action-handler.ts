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

import { PerformActionAction, ActionHandler, Action } from "klighd-diagram";
import { window } from "vscode";

// Action ID defined by KLighD
const openInEditorId =
    "de.cau.cs.kieler.kicool.ui.klighd.internal.model.action.OpenCodeInEditorAction";
const startSimulationId = "de.cau.cs.kieler.simulation.ui.synthesis.action.StartSimulationAction";
const addCoSimulationId = "de.cau.cs.kieler.simulation.ui.synthesis.action.AddCoSimulationAction";

/**
 * Action handler that is registered in `klighd-diagram` to catch and handle {@link PerformActionAction}.
 */
export class PerformActionHandler implements ActionHandler {
    kind: string = PerformActionAction.KIND;

    async handleAction(action: Action): Promise<boolean> {
        if (!PerformActionAction.isThisAction(action)) {
            return true;
        }

        switch (action.actionId) {
            case openInEditorId:
                window.showInformationMessage("Triggered perform action to open in editor.");
                return false;
            case startSimulationId:
                window.showInformationMessage("Triggered perform action to start a simulation.");
                return false;
            case addCoSimulationId:
                window.showInformationMessage("Triggered perform action to add a Co Simulation");
                return false;
            default:
                return true;
        }
    }
}
