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

import { RefreshDiagramAction } from "@kieler/klighd-interactive/lib/actions";
import { inject, injectable, postConstruct } from "inversify";
import { Action, ICommand } from "sprotty";
import { Registry } from "../base/registry";
import { PersistenceStorage } from "../services";
import { SetRenderOptionAction } from "./actions";
import { RenderOption, TransformationOptionType } from "./option-models";

export class ShowConstraintOption implements RenderOption {
    static readonly ID: string = "show-constraints";
    static readonly NAME: string = "Show Constraint";
    readonly id: string = ShowConstraintOption.ID;
    readonly name: string = ShowConstraintOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = false;
    currentValue = false;
}

/** {@link Registry} that stores and updates different render options. */
@injectable()
export class RenderOptionsRegistry extends Registry {
    private _renderOptions: Map<string, RenderOption> = new Map();

    @inject(PersistenceStorage) private storage: PersistenceStorage;

    constructor() {
        super();
        // Add available render options to this registry
        this._renderOptions.set(ShowConstraintOption.ID, new ShowConstraintOption());
    }

    @postConstruct()
    init(): void {
        this.storage.getItem<Record<string, unknown>>("render").then((data) => {
            if (data) this.loadPersistedData(data);
        });
    }

    /**
     * Restores options that where previously persisted in storage. Since render
     * options are not provided by the server, they have to be retrieved from storage.
     */
    private loadPersistedData(data: Record<string, unknown>) {
        for (const entry of Object.entries(data)) {
            const option = this._renderOptions.get(entry[0]);
            if (!option) continue;

            option.currentValue = entry[1];
        }
        this.notifyListeners();
    }

    handle(action: Action): void | Action | ICommand {
        if (SetRenderOptionAction.isThisAction(action)) {
            const option = this._renderOptions.get(action.id);

            if (!option) return;

            option.currentValue = action.value;
            this.notifyListeners();

            return new RefreshDiagramAction();
        }
    }

    get allRenderOptions(): RenderOption[] {
        return Array.from(this._renderOptions.values());
    }

    getValueForId(id: string): any | undefined {
        return this._renderOptions.get(id)?.currentValue;
    }
}
