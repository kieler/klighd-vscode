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
import { ProxyViewFilterCategory, ProxyViewFilterDistant, ProxyViewFilterUnconnectedToOnScreen, ProxyViewFilterUnconnectedToSelected } from "../proxy-view/filters/proxy-view-filter-options";
import { ProxyViewCapProxyToParent, ProxyViewCapScaleToOne, ProxyViewCategory, ProxyViewClusteringCascading, ProxyViewClusteringEnabled, ProxyViewClusteringSweepLine, ProxyViewClusterTransparent, ProxyViewDebugCategory, ProxyViewActionsEnabled, ProxyViewEnabled, ProxyViewHighlightSelected, ProxyViewOpacityByDistance, ProxyViewOpacityBySelected, ProxyViewSize, ProxyViewStackingOrderByDistance, ProxyViewUsePositionsCache, ProxyViewUseSynthesisProxyRendering, ProxyViewDrawStraightEdges, ProxyViewUseDetailLevel, ProxyViewStackingOrderByOpacity, ProxyViewStackingOrderBySelected, ProxyViewTitleScaling } from "../proxy-view/proxy-view-options";
import { PersistenceStorage } from "../services";
import { ResetRenderOptionsAction, SetRenderOptionAction } from "./actions";
import { RangeOption, RenderOption, TransformationOptionType } from "./option-models";

/** Whether debug mode should be enabled. */
export class DebugEnabled implements RenderOption {
    static readonly ID: string = 'debug-enabled';
    static readonly NAME: string = 'Enable Debug Mode';
    static readonly DESCRIPTION: string = 'Shows further options used to debug the diagrams.';
    static readonly DEFAULT: boolean = false;
    readonly id: string = DebugEnabled.ID;
    readonly name: string = DebugEnabled.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: any = DebugEnabled.DEFAULT;
    readonly description?: string = DebugEnabled.DESCRIPTION;
    currentValue: any = DebugEnabled.DEFAULT;
}

/**
 * Resize the diagram to fit the viewport if it is redrawn after a model update
 * or a viewport resize.
 */
export class ResizeToFit implements RenderOption {
    static readonly ID: string = 'resize-to-fit';
    static readonly NAME: string = 'Resize To Fit';
    static readonly DEFAULT: boolean = true
    readonly id: string = ResizeToFit.ID;
    readonly name: string = ResizeToFit.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ResizeToFit.DEFAULT;
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
    currentValue = ForceLightBackground.DEFAULT;
}

export class ShowConstraintOption implements RenderOption {
    static readonly ID: string = 'show-constraints';
    static readonly NAME: string = 'Show Constraint';
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
    currentValue = 0.5
}

/**
 * The style shadows should be drawn in, either the paper mode shadows (nice, but slow in
 * performance) or in default KIELER-style (fast, not as nice looking).
 */
export class PaperShadows implements RenderOption {
    static readonly ID: string = 'paper-shadows'
    static readonly NAME: string = 'Paper Mode Shadows'
    static readonly DEFAULT: boolean = false
    readonly id: string = PaperShadows.ID
    readonly name: string = PaperShadows.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHECK
    readonly initialValue: boolean = PaperShadows.DEFAULT
    currentValue = PaperShadows.DEFAULT
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
        this.register(DebugEnabled);

        this.register(ResizeToFit);
        this.register(ForceLightBackground);
        this.register(ShowConstraintOption);

        this.register(UseSmartZoom);
        this.register(FullDetailRelativeThreshold)
        this.register(FullDetailScaleThreshold)

        this.register(SimplifySmallText);
        this.register(TextSimplificationThreshold);

        this.register(TitleScalingFactor);

        this.register(UseMinimumLineWidth);
        this.register(MinimumLineWidth);

        this.register(PaperShadows)
        this.register(AnimateGoToBookmark);

        // Proxy-view
        this.register(ProxyViewCategory);
        this.register(ProxyViewEnabled);
        this.register(ProxyViewSize);
        this.register(ProxyViewClusteringEnabled);
        this.register(ProxyViewOpacityByDistance);
        this.register(ProxyViewActionsEnabled);
        this.register(ProxyViewDrawStraightEdges);
        this.register(ProxyViewCapProxyToParent);
        this.register(ProxyViewTitleScaling);

        // Proxy-view filters
        this.register(ProxyViewFilterCategory);
        this.register(ProxyViewFilterUnconnectedToOnScreen);
        this.register(ProxyViewFilterUnconnectedToSelected);
        this.register(ProxyViewFilterDistant);

        // Proxy-view debug
        this.register(ProxyViewDebugCategory)
        this.register(ProxyViewHighlightSelected);
        this.register(ProxyViewOpacityBySelected);
        this.register(ProxyViewUseSynthesisProxyRendering);
        this.register(ProxyViewStackingOrderByDistance);
        this.register(ProxyViewStackingOrderByOpacity);
        this.register(ProxyViewStackingOrderBySelected);
        this.register(ProxyViewUseDetailLevel);
        this.register(ProxyViewCapScaleToOne);
        this.register(ProxyViewClusterTransparent);
        this.register(ProxyViewClusteringCascading);
        this.register(ProxyViewClusteringSweepLine);
        this.register(ProxyViewUsePositionsCache);
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
