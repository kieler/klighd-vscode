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

import { injectable } from "inversify";
import { Action, IActionHandler, ICommand } from "sprotty";
import { isUpdateOptionsAction } from "./actions";
import { DisplayedActionData, LayoutOptionUIData, ValuedSynthesisOption } from "./option-models";

/**
 * Registry that stores and manages KLighD options provided by the server.
 * 
 * Acts as an action handler that handles UpdateOptionsActions.
 */
@injectable()
export class OptionsRegistry implements IActionHandler {
    private _modelUri: string = "";
    private _valuedSynthesisOptions: ValuedSynthesisOption[] = [];
    private _layoutOptions: LayoutOptionUIData[] = [];
    private _displayedActions: DisplayedActionData[] = [];

    handle(action: Action): void | Action | ICommand {
        // Abort early if this handler is registered for another action
        if (!isUpdateOptionsAction(action)) return;

        this._modelUri = action.modelUri;
        this._valuedSynthesisOptions = action.valuedSynthesisOptions;
        this._displayedActions = action.actions;
        this._layoutOptions = action.layoutOptions;
    }

    get modelUri(): string {
        return this._modelUri;
    }

    get valuedSynthesisOptions(): ValuedSynthesisOption[] {
        return this._valuedSynthesisOptions;
    }

    get layoutOptions(): LayoutOptionUIData[] {
        return this._layoutOptions;
    }

    get displayedActions(): DisplayedActionData[] {
        return this._displayedActions;
    }
}
