import { injectable } from "inversify";
import { RangeOption, Range } from '@kieler/keith-diagram-options/lib/common/option-models'

export interface RenderOption {
    id: string
    name: string
    type: TransformationOptionType
    initialValue: any
    currentValue: any
}

/**
 * The different types a SynthesisOption can have.
 */
export enum TransformationOptionType {
    CHECK = 0,
    CHOICE = 1,
    RANGE = 2,
    TEXT = 3,
    SEPARATOR = 4,
    CATEGORY = 5
}

export class ShowConstraintOption implements RenderOption {
    static readonly ID: string = 'show-constraints'
    static readonly NAME: string = 'Show Constraint'
    readonly id: string = ShowConstraintOption.ID
    readonly name: string = ShowConstraintOption.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHECK
    readonly initialValue: boolean = false;
    currentValue: boolean = false
}

export class UseSmartZoom implements RenderOption {
    static readonly ID: string = 'use-smart-zoom'
    static readonly NAME: string = 'Smart Zoom'
    readonly id: string = UseSmartZoom.ID
    readonly name: string = UseSmartZoom.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHECK
    readonly initialValue: boolean = true;
    currentValue: boolean = true
}

export class SetTitleScalingFactor implements RangeOption {
    static readonly ID: string = 'set-title-scaling-factor'
    static readonly NAME: string = 'Set Title Scaling Factor'
    readonly id: string = SetTitleScalingFactor.ID
    readonly name: string = SetTitleScalingFactor.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range: Range = {
        first: 0.5,
        second: 3
    }
    readonly stepSize = 0.01
    readonly initialValue: number = 1
    currentValue: number = 1
}

export class UseConstantLineWidth implements RenderOption {
    static readonly ID: string = 'use-constant-line-width'
    static readonly NAME: string = 'Constant Line Width'
    readonly id: string = UseConstantLineWidth.ID
    readonly name: string = UseConstantLineWidth.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHECK
    readonly initialValue: boolean = true;
    currentValue: boolean = true
}

export class SetConstantLineWidth implements RangeOption {
    static readonly ID: string = 'set-constant-line-width'
    static readonly NAME: string = 'Set Constant Line Width'
    readonly id: string = SetConstantLineWidth.ID
    readonly name: string = SetConstantLineWidth.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range: Range = {
        first: 0.1,
        second: 3
    }
    readonly stepSize = 0.01
    readonly initialValue: number = 0.5
    currentValue: number = 0.5
}

export class SimplifySmallText implements RenderOption {
    static readonly ID: string = 'simplify-small-text'
    static readonly NAME: string = 'Simplify Small Text'
    readonly id: string = SimplifySmallText.ID
    readonly name: string = SimplifySmallText.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHECK
    readonly initialValue: boolean = true;
    currentValue: boolean = true
}

export class SetTextSimplificationThreshold implements RangeOption {
    static readonly ID: string = 'set-text-simplification-threshold'
    static readonly NAME: string = 'Set Text Simplification Threshold'
    readonly id: string = SetTextSimplificationThreshold.ID
    readonly name: string = SetTextSimplificationThreshold.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range: Range = {
        first: 1,
        second: 10
    }
    readonly stepSize = 0.1
    readonly initialValue: number = 3
    currentValue: number = 3
}

export class SetExpandCollapseThreshold implements RangeOption {
    static readonly ID: string = 'set-expand-collapse-threshold'
    static readonly NAME: string = 'Set Expand Collapse Threshold'
    readonly id: string = SetExpandCollapseThreshold.ID
    readonly name: string = SetExpandCollapseThreshold.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly values: any[] = []
    readonly range: Range = {
        first: 0.01,
        second: 1
    }
    readonly stepSize = 0.01
    readonly initialValue: number = 0.2
    currentValue: number = 0.2
}

@injectable()
export class RenderOptions {
    renderOptions: RenderOption[]

    constructor() {
        this.renderOptions = [
            new ShowConstraintOption(),
            new UseConstantLineWidth(),
            new SetConstantLineWidth(),
            new SimplifySmallText(),
            new SetTextSimplificationThreshold(),
            new UseSmartZoom(),
            new SetTitleScalingFactor(),
            new SetExpandCollapseThreshold()
        ]
    }

    public getRenderOptions(): RenderOption[] {
        return this.renderOptions
    }

    public get(option: string): boolean {
        for (let renderOption of this.renderOptions) {
            if (renderOption.id === option) {
                return renderOption.currentValue
            }
        }
        return false
    }

    public set(option: string, value: any) {
        for (let renderOption of this.renderOptions) {
            if (renderOption.id === option) {
                renderOption.currentValue = value
            }
        }
    }
}
