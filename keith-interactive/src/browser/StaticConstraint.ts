export class StaticConstraint {

    private uri: string
    private id: string
    private layer: number
    private position: number

    constructor(uri: string, id: string, layer: number, position: number) {
        this.uri = uri
        this.id = id
        this.layer = layer
        this.position = position
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

    getPos() {
        return this.position
    }
}