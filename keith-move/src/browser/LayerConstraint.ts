export class LayerConstraint {

    uri: string
    id: string
    layer: number

    constructor(uri: string, id: string, layer: number) {
        this.uri = uri
        this.id = id
        this.layer = layer
    }
}