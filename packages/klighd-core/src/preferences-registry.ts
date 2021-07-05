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

import { injectable } from "inversify";
import { Action, ICommand } from "sprotty";
import { Registry } from "./base/registry";

/** User preferences that change how the diagram view behaves. */
export interface Preferences {
    /**
     * Resize the diagram to fit the viewport if it is redrawn after a model update
     * or a viewport resize.
     */
    resizeToFit: boolean;
    /** Uses a light background instead of an applied theme. */
    forceLightBackground: boolean;
}

/** {@link Registry} that stores user preferences which change the behavior of the diagram view. */
@injectable()
export class PreferencesRegistry extends Registry {
    private _preferences: Preferences;

    get preferences(): Preferences {
        return this._preferences;
    }

    constructor() {
        super();
        // Initialize default settings
        this._preferences = {
            resizeToFit: true,
            forceLightBackground: false,
        };
    }

    handle(action: Action): void | Action | ICommand {
        if (SetPreferencesAction.isThisAction(action)) {
            this._preferences = {
                ...this._preferences,
                resizeToFit: action.preferences.resizeToFit ?? this._preferences.resizeToFit,
                forceLightBackground:
                    action.preferences.forceLightBackground ??
                    this.preferences.forceLightBackground,
            };
            this.notifyListeners();
        }
    }
}

/** Change the user preferences stored in the `klighd-core` container. */
export class SetPreferencesAction implements Action {
    static readonly KIND = "setPreferences";
    readonly kind = SetPreferencesAction.KIND;

    constructor(readonly preferences: Partial<Preferences>) {}

    /** Type predicate to narrow an action to this action. */
    static isThisAction(action: Action): action is SetPreferencesAction {
        return action.kind === SetPreferencesAction.KIND;
    }
}
