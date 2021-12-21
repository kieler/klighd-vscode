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

import { inject, injectable, postConstruct } from "inversify";
import {
    ActionHandlerRegistry,
    IActionDispatcher,
    IActionHandler,
    IActionHandlerInitializer,
    ICommand,
    TYPES,
} from "sprotty";
import { Action } from "sprotty-protocol";
import { PersistenceStorage } from "../services";
import {
    ResetLayoutOptionsAction,
    ResetRenderOptionsAction,
    ResetSynthesisOptionsAction,
    SetLayoutOptionsAction,
    SetRenderOptionAction,
    SetSynthesisOptionsAction,
} from "./actions";

/**
 * {@link IActionHandler} that handles update actions for various options.
 * This handler persists the updates so they will still be available when a user
 * closes and reopens the diagram view.
 */
@injectable()
export class OptionsPersistence implements IActionHandler, IActionHandlerInitializer {
    @inject(PersistenceStorage) private storage: PersistenceStorage;
    @inject(TYPES.IActionDispatcher) private dispatcher: IActionDispatcher;

    @postConstruct()
    init(): void {
        this.storage.onClear(this.handleClear.bind(this));
    }

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(SetRenderOptionAction.KIND, this);
        registry.register(SetLayoutOptionsAction.KIND, this);
        registry.register(SetSynthesisOptionsAction.KIND, this);
    }

    handle(action: Action): void | Action | ICommand {
        if (SetRenderOptionAction.isThisAction(action)) {
            this.storage.setItem<Record<string, unknown>>("render", (prev) => {
                const obj = prev ?? {};
                obj[action.id] = action.value;
                return obj;
            });
        } else if (SetLayoutOptionsAction.isThisAction(action)) {
            this.storage.setItem<Record<string, unknown>>("layout", (prev) => {
                const obj = prev ?? {};
                for (const option of action.options) {
                    obj[option.optionId] = option.value;
                }
                return obj;
            });
        } else if (SetSynthesisOptionsAction.isThisAction(action)) {
            this.storage.setItem<Record<string, unknown>>("synthesis", (prev) => {
                const obj = prev ?? {};
                for (const option of action.options) {
                    obj[option.id] = option.currentValue;
                }
                return obj;
            });
        }
    }

    /** Reset all stored options when the storage gets cleared from outside. */
    private handleClear() {
        this.dispatcher.dispatch(ResetRenderOptionsAction.create());
        this.dispatcher.dispatch(ResetSynthesisOptionsAction.create());
        this.dispatcher.dispatch(ResetLayoutOptionsAction.create());
    }
}
