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