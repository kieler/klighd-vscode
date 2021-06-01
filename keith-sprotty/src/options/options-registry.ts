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

import { inject, injectable } from "inversify";
import { Action, IActionHandler, ICommand } from "sprotty";
import { Connection, NotificationType } from "../services";
import {
    isPerformOptionsActionAction,
    isSetLayoutOptionsAction,
    isSetSynthesisOptionsAction,
    isUpdateOptionsAction,
} from "./actions";
import {
    DisplayedActionData,
    LayoutOptionUIData,
    LayoutOptionValue,
    SynthesisOption,
} from "./option-models";

/**
 * Registry that stores and manages KLighD options provided by the server.
 *
 * Acts as an action handler that handles UpdateOptionsActions and modifications
 * to the Options. Changes are synchronized with the server.
 */
@injectable()
export class OptionsRegistry implements IActionHandler {
    @inject(Connection) connection: Connection;

    private _modelUri: string = "";
    private _synthesisOptions: SynthesisOption[] = [];
    private _layoutOptions: LayoutOptionUIData[] = [];
    private _displayedActions: DisplayedActionData[] = [];

    private _listeners: (() => void)[] = [];

    handle(action: Action): void | Action | ICommand {
        // Abort early if this handler is registered for another action
        if (isUpdateOptionsAction(action)) {
            this._modelUri = action.modelUri;
            this._displayedActions = action.actions;
            this._layoutOptions = action.layoutOptions;

            // Transform valued synthesis options to synthesis options by setting their current value
            this._synthesisOptions = action.valuedSynthesisOptions.map<SynthesisOption>(
                (valuedOption) => {
                    return {
                        ...valuedOption.synthesisOption,
                        currentValue:
                            valuedOption.currentValue ?? valuedOption.synthesisOption.initialValue,
                    };
                }
            );

            this.notifyListeners();
        } else if (isPerformOptionsActionAction(action)) {
            this.connection.sendNotification(NotificationType.PerformAction, {
                actionId: action.actionId,
                uri: this.modelUri,
            });
        } else if (isSetSynthesisOptionsAction(action)) {
            // Optimistic update. Replaces all changed options with the new options
            this.updateSynthesisOptions(action.options);

            this.connection.sendNotification(NotificationType.SetSynthesisOption, {
                synthesisOptions: action.options,
                uri: this.modelUri,
            });
        } else if (isSetLayoutOptionsAction(action)) {
            // Optimistic update. Replaces all changed options with the new options
            this.updateLayoutOptions(action.options);

            this.connection.sendNotification(NotificationType.SetSynthesisOption, {
                layoutOptions: action.options,
                uri: this.modelUri,
            });
        }
    }

    onOptionsChange(handler: () => void) {
        this._listeners.push(handler);
    }

    private notifyListeners() {
        for (const listener of this._listeners) {
            listener();
        }
    }

    private updateSynthesisOptions(newOptions: SynthesisOption[]): void {
        this._synthesisOptions = this._synthesisOptions.map(
            (option) => newOptions.find((newOpt) => newOpt.id === option.id) ?? option
        );
        this.notifyListeners();
    }

    private updateLayoutOptions(newValues: LayoutOptionValue[]): void {
        this._layoutOptions = this._layoutOptions.map((option) => {
            const newValue = newValues.find((newOpt) => newOpt.optionId === option.optionId);
            return newValue ? { ...option, currentValue: newValue.value } : option;
        });
        this.notifyListeners();
    }

    get modelUri(): string {
        return this._modelUri;
    }

    get valuedSynthesisOptions(): SynthesisOption[] {
        return this._synthesisOptions;
    }

    get layoutOptions(): LayoutOptionUIData[] {
        return this._layoutOptions;
    }

    get displayedActions(): DisplayedActionData[] {
        return this._displayedActions;
    }
}
