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
import { Action, IActionHandler, ICommand } from "sprotty";
import { isSetSynthesesAction, isSetSynthesisAction, SetSynthesesActionData } from "./action";

/**
 * A simple injectable registry that holds a list of all available syntheses
 * as well as the currently selected synthesis.
 *
 * Handles SetSyntheses and SetSynthesis actions to keep the state in sync which
 * new events.
 *
 */
@injectable()
export class SynthesesRegistry implements IActionHandler {
    private _currentSynthesisID: string = "";
    private _syntheses: SetSynthesesActionData[] = [];

    private _listeners: (() => void)[] = [];

    handle(action: Action): void | Action | ICommand {
        if (isSetSynthesesAction(action)) {
            this._syntheses = action.syntheses;
            this._currentSynthesisID = action.syntheses[0]?.id ?? "";

            this.notifyListeners();
        } else if (isSetSynthesisAction(action)) {
            this._currentSynthesisID = action.id;
            this.notifyListeners();
        }
    }

    onSynthesisChange(handler: () => void) {
        this._listeners.push(handler);
    }

    private notifyListeners() {
        for (const listener of this._listeners) {
            listener();
        }
    }

    get syntheses() {
        return this._syntheses;
    }

    get currentSynthesisID() {
        return this._currentSynthesisID;
    }
}
