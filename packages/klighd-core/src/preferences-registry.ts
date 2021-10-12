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
import { Action, ICommand } from "sprotty";
import { Registry } from "./base/registry";
import { Connection, NotificationType } from "./services";

/** User preferences that change how the diagram view behaves. */
export interface Preferences {
    /**
     * Resize the diagram to fit the viewport if it is redrawn after a model update
     * or a viewport resize.
     */
    resizeToFit: boolean;

    /** Uses a light background instead of an applied theme. */
    forceLightBackground: boolean;

    /** Indicates whether or not a text selection should select the corresponding diagram part. */
    shouldSelectDiagram: boolean;

    /** Indicates whether or nat a selection in the diagram should also highlight the corresponding text. */
    shouldSelectText: boolean;

    /** Whether going to a Bookmark should be animated */
    animateGoToBookmark: boolean;

    /** 
     * Instructs the server how the diagram should be sent. Full sends the entire graph at once
     * and iterative sends the diagram in sequentially in pieces. 
     */
    diagramGenerator: "full" | "iterative";
}

/** {@link Registry} that stores user preferences which change the behavior of the diagram view. */
@injectable()
export class PreferencesRegistry extends Registry {
    private _preferences: Preferences;

    @inject(Connection) private connection: Connection;

    get preferences(): Preferences {
        return this._preferences;
    }

    constructor() {
        super();
        // Initialize default settings
        this._preferences = {
            resizeToFit: true,
            forceLightBackground: false,
            shouldSelectDiagram: true,
            shouldSelectText: false,
            animateGoToBookmark: true,
            diagramGenerator: "iterative",
        };
    }

    @postConstruct()
    init(): void {
        // Notify the server about initial preferences.
        this.notifyServer();
    }

    handle(action: Action): void | Action | ICommand {
        if (SetPreferencesAction.isThisAction(action)) {
            this._preferences = {
                ...this._preferences,
                resizeToFit: action.preferences.resizeToFit ?? this._preferences.resizeToFit,
                forceLightBackground:
                    action.preferences.forceLightBackground ??
                    this.preferences.forceLightBackground,
                shouldSelectDiagram:
                    action.preferences.shouldSelectDiagram ?? this._preferences.shouldSelectDiagram,
                shouldSelectText:
                    action.preferences.shouldSelectText ?? this._preferences.shouldSelectText,
                animateGoToBookmark: action.preferences.animateGoToBookmark ?? this._preferences.animateGoToBookmark,
                diagramGenerator: action.preferences.diagramGenerator ?? this._preferences.diagramGenerator,
            };
            this.notifyListeners();
            this.notifyServer();
        }
    }

    /** Notifies the server about changed preferences that are supported by the server. */
    private notifyServer() {
        this.connection.onReady().then(() => {
            this.connection.sendNotification(NotificationType.SetPreferences, {
                "diagram.shouldSelectDiagram": this._preferences.shouldSelectDiagram,
                "diagram.shouldSelectText": this.preferences.shouldSelectText,
                "diagram.diagramGenerator": this.preferences.diagramGenerator,
            });
        });
    }
}

/** Change the user preferences stored in the `klighd-core` container. */
export class SetPreferencesAction implements Action {
    static readonly KIND = "setPreferences";
    readonly kind = SetPreferencesAction.KIND;

    constructor(readonly preferences: Partial<Preferences>) { }

    /** Type predicate to narrow an action to this action. */
    static isThisAction(action: Action): action is SetPreferencesAction {
        return action.kind === SetPreferencesAction.KIND;
    }
}
