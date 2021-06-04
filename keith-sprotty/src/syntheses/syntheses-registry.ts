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
import { injectable } from "inversify";
import { Action, ICommand } from "sprotty";
import { Registry } from "../base/registry";
import { SetSynthesesAction, SetSynthesesActionData, SetSynthesisAction } from "./actions";

/**
 * A simple injectable registry that holds a list of all available syntheses
 * as well as the currently selected synthesis.
 *
 * Handles SetSyntheses and SetSynthesis actions to keep the state in sync which
 * new events.
 */
@injectable()
export class SynthesesRegistry extends Registry {
    private _currentSynthesisID: string = "";
    private _syntheses: SetSynthesesActionData[] = [];

    handle(action: Action): void | Action | ICommand {
        if (SetSynthesesAction.isThisAction(action)) {
            this._syntheses = action.syntheses;
            this._currentSynthesisID = action.syntheses[0]?.id ?? "";

            this.notifyListeners();
        } else if (SetSynthesisAction.isThisAction(action)) {
            this._currentSynthesisID = action.id;
            this.notifyListeners();
        }
    }

    get syntheses() {
        return this._syntheses;
    }

    get currentSynthesisID() {
        return this._currentSynthesisID;
    }
}
