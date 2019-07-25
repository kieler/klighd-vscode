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