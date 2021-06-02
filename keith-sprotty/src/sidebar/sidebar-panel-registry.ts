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

import { injectable, multiInject, optional } from "inversify";
import { Action, IActionHandler, ICommand } from "sprotty";
import { DISymbol } from "../di.symbols";
import { ToggleSidebarPanelAction } from "./actions";
import { ISidebarPanel } from "./sidebar-panel";

/**
 * Simply registry that stores all sidebar panels that are resolved by the DI container.
 * At most one panel is considered active. The state (which panel is active) can
 * be changed with an {@link ToggleSidebarPanelAction}.
 * 
 * Other components can subscribe to this registry to be informed about state changes.
 */
@injectable()
export class SidebarPanelRegistry implements IActionHandler {
    private _panels: Map<string, ISidebarPanel>;
    private _currentPanelID: string | null;

    private _listeners: (() => void)[];

    constructor(@multiInject(DISymbol.SidebarPanel) @optional() panels: ISidebarPanel[] = []) {
        this._panels = new Map();
        this._currentPanelID = null;
        this._listeners = [];

        for (const panel of panels) {
            this._panels.set(panel.id, panel);
        }
    }

    onCurrentPanelChange(listener: () => void) {
        this._listeners.push(listener);
    }

    private notifyListener() {
        for (const listener of this._listeners) {
            listener();
        }
    }

    handle(action: Action): void | Action | ICommand {
        if (ToggleSidebarPanelAction.isThisAction(action)) {
            // Nothing to do if the panel should be shown/hidden and is already active/inactive.
            if (this._currentPanelID === action.id && action.state === "show") return;
            if (this._currentPanelID !== action.id && action.state === "hide") return;

            if (this._currentPanelID === action.id) {
                // Panel is active so it should either be hidden explicitly or toggled to be hidden
                this._currentPanelID = null;
                this.notifyListener();
            } else if (this._panels.has(action.id)) {
                // Panel is inactive and id exists so it should either be shown explicitly or toggled to be shown
                this._currentPanelID = action.id;
                this.notifyListener();
            }
        }
    }

    get allPanel(): ISidebarPanel[] {
        return Array.from(this._panels.values());
    }

    get currentPanel(): ISidebarPanel | null {
        return this._currentPanelID === null
            ? null
            : this._panels.get(this._currentPanelID) ?? null;
    }

    get currentPanelID() {
        return this._currentPanelID;
    }
}
