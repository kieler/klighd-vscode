import { RenderOption, SetConstantLineWidth, SetExpandCollapseThreshold, SetTextSimplificationThreshold, SetTitleScalingFactor, SimplifySmallText, UseConstantLineWidth, UseSmartZoom } from "./options";

export class RenderingOptions {
    useSmartZoom: boolean
    simplifySmallText: boolean
    simplifyTextThreshold: number
    titleScalingFactor: number
    useConstantLineWidth: boolean
    constantLineWidth: number
    placeholderSize: number
    expandCollapseThreshold: number
    private static instance: RenderingOptions;

    // Singleton pattern.
    private constructor() {
    }

    static getInstance(): RenderingOptions {
        if (this.instance === undefined) {
            this.instance = new RenderingOptions();
        }
        return RenderingOptions.instance
    }

    updateSettings(option: RenderOption) {
        switch (option.id) {
            case SetConstantLineWidth.ID: {
                this.constantLineWidth = option.currentValue
                break;
            }
            case SetExpandCollapseThreshold.ID: {
                this.expandCollapseThreshold = option.currentValue
                break;
            }
            case SetTextSimplificationThreshold.ID: {
                this.simplifyTextThreshold = option.currentValue
                break;
            }
            case SetTitleScalingFactor.ID: { 
                this.titleScalingFactor = option.currentValue
                break;
            }
            case SimplifySmallText.ID: {
                this.simplifySmallText = option.currentValue
                break;
            }
            case UseConstantLineWidth.ID: {
                this.useConstantLineWidth = option.currentValue
                break;
            }
            case UseSmartZoom.ID: {
                this.useSmartZoom = option.currentValue    
                break;
            }
            // Avoid error as there are still other render options.
            default: {
                break;
            }
        }
    }
}
