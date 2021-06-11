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

import { RefreshDiagramAction } from "@kieler/keith-interactive/lib/actions";
import { injectable } from "inversify";
import { Action, ICommand } from "sprotty";
import { Registry } from "../base/registry";
import { SetRenderOptionAction } from "./actions";
import { RenderOption, TransformationOptionType } from "./option-models";

export class ShowConstraintOption implements RenderOption {
    static readonly ID: string = "show-constraints";
    static readonly NAME: string = "Show Constraint";
    readonly id: string = ShowConstraintOption.ID;
    readonly name: string = ShowConstraintOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = false;
    currentValue: boolean = false;
}

@injectable()
export class RenderOptionsRegistry extends Registry {
    private _renderOptions: Map<string, RenderOption> = new Map();

    constructor() {
        super();
        this._renderOptions.set(ShowConstraintOption.ID, new ShowConstraintOption());
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

    get allRenderOptions() {
        return Array.from(this._renderOptions.values());
    }

    getValueForId(id: string): any | undefined {
        return this._renderOptions.get(id)?.currentValue;
    }
}
