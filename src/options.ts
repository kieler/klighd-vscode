import { injectable } from "inversify";

/**
 * A RenderOption with unique id and name as well as the option type.
 * Holds the current value and the initial value of the option.
 */
export interface RenderOption {
    id: string
    name: string
    type: TransformationOptionType
    updateNeeded: boolean
    initialValue: any
    currentValue: any
}

/**
 * The different types an Option can have.
 */
export enum TransformationOptionType {
    CHECK = 0,
    CHOICE = 1,
    RANGE = 2,
    TEXT = 3,
    SEPARATOR = 4,
    CATEGORY = 5
}

/**
 * A RenderOption, whose value is bounded by a number range.
 */
export interface RangeOption extends RenderOption {
    range: Range
    stepSize: number
}

/**
 * Defines a range through the bounds 'lower' and 'upper'.
 */
export interface Range {
    lower: number
    upper: number
}

export class ShowConstraintOption implements RenderOption {
    static readonly ID: string = 'show-constraints'
    static readonly NAME: string = 'Show Constraint'
    readonly id: string = ShowConstraintOption.ID
    readonly name: string = ShowConstraintOption.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHECK
    readonly updateNeeded: boolean = true
    readonly initialValue: boolean = false
    currentValue: boolean = false
}

/**
 * Boolean option to enable and disable the smart zoom feature.
 * This corresponds to the automatic expansion and collapsing of regions and states
 * as well as limiting visible elements.
 */
export class UseSmartZoom implements RenderOption {
    static readonly ID: string = 'use-smart-zoom'
    static readonly NAME: string = 'Smart Zoom'
    readonly id: string = UseSmartZoom.ID
    readonly name: string = UseSmartZoom.NAME
    readonly type: TransformationOptionType = TransformationOptionType.CHECK
    readonly updateNeeded: boolean = false
    readonly initialValue: boolean = true
    currentValue: boolean = true
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
    readonly updateNeeded: boolean = false
    readonly values: any[] = []
    readonly range: Range = {
        lower: 0.5,
        upper: 3
    }
    readonly stepSize = 0.01
    readonly initialValue: number = 1
    currentValue: number = 1
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
    readonly updateNeeded: boolean = false
    readonly initialValue: boolean = true
    currentValue: boolean = true
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
    readonly updateNeeded: boolean = false
    readonly values: any[] = []
    readonly range: Range = {
        lower: 0.1,
        upper: 3
    }
    readonly stepSize = 0.01
    readonly initialValue: number = 0.5
    currentValue: number = 0.5
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
    readonly updateNeeded: boolean = false
    readonly initialValue: boolean = true
    currentValue: boolean = true
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
    readonly updateNeeded: boolean = false
    readonly values: any[] = []
    readonly range: Range = {
        lower: 1,
        upper: 10
    }
    readonly stepSize = 0.1
    readonly initialValue: number = 3
    currentValue: number = 3
}

/**
 * Threshold for expansion as well as collapse of states.
 * Corresponds to the regions size compared to the current viewport.
 */
export class ExpandCollapseThreshold implements RangeOption {
    static readonly ID: string = 'expand-collapse-threshold'
    static readonly NAME: string = 'Expand Collapse Threshold'
    readonly id: string = ExpandCollapseThreshold.ID
    readonly name: string = ExpandCollapseThreshold.NAME
    readonly type: TransformationOptionType = TransformationOptionType.RANGE
    readonly updateNeeded: boolean = false
    readonly values: any[] = []
    readonly range: Range = {
        lower: 0.01,
        upper: 1
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
            new ConstantLineWidth(),
            new SimplifySmallText(),
            new TextSimplificationThreshold(),
            new UseSmartZoom(),
            new TitleScalingFactor(),
            new ExpandCollapseThreshold()
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

/**
 * Contains all RenderOptions in an object to access them outside of classes.
 */
export class RenderingOptions {
    /**
     * HashMap containing all render options with the option ID as the key.
     */
    options: Map<String, RenderOption>
    /**
     * Private instance for singleton pattern.
     */
    private static instance: RenderingOptions;

    /**
     * Private constructor for singleton pattern.
     */
    private constructor() {
        this.options = new Map()
    }

    /**
     * Public to access RenderingOptions instance. Creates new instance if there is none.
     * 
     * @returns Current RenderingOptions instance
     */
    public static getInstance(): RenderingOptions {
        if (this.instance === undefined) {
            this.instance = new RenderingOptions();
        }
        return RenderingOptions.instance
    }

    /**
     * Puts the current option in the Map of all RenderOptions.
     * 
     * @param option The RenderOption holding the new value.
     */
    public updateSettings(option: RenderOption) {
        this.options.set(option.id, option)
    }

    /**
     * Looks up the specified option in the saved RenderOptions and returns it, if found.
     * 
     * @param optionID The ID of the option to be retrieved.
     * @returns The option corresponding to the RenderOption ID or undefined, if none is found.
     */
    public getOption(optionID: String): RenderOption | undefined {
        return this.options.get(optionID)
    }
}

