import { injectable } from "inversify";
import { RO, RenderOption, TransformationOptionType } from "./interfaces";



@injectable()
export class ROptions implements RO {
    renderOptions: RenderOption[]

    constructor() {
        let option: RenderOption = {name: "Set Constraint", type: TransformationOptionType.CHECK, initialValue: false,
                    values: [false, true], currentValue: false, sourceHash: 0o101}
        this.renderOptions = [option]
        console.log("ROptions")
    }

    public getRenderOptions(): RenderOption[] {
        return this.renderOptions
    }

    public updateRenderOption(option: RenderOption) {
        this.renderOptions[0] = option
    }
}
