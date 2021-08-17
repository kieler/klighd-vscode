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
import {
    Action,
    ActionHandlerRegistry,
    IActionHandler,
    IActionHandlerInitializer,
    ICommand,
} from "sprotty";
import { PersistenceStorage } from "../services";
import {
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
}
