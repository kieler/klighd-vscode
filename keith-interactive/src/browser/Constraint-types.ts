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
    private layerCons: number

    constructor(uri: string, id: string, layer: number, layerCons: number) {
        this.uri = uri
        this.id = id
        this.layer = layer
        this.layerCons = layerCons
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

    getLayerCons() {
        return this.layerCons
    }
}

export class PositionConstraint {

    private uri: string
    private id: string
    private position: number
    private posCons: number

    constructor(uri: string, id: string, position: number, posCons: number) {
        this.uri = uri
        this.id = id
        this.position = position
        this.posCons = posCons

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

    getPosCons() {
        return this.posCons
    }
}

export class StaticConstraint {

    private uri: string
    private id: string
    private layer: number
    private position: number
    private posCons: number
    private layerCons: number

    constructor(uri: string, id: string, layer: number, layerCons: number, position: number, posCons: number) {
        this.uri = uri
        this.id = id
        this.posCons = posCons
        this.layer = layer
        this.layerCons = layerCons
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

    getLayerCons() {
        return this.layerCons
    }
    getPosCons() {
        return this.posCons
    }
}