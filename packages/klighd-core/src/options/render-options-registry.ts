/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2022 by
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
import { ICommand } from "sprotty";
import { Action, UpdateModelAction } from "sprotty-protocol";
import { Registry } from "../base/registry";
import { PersistenceStorage } from "../services";
import { ResetRenderOptionsAction, SetRenderOptionAction } from "./actions";
import { RangeOption, RenderOption, TransformationOptionType } from "./option-models";

/**
 * Whether the sidebar panel is pinned or not. 
 */
export class PinSidebarOption implements RenderOption {
    static readonly ID: string = 'pin-sidebar';
    static readonly NAME: string = 'Pin Sidebar';
    static readonly DEFAULT: boolean = true
    readonly id: string = PinSidebarOption.ID;
    readonly name: string = PinSidebarOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = PinSidebarOption.DEFAULT;
    currentValue = PinSidebarOption.DEFAULT;
    invisible = true
}

/**
 * Resize the diagram to fit the viewport if it is redrawn after a model update
 * or a viewport resize.
 */
export class ResizeToFit implements RenderOption {
    static readonly ID: string = 'resize-to-fit';
    static readonly NAME: string = 'Resize To Fit on Refresh';
    static readonly DEFAULT: boolean = true
    readonly id: string = ResizeToFit.ID;
    readonly name: string = ResizeToFit.NAME;
    // readonly tooltip: string = ResizeToFit.TOOLTIP;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ResizeToFit.DEFAULT;
    readonly description = 'Always resize to fit after diagram refresh.'
    currentValue = ResizeToFit.DEFAULT;
}

/**
 * Uses a light background instead of an applied theme.
 */
export class ForceLightBackground implements RenderOption {
    static readonly ID: string = 'force-light-background';
    static readonly NAME: string = 'Use Light Background';
    static readonly DEFAULT: boolean = false
    readonly id: string = ForceLightBackground.ID;
    readonly name: string = ForceLightBackground.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ForceLightBackground.DEFAULT;
    readonly renderCategory: string = Appearance.ID
    readonly description = 'Use light background regardless of the color scheme.'
    currentValue = ForceLightBackground.DEFAULT;
}

export class ShowConstraintOption implements RenderOption {
    static readonly ID: string = 'show-constraints';
    static readonly NAME: string = 'Show Constraint';
    readonly id: string = ShowConstraintOption.ID;
    readonly name: string = ShowConstraintOption.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = false;
    readonly renderCategory: string = Appearance.ID
    readonly description = 'Show marker for nodes that have layout constraints set.'
    currentValue = false;
}
export class Appearance implements RenderOption {
    static readonly ID: string = 'appearance'
    static readonly NAME: string = 'Appearance'
    readonly id: string = Appearance.ID
    readonly name: string = Appearance.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CATEGORY
    readonly initialValue: boolean = true
    readonly description = 'Appearance Category'
    currentValue = true
}

/**
 * Smart Zoom category.
 */
export class SmartZoom implements RenderOption {
    static readonly ID: string = 'smart-zoom'
    static readonly NAME: string = 'Smart Zoom'
    readonly id: string = SmartZoom.ID
    readonly name: string = SmartZoom.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CATEGORY
    readonly initialValue: boolean = true
    readonly renderCategory: string = Appearance.ID
    readonly description = 'Smart Zoom Category'
    currentValue = true
}

/**
 * Boolean option to enable and disable the smart zoom feature.
 * This corresponds to the automatic detail level of regions and states
 * as well as limiting visible elements.
 */
export class UseSmartZoom implements RenderOption {
    static readonly ID: string = 'use-smart-zoom'
    static readonly NAME: string = 'Enable Smart Zoom'
    readonly id: string = UseSmartZoom.ID
    readonly name: string = UseSmartZoom.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHECK
    readonly initialValue: boolean = true
    readonly renderCategory: string = SmartZoom.ID
    readonly description = 'Enable Smart Zoom'
    currentValue = true
}

/**
 * Threshold for full detail level.
 * Corresponds to the regions size compared to the current viewport.
 */
export class FullDetailRelativeThreshold implements RangeOption {
    static readonly ID: string = 'full-detail-relative-threshold'
    static readonly NAME: string = 'Full Detail Relative Threshold'
    static readonly DEFAULT: number = 0.15
    readonly id: string = FullDetailRelativeThreshold.ID
    readonly name: string = FullDetailRelativeThreshold.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range = {
        first: 0.01,
        second: 1
    }
    readonly stepSize = 0.01
    readonly initialValue: number = FullDetailRelativeThreshold.DEFAULT
    readonly renderCategory: string = SmartZoom.ID
    readonly description = 'Shows all children of an element that uses at least the amount of the canvas.'
        + 'A value of 0.2 means an element is shown if its parent has at least 0.2 the size (minimum of width and height) of the canvas.'
    currentValue = 0.2
}

/**
 * Threshold for full detail level.
 * Corresponds to the regions scale using the current viewport.
 */
export class FullDetailScaleThreshold implements RangeOption {
    static readonly ID: string = 'full-detail-scale-threshold'
    static readonly NAME: string = 'Full Detail Scale Threshold'
    static readonly DEFAULT: number = 0.25
    readonly id: string = FullDetailScaleThreshold.ID
    readonly name: string = FullDetailScaleThreshold.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range = {
        first: 0.01,
        second: 1
    }
    readonly stepSize = 0.01
    readonly initialValue: number = FullDetailScaleThreshold.DEFAULT
    readonly renderCategory: string = SmartZoom.ID
    readonly description = 'Show an element if it can be rendered in at least the given amount of it original size.'
        + 'A value of 0.25 means an element is shown if it can be drawn in a fourth of its original height or width.'
    currentValue = 0.25
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
    readonly renderCategory: string = SmartZoom.ID
    readonly description = 'Whether small text is simplified to colored rectangles.'
    currentValue = true
}

/**
 * Threshold under which text element simplification occurs in pixels.
 */
export class TextSimplificationThreshold implements RangeOption {
    static readonly ID: string = 'text-simplification-threshold'
    static readonly NAME: string = 'Text Simplification Threshold'
    static readonly DEFAULT: number = 3
    readonly id: string = TextSimplificationThreshold.ID
    readonly name: string = TextSimplificationThreshold.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range = {
        first: 1,
        second: 10
    }
    readonly stepSize = 0.1
    readonly initialValue: number = TextSimplificationThreshold.DEFAULT
    readonly renderCategory: string = SmartZoom.ID
    readonly description = 'The threshold font size to simplify text.\nIf set to 3 a text which is 3 or less pixel high is simplified.'
    currentValue = 3
}

/**
 * The factor by which titles of collapsed regions get scaled by
 * in relation to their size at native resolution.
 */
export class TitleScalingFactor implements RangeOption {
    static readonly ID: string = 'title-scaling-factor'
    static readonly NAME: string = 'Title Scaling Factor'
    static readonly DEFAULT: number = 1
    readonly id: string = TitleScalingFactor.ID
    readonly name: string = TitleScalingFactor.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range = {
        first: 0.5,
        second: 3
    }
    readonly stepSize = 0.01
    readonly initialValue: number = TitleScalingFactor.DEFAULT
    readonly renderCategory: string = SmartZoom.ID
    readonly description = 'Factor to scale region titles compared to their original size.\nIf set to 1 a region title will never exceed their original size.'
    currentValue = 1
}

/**
 * Boolean option to toggle the scaling of lines based on zoom level.
 */
export class UseMinimumLineWidth implements RenderOption {
    static readonly ID: string = 'use-minimum-line-width'
    static readonly NAME: string = 'Minimum Line Width'
    readonly id: string = UseMinimumLineWidth.ID
    readonly name: string = UseMinimumLineWidth.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHECK
    readonly initialValue: boolean = true
    readonly renderCategory: string = SmartZoom.ID
    readonly description = "Whether all borders and lines are at least as wide as set by the corresponding 'Minimum Line Width' option."
    currentValue = true
}

/**
 * The size scaled lines should have as a minimum at any zoom level in pixels.
 */
export class MinimumLineWidth implements RangeOption {
    static readonly ID: string = 'minimum-line-width'
    static readonly NAME: string = 'Minimum Line Width'
    static readonly DEFAULT: number = 1
    readonly id: string = MinimumLineWidth.ID
    readonly name: string = MinimumLineWidth.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range = {
        first: 0.1,
        second: 3
    }
    readonly stepSize = 0.01
    readonly initialValue: number = 0.5
    readonly renderCategory: string = SmartZoom.ID
    readonly description = "The minium border or line width.\nIf set to 0.5 each edge or border is at least 0.5 pixel wide."
    currentValue = 0.5
}

export enum ShadowOption {
    /** A real svg shadow. */
    PAPER_MODE = 'Paper Mode',
    /** The shape of the node drawn with different opacity multiple times behind the node. */
    KIELER_STYLE = 'KIELER Style'
}

/**
 * The style shadows should be drawn in, either the paper mode shadows (nice, but slow in
 * performance) or in default KIELER-style (fast, not as nice looking).
 */
export class Shadows implements RenderOption {
    static readonly ID: string = 'paper-shadows'
    static readonly NAME: string = 'Shadow Mode'
    static readonly DEFAULT: ShadowOption = ShadowOption.KIELER_STYLE
    readonly id: string = Shadows.ID
    readonly name: string = Shadows.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHOICE
    readonly initialValue: ShadowOption = Shadows.DEFAULT
    readonly renderCategory: string = Appearance.ID
    readonly renderChoiceValues? = [ShadowOption.PAPER_MODE, ShadowOption.KIELER_STYLE]
    readonly description = 'The style shadows should be drawn in, either the paper mode shadows (nice, but slow in performance)'
     + 'or in default KIELER Style (fast, not as nice looking).'
     + 'KIELER Style multiple shapes in form of the node behind it.'
     + 'Paper Mode uses SVG shadows.'
    currentValue = Shadows.DEFAULT
}

/**
 * Whether going to a Bookmark should be animated
 */
export class AnimateGoToBookmark implements RenderOption {
    static readonly ID: string = 'animate-go-to-bookmark';
    static readonly NAME: string = 'Animate Go To Bookmark';
    static readonly DEFAULT: boolean = true
    readonly id: string = AnimateGoToBookmark.ID;
    readonly name: string = AnimateGoToBookmark.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = AnimateGoToBookmark.DEFAULT;
    currentValue = true;
}


export interface RenderOptionType {
    readonly ID: string,
    readonly NAME: string,
    new(): RenderOption,
}

export interface RenderOptionDefault extends RenderOptionType {
    readonly DEFAULT: any,
}

/** {@link Registry} that stores and updates different render options. */
@injectable()
export class RenderOptionsRegistry extends Registry {
    private _renderOptions: Map<string, RenderOption> = new Map();

    @inject(PersistenceStorage) private storage: PersistenceStorage;

    constructor() {
        super();
        // Add available render options to this registry
        this.register(ResizeToFit);
        this.register(AnimateGoToBookmark);

        // Appearance
        this.register(Appearance)

        this.register(ForceLightBackground);
        this.register(ShowConstraintOption);
        this.register(Shadows)

        // Smart Zoom
        this.register(SmartZoom)
        
        this.register(UseSmartZoom);
        this.register(FullDetailRelativeThreshold)
        this.register(FullDetailScaleThreshold)

        this.register(SimplifySmallText);
        this.register(TextSimplificationThreshold);

        this.register(TitleScalingFactor);

        this.register(UseMinimumLineWidth);
        this.register(MinimumLineWidth);
    }

    @postConstruct()
    init(): void {
        this.storage.getItem<Record<string, unknown>>('render').then((data) => {
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

    register(Option: RenderOptionType): void {
        this._renderOptions.set(Option.ID, new Option())
    }

    handle(action: Action): void | Action | ICommand {
        if (SetRenderOptionAction.isThisAction(action)) {
            const option = this._renderOptions.get(action.id);

            if (!option) return;

            option.currentValue = action.value;
            this.notifyListeners();

        } else if (ResetRenderOptionsAction.isThisAction(action)) {
            this._renderOptions.forEach((option) => {
                option.currentValue = option.initialValue;
            });
            this.notifyListeners();

        }
        return UpdateModelAction.create([], { animate: false, cause: action })
    }

    get allRenderOptions(): RenderOption[] {
        return Array.from(this._renderOptions.values());
    }

    getValue(Option: RenderOptionType): any | undefined {
        return this._renderOptions.get(Option.ID)?.currentValue;
    }

    getValueOrDefault(Option: RenderOptionDefault): any {
        return this.getValue(Option) ?? Option.DEFAULT
    }
}
