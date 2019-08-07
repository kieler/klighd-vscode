import { RectangularNode, selectFeature, moveFeature, SParentElement, SEdge, Point } from 'sprotty/lib';

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

/**
 * This is the superclass of all elements of a graph such as nodes, edges, ports,
 * and labels. A graph element may contain an arbitrary number of additional
 * data instances.
 * Represents its java counterpart in KLighD.
 */
export interface KGraphElement extends SParentElement {
    /**
     * May contain a trace that points back to the server instance where this element was created.
     */
    trace?: string
    data: KGraphData[]
    /**
     * Additional field to remember, if this element's children have already been rendered.
     */
    areChildrenRendered: boolean
}

/**
 * Represents its java counterpart in KLighD.
 */
export class KNode extends RectangularNode implements KGraphElement {
    trace?: string
    data: KGraphData[]
    areChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature || (feature === moveFeature && this.interactiveLayout)
    }

    layerId: number
    posId: number
    layerCons: number
    posCons: number
    interactiveLayout: boolean

    shadow: boolean
    shadowX: number
    shadowY: number

    hierWidth: number
    hierHeight: number
}

/**
 * This class can be extended to hold arbitrary additional data for
 * graph elements, such as layout or rendering information.
 * Represents its java counterpart in KLighD.
 */
export interface KGraphData {
    type: string
}

/**
 * Represents its java counterpart in KLighD.
 */
export class KEdge extends SEdge implements KGraphElement {
    trace?: string
    data: KGraphData[]
    junctionPoints: Point[]
    areChildrenRendered = false
    hasFeature(feature: symbol): boolean {
        return feature === selectFeature
    }

    moved: boolean
}