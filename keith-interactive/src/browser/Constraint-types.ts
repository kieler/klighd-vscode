export class DeleteConstraint {

    private uri: string
    private id: string

    constructor(uri: string, id: string) {
        this.uri = uri
        this.id = id
    }

    getUri() {
        return this.uri
    }

    getID() {
        return this.id
    }

}

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

export class PositionConstraint {

    private uri: string
    private id: string
    private position: number

    constructor(uri: string, id: string, position: number) {
        this.uri = uri
        this.id = id
        this.position = position
    }

    getUri() {
        return this.uri
    }

    getID() {
        return this.id
    }

    getPosition() {
        return this.position
    }
}

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