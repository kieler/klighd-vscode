export class LayerConstraint {

    private uri: string
    private id: string
    private layer: number

    constructor(uri: string, id: string, layer: number) {
        this.uri = uri
        this.id = id
        this.layer = layer
    }

    getUri() {
        return this.uri
    }

    getID() {
        return this.id
    }

    getLayer() {
        return this.layer
    }
}