export class Shadow {
    x: number
    y: number
    width: number
    height: number

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }
}

export class Layer {
    leftX: number
    rightX: number
    mid: number
    topY: number
    botY: number

    constructor(leftX: number, rightX: number, mid: number) {
        this.leftX = leftX
        this.rightX = rightX
        this.mid = mid
    }

}