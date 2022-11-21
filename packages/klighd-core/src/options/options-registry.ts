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
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { inject, injectable } from "inversify";
import { ActionHandlerRegistry, IActionHandlerInitializer, ICommand } from "sprotty";
import { Action } from "sprotty-protocol";
import { Registry } from "../base/registry";
import { Connection, NotificationType } from "../services";
import {
    PerformOptionsActionAction,
    ResetLayoutOptionsAction,
    ResetSynthesisOptionsAction,
    SetLayoutOptionsAction,
    SetSynthesisOptionsAction,
    UpdateOptionsAction,
} from "./actions";
import {
    DisplayedActionData,
    LayoutOptionUIData,
    LayoutOptionValue,
    SynthesisOption,
} from "./option-models";
import { optionsBlacklist } from "./options-blacklist";

/**
 * {@link Registry} that stores and manages KLighD options provided by the server.
 *
 * Acts as an action handler that handles UpdateOptionsActions and modifications
 * to the Options. Changes are synchronized with the server.
 */
@injectable()
export class OptionsRegistry extends Registry implements IActionHandlerInitializer {
    @inject(Connection) connection: Connection;

    private _modelUri = "";
    private _synthesisOptions: SynthesisOption[] = [];
    private _layoutOptions: LayoutOptionUIData[] = [];
    private _displayedActions: DisplayedActionData[] = [];

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

    /** Returns `true` when the registry contains options and is therefore not empty. */
    hasOptions(): boolean {
        return (
            this._displayedActions.length !== 0 ||
            this._synthesisOptions.length !== 0 ||
            this._layoutOptions.length !== 0
        );
    }

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(UpdateOptionsAction.KIND, this);
        registry.register(PerformOptionsActionAction.KIND, this);
        registry.register(SetSynthesisOptionsAction.KIND, this);
        registry.register(SetLayoutOptionsAction.KIND, this);
        registry.register(ResetSynthesisOptionsAction.KIND, this);
        registry.register(ResetLayoutOptionsAction.KIND, this);
    }

    handle(action: Action): void | Action | ICommand {
        if (UpdateOptionsAction.isThisAction(action)) {
            this.handleUpdateOptions(action);
        } else if (PerformOptionsActionAction.isThisAction(action)) {
            this.handlePerformOptionsAction(action);
        } else if (SetSynthesisOptionsAction.isThisAction(action)) {
            this.handleSetSynthesisOptions(action);
        } else if (SetLayoutOptionsAction.isThisAction(action)) {
            this.handleSetLayoutOptions(action);
        } else if (ResetSynthesisOptionsAction.isThisAction(action)) {
            this.handleResetSynthesisOptions(action);
        } else if (ResetLayoutOptionsAction.isThisAction(action)) {
            this.handleResetLayoutOptions(action);
        }
    }

    private handleUpdateOptions(action: UpdateOptionsAction): void {
        this._modelUri = action.modelUri;
        this._displayedActions = action.actions;

        // Transform valued synthesis options to synthesis options by setting their current value and remove blacklisted options
        this._synthesisOptions = action.valuedSynthesisOptions
            .filter((opt) => !optionsBlacklist.includes(opt.synthesisOption.id))
            .map<SynthesisOption>((valuedOption) => ({
                ...valuedOption.synthesisOption,
                currentValue:
                    valuedOption.currentValue ?? valuedOption.synthesisOption.initialValue,
            }));

        // Transform layout options to ensure that they have a current value.
        // Fallback to an already stored currentValue, since the server does not provide a current value for layout options.
        this._layoutOptions = action.layoutOptions.map<LayoutOptionUIData>((option, i) => ({
            ...option,
            currentValue:
                option.currentValue ??
                this._layoutOptions[i]?.currentValue ??
                option.defaultValue.k,
        }));

        this.notifyListeners();
    }

    private handlePerformOptionsAction(action: PerformOptionsActionAction) {
        this.connection.sendNotification(NotificationType.PerformAction, {
            actionId: action.actionId,
            uri: this.modelUri,
        });
    }

    private handleSetSynthesisOptions(action: SetSynthesisOptionsAction) {
        // Optimistic update. Replaces all changed options with the new options
        this._synthesisOptions = this._synthesisOptions.map(
            (option) => action.options.find((newOpt) => newOpt.id === option.id) ?? option
        );
        this.notifyListeners();

        if (action.sendToServer) {
            this.connection.sendNotification(NotificationType.SetSynthesisOption, {
                synthesisOptions: action.options,
                uri: this.modelUri,
            });
        }
    }

    private handleSetLayoutOptions(action: SetLayoutOptionsAction) {
        // Optimistic update. Replaces all changed options with the new options
        this._layoutOptions = this._layoutOptions.map((option) => {
            const newValue = action.options.find((newOpt) => newOpt.optionId === option.optionId);
            return newValue ? { ...option, currentValue: newValue.value } : option;
        });
        this.notifyListeners();

        if (action.sendToServer) {
            this.connection.sendNotification(NotificationType.SetLayoutOption, {
                layoutOptions: action.options,
                uri: this.modelUri,
            });
        }
    }

    private handleResetSynthesisOptions(action: ResetSynthesisOptionsAction) {
        this._synthesisOptions = this._synthesisOptions.map((option) => ({
            ...option,
            currentValue: option.initialValue,
        }));
        this.notifyListeners();

        if (action.sendToServer) {
            this.connection.sendNotification(NotificationType.SetSynthesisOption, {
                synthesisOptions: this._synthesisOptions,
                uri: this.modelUri,
            });
        }
    }

    private handleResetLayoutOptions(action: ResetLayoutOptionsAction) {
        this._layoutOptions = this._layoutOptions.map((option) => ({
            ...option,
            currentValue: option.defaultValue.k,
        }));
        this.notifyListeners();

        if (action.sendToServer) {
            this.connection.sendNotification(NotificationType.SetLayoutOption, {
                layoutOptions: this._layoutOptions.map<LayoutOptionValue>((o) => ({
                    optionId: o.optionId,
                    value: o.currentValue,
                })),
                uri: this.modelUri,
            });
        }
    }
}
