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
import { Action, ICommand, UpdateModelAction } from "sprotty";
import { Registry } from "../base/registry";
import { SetRenderOptionAction } from "./actions";
import { RangeOption, RenderOption, TransformationOptionType } from "./option-models";

export class ShowConstraintOption implements RenderOption {
    static readonly ID: string = "show-constraints";
    static readonly NAME: string = "Show Constraint";
    readonly id: string = ShowConstraintOption.ID;
    readonly name: string = ShowConstraintOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = false;
    currentValue = false;
}

/**
 * Boolean option to enable and disable the smart zoom feature.
 * This corresponds to the automatic detail level of regions and states
 * as well as limiting visible elements.
 */
export class UseSmartZoom implements RenderOption {
    static readonly ID: string = 'use-smart-zoom'
    static readonly NAME: string = 'Smart Zoom'
    readonly id: string = UseSmartZoom.ID
    readonly name: string = UseSmartZoom.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHECK
    readonly initialValue: boolean = true
    currentValue = true
}

/**
 * Threshold for full detail level.
 * Corresponds to the regions size compared to the current viewport.
 */
export class FullDetailThreshold implements RangeOption {
    static readonly ID: string = 'full-detail-threshold'
    static readonly NAME: string = 'Full Detail Threshold'
    readonly id: string = FullDetailThreshold.ID
    readonly name: string = FullDetailThreshold.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range = {
        first: 0.01,
        second: 1
    }
    readonly stepSize = 0.01
    readonly initialValue: number = 0.2
    currentValue = 0.2
}


/**
 * Boolean option toggling the use of text element replacement with rectangles.
 */
export class SimplifySmallText implements RenderOption {
    static readonly ID: string = 'simplify-small-text'
    static readonly NAME: string = 'Simplify Small Text'
    readonly id: string = SimplifySmallText.ID
    readonly name: string = SimplifySmallText.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHECK
    readonly initialValue: boolean = true
    currentValue = true
}

/**
 * Threshold under which text element simplification occurs in pixels.
 */
export class TextSimplificationThreshold implements RangeOption {
    static readonly ID: string = 'text-simplification-threshold'
    static readonly NAME: string = 'Text Simplification Threshold'
    readonly id: string = TextSimplificationThreshold.ID
    readonly name: string = TextSimplificationThreshold.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range = {
        first: 1,
        second: 10
    }
    readonly stepSize = 0.1
    readonly initialValue: number = 3
    currentValue = 3
}

/**
 * The factor by which titles of colapsed regions get scaled by
 * in relation to their size at native resolution.
 */
export class TitleScalingFactor implements RangeOption {
    static readonly ID: string = 'title-scaling-factor'
    static readonly NAME: string = 'Title Scaling Factor'
    readonly id: string = TitleScalingFactor.ID
    readonly name: string = TitleScalingFactor.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range = {
        first: 0.5,
        second: 3
    }
    readonly stepSize = 0.01
    readonly initialValue: number = 1
    currentValue = 1
}
/**
 * The threshold at which the title will no longer overlay  
 */
export class TitleOverlayThreshold implements RangeOption {
    static readonly ID: string = 'title-overlay-threshold'
    static readonly NAME: string = 'Title Overlay Threshold'
    readonly id: string = TitleOverlayThreshold.ID
    readonly name: string = TitleOverlayThreshold.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range = {
        first: 1,
        second: 7
    }
    readonly stepSize = 0.01
    readonly initialValue: number = 4
    currentValue = 4
}
/**
 * Boolean option to toggle the scaling of lines based on zoom level.
 */
export class UseConstantLineWidth implements RenderOption {
    static readonly ID: string = 'use-constant-line-width'
    static readonly NAME: string = 'Constant Line Width'
    readonly id: string = UseConstantLineWidth.ID
    readonly name: string = UseConstantLineWidth.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHECK
    readonly initialValue: boolean = true
    currentValue = true
}

/**
 * The size scaled lines should have at any zoom level in pixels.
 */
export class ConstantLineWidth implements RangeOption {
    static readonly ID: string = 'constant-line-width'
    static readonly NAME: string = 'Constant Line Width'
    readonly id: string = ConstantLineWidth.ID
    readonly name: string = ConstantLineWidth.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range = {
        first: 0.1,
        second: 3
    }
    readonly stepSize = 0.01
    readonly initialValue: number = 0.5
    currentValue = 0.5
}

/** {@link Registry} that stores and updates different render options. */
@injectable()
export class RenderOptionsRegistry extends Registry {
    private _renderOptions: Map<string, RenderOption> = new Map();

    constructor() {
        super();
        // Add available render options to this registry
        this._renderOptions.set(ShowConstraintOption.ID, new ShowConstraintOption());

        this._renderOptions.set(UseSmartZoom.ID, new UseSmartZoom());
        this._renderOptions.set(FullDetailThreshold.ID, new FullDetailThreshold());

        this._renderOptions.set(SimplifySmallText.ID, new SimplifySmallText());
        this._renderOptions.set(TextSimplificationThreshold.ID, new TextSimplificationThreshold());

        this._renderOptions.set(TitleScalingFactor.ID, new TitleScalingFactor());
        this._renderOptions.set(TitleOverlayThreshold.ID, new TitleOverlayThreshold());

        this._renderOptions.set(UseConstantLineWidth.ID, new UseConstantLineWidth());
        this._renderOptions.set(ConstantLineWidth.ID, new ConstantLineWidth());
    }

    handle(action: Action): void | Action | ICommand {
        if (SetRenderOptionAction.isThisAction(action)) {
            const option = this._renderOptions.get(action.id);

            if (!option) return;

            option.currentValue = action.value;
            this.notifyListeners();

            return new UpdateModelAction([], false, action)

        }
    }

    get allRenderOptions(): RenderOption[] {
        return Array.from(this._renderOptions.values());
    }

    getValueForId(id: string): any | undefined {
        return this._renderOptions.get(id)?.currentValue;
    }
}
