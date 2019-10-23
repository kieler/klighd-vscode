import { injectable } from "inversify";

export interface RenderOption {
    name: string
    type: TransformationOptionType
    initialValue: any
    currentValue: any
    sourceHash: number
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

@injectable()
export class RenderOptions {
    renderOptions: RenderOption[]

    constructor() {
        let option: RenderOption = {name: "Show Constraint", type: TransformationOptionType.CHECK, initialValue: false,
                    currentValue: false, sourceHash: 0o101}
        this.renderOptions = [option]
    }

    public getRenderOptions(): RenderOption[] {
        return this.renderOptions
    }

    public updateRenderOption(option: RenderOption) {
        this.renderOptions[0] = option
    }

    public getShowConstraint(): boolean {
        for (let option of this.renderOptions) {
            if (option.name === "Show Constraint") {
                return option.currentValue
            }
        }
        return false
    }
}
