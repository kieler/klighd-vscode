export interface RenderOption {
    name: string
    type: TransformationOptionType
    initialValue: any
    values: any[]
    currentValue: any
    sourceHash: number
}

export enum TransformationOptionType {
    CHECK = 0,
 /*    CHOICE = 1,
    RANGE = 2,
    SEPARATOR = 3 */
}

export const RO = Symbol('RO')

export interface RO {
    renderOptions: RenderOption[]

    getRenderOptions(): RenderOption[]

    updateRenderOption(option: RenderOption): void
}