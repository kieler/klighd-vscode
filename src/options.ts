import { injectable } from "inversify";

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


@injectable()
export class RenderOptions {
    renderOptions: RenderOption[]

    constructor() {
        this.renderOptions = [new ShowConstraintOption()]
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
