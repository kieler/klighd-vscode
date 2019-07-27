/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
/** @jsx svg */
import { injectable, inject } from 'inversify';
import { svg } from 'snabbdom-jsx';
import { VNode } from 'snabbdom/vnode';
import { IView, RenderingContext, SGraph, SGraphView } from 'sprotty/lib';
import { KEdge, KLabel, KPort, KNode} from './kgraph-models';
import { KGraphRenderingContext } from './views-common';
import { getRendering } from './views-rendering';
import { NewMouseListener } from '@kieler/keith-move/lib/newMouseListener'
import { Layer } from '@kieler/keith-move/lib/ConstraintClasses'
import { ConstraintUtils } from '@kieler/keith-move/lib/ConstraintUtils'

/**
 * IView component that turns an SGraph element and its children into a tree of virtual DOM elements.
 * Extends the SGraphView by initializing the context for KGraph rendering.
 */
@injectable()
export class SKGraphView extends SGraphView {
    render(model: Readonly<SGraph>, context: RenderingContext): VNode {
        // TODO: 'as any' is not very nice, but KGraphRenderingContext cannot be used here (two undefined members)
        const ctx = context as any as KGraphRenderingContext
        ctx.renderingDefs = new Map
        return super.render(model, context)
    }
}

/**
 * IView component that translates a KNode and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KNodeView implements IView {

    @inject(NewMouseListener) mListener: NewMouseListener

    private color = 'grey'

    render(node: KNode, context: RenderingContext): VNode {
        // TODO: 'as any' is not very nice, but KGraphRenderingContext cannot be used here (two undefined members)
        const ctx = context as any as KGraphRenderingContext
        // reset this property, if the diagram is drawn a second time
        node.areChildrenRendered = false

        let result = <g></g>

        let isShadow = node.shadow
        let shadow = undefined
        if (this.mListener.hasDragged && isShadow) {
            // render shadow of the node
            shadow = getRendering(node.data, node, context as any)
            node.shadow = false
        }

        let rendering = getRendering(node.data, node, ctx)
        node.shadow = isShadow

        let layer = undefined
        if (this.mListener.hasDragged && ConstraintUtils.isChildSelected(node)) {
            // render the objects indicating the layer and positions in the graph
            layer = <g>{this.renderInteractiveLayout(node , context)}</g>
        }

        let constraints = this.renderConstraints(node)

        if (node.id === '$root') {
            // the root node should not be rendered, only its children should.
            let children = ctx.renderChildren(node)
            // Add all color and shadow definitions put into the context by the child renderings.
            let defs = <defs></defs>
            ctx.renderingDefs.forEach((value: VNode, key: String) => {
                (defs.children as (string | VNode)[]).push(value)
            })

            if (layer !== undefined) {
                result = <g>{result}{layer}</g>
            }
            result = <g>
                        {result}
                        {defs}
                        {...children}
                    </g>

            return result
        }
        if (shadow !== undefined) {
            result = <g>{result}{shadow}</g>
        }
        if (rendering !== undefined) {
            result = <g>{result}{rendering}</g>
        }
        if (layer !== undefined) {
            result = <g>{result}{layer}</g>
        }
        // Default case. If the children are not already rendered within a KChildArea add the children by default.
        if (!node.areChildrenRendered) {
            result = <g>{result}{constraints}{ctx.renderChildren(node)}</g>
        }
        return result
    }

     /**
     * renders the graph for the interactive layout
     * @param root root of the graph
     */
    private renderInteractiveLayout(root: KNode, context: RenderingContext) {
        // filter KNodes
        let nodes = ConstraintUtils.filterKNodes(root.children)
        return  <g>
                    {this.renderLayer(nodes)}
                </g>
    }

    /**
     * creates a rectangle with positions and lines that visualize the different layers
     * @param node all nodes of the graph
     */
    private renderLayer(nodes: KNode[]) {
        let current = this.currentLayer(nodes)

        let layers: Layer[] = ConstraintUtils.getLayers(nodes)

        // y coordinates of the layers
        let topY = layers[0].topY
        let botY = layers[0].botY

        // create layers
        let result = <g></g>
        for (let i = 0; i < layers.length; i++) {
            let layer = layers[i]
            if (i === current) {
                result = <g>{result}{this.createRect(layer.leftX, topY, layer.rightX - layer.leftX, botY - topY)}</g>
            } else {
                result  = <g>{result}{this.createLine(layer.mid, topY, botY)}</g>
            }
        }

        // show a new empty last layer the node can be moved to
        let lastL = layers[layers.length - 1]
        let lastLNodes = ConstraintUtils.getNodesOfLayer(layers.length - 1, nodes)
        if (lastLNodes.length !== 1 || !lastLNodes[0].selected) {
            // only show the layer if the moved node is not (the only node) in the last layer
            if (current === layers.length) {
                result = <g>{result}{this.createRect(lastL.rightX, topY, lastL.rightX - lastL.leftX, botY - topY)}</g>
            } else {
                result = <g>{result}{this.createLine(lastL.mid + (lastL.rightX - lastL.leftX), topY, botY)}</g>
            }
        }

        // add available positions
        return <g>{result}{this.renderPositions(current, nodes, layers)}</g>
    }

    /**
     * calculates the layer the seleted node is in
     * @param nodes all nodes of the graph
     */
    private currentLayer(nodes: KNode[]) {
        for (let node of nodes) {
            if (node.selected) {
                return ConstraintUtils.getLayerOfNode(node, nodes)
            }
        }
        // should not be reached
        // TODO: throw an error
        return -1
    }

    /**
     * crates a rectangle
     * @param x left position of the rectangle
     * @param y top position of the rectangle
     * @param width width of the rectangle
     * @param height height of the rectangle
     */
    private createRect(x: number, y: number, width: number, height: number) {
        let element =
            <g> <rect
                    x={x}
                    y={y - 20}
                    width={width}
                    height={height + 40}
                    fill='none'
                    stroke={this.color}
                    style={{ 'stroke-dasharray': "4" } as React.CSSProperties}>
                </rect>
            </g>
        return element
    }

    /**
     * creates a vertical line
     * @param x x coordinate of the line
     * @param topY start of the line on the y-axis
     * @param botY end of the line on the y-axis
     */
    private createLine(x: number, topY: number, botY: number) {
        let element =
            <g> <line
                    x1={x}
                    y1={topY - 20}
                    x2={x}
                    y2={botY + 20}
                    fill='none'
                    stroke={this.color}
                    style={{ 'stroke-dasharray': "4" } as React.CSSProperties}
                />
            </g>
        return element
    }

    /**
     * creates circles that indicate the available positions.
     * The position the node would be set to if it released is indicated by a filled circle.
     * @param current number of the layer the moved node is currently in
     * @param nodes all nodes of the graph
     * @param layers coordinates of all layers
     */
    private renderPositions(current: number, nodes: KNode[], layers: Layer[]) {
        let layerNodes: KNode[] = ConstraintUtils.getNodesOfLayer(current, nodes)

        // get the moved node
        let target = nodes[0]
        for (let node of nodes) {
            if (node.selected) {
                target = node
            }
        }
        // position of moved node
        let curPos = ConstraintUtils.getPosInLayer(layerNodes, target)

        layerNodes.sort((a, b) => a.posId - b.posId)

        if (layerNodes.length > 0) {
            let result = <g></g>
            // mid of the current layer
            let x = layers[current].mid

            let shift = 1
            // calculate positions between nodes
            for (let i = 0; i < layerNodes.length - 1; i++) {
                let node = layerNodes[i]
                if (!node.selected && !layerNodes[i + 1].selected) {
                    let topY = node.position.y + node.size.height
                    let botY = layerNodes[i + 1].position.y
                    let midY = topY + (botY - topY) / 2
                    result = <g>{result}{this.createCircle(curPos === i + shift, x, midY)}</g>
                } else {
                    shift = 0
                }
            }

            // position above the first node is available if the first node is not the selected one
            let first = layerNodes[0]
            if (!first.selected) {
                result = <g>{result}{this.createCircle(curPos === 0, x, first.position.y - 10)}</g>
            }
            // position below the last node is available if the last node is not the selected one
            let last = layerNodes[layerNodes.length - 1]
            if (!last.selected) {
                result = <g>{result}{this.createCircle(curPos === layerNodes.length - 1 + shift, x, last.position.y + last.size.height + 10)}</g>
            }

            return result
        } else {
            // show a circle in the middle of the layer
            let lastL = layers[layers.length - 1]
            let x = lastL.mid + (lastL.rightX - lastL.leftX)
            let y = lastL.topY + (lastL.botY - lastL.topY) / 2
            return <g>{this.createCircle(true, x, y)}</g>
        }
    }

    /**
     * creates a circle
     * @param fill determines whether the circle is filled
     * @param x the x coordinate of the center
     * @param y the y coordinate of the center
     */
    private createCircle(fill: boolean, x: number, y: number) {
        return  <g>
                    <circle
                        cx={x}
                        cy={y}
                        r="2"
                        stroke={this.color}
                        fill={fill ? this.color : "none"}
                        style={{ 'stroke-width': "0.5" } as React.CSSProperties}
                    />
                </g>
    }

    /**
     * generates an icon to visualize the set Constraints of the node
     * @param node KNode which Constraints should be rendered
     */
    private renderConstraints(node: KNode) {
        let result = <g></g>
        let x = node.size.width
        let y = 0
        if (node.layerCons !== -1 && node.posCons !== -1) {
            result = <g>{result}{this.lock(x, y)}</g>
        } else if (node.layerCons !== -1) {
            result = <g>{result}{this.layerCons(x + 2, y - 2)}</g>
        } else if (node.posCons !== -1) {
            result = <g>{result}{this.posCons(x + 2, y - 2)}</g>
        }
        return result
    }

    /**
     * creates icon that visualizes a layer constraint
     * @param x
     * @param y
     */
    private layerCons(x: number, y: number) {
        let image = <g>
                        {this.lock(x, y)}
                        {this.arrow(x - 2.15, y + 2.6, false)}
                    </g>
        return image
    }

    /**
     * creates icon that visualizes a position constraint
     * @param x
     * @param y
     */
    private posCons(x: number, y: number) {
        let image = <g>
                        {this.lock(x, y)}
                        {this.arrow(x + 0.1, y + 2.5, true)}
                        {/* <image x="0" y="0" width="50" height="50"
                            xlinkHref="C:/Bachelorarbeit/SVG-Test/Test.svg">
                        </image> */}
                    </g>
        return image
    }

    /**
     * crates a lock icon
     * @param xTranslate
     * @param yTranslate
     */
    private lock(xTranslate: number, yTranslate: number) {
        let s = "translate(" + xTranslate + ","
                + yTranslate + ") scale(0.0004,-0.00036)"
        let image = <g transform={s}
                        fill="grey" stroke="none">
                        <path d="M4265 12794 c-22 -2 -92 -9 -155 -15 -1278 -120 -2434 -919 -3018
                            -2085 -162 -323 -287 -708 -346 -1064 -49 -297 -49 -287 -53 -1502 l-4 -1158
                            -329 0 c-285 0 -331 -2 -344 -16 -15 -14 -16 -343 -16 -3468 0 -3332 1 -3453
                            18 -3469 17 -16 343 -17 4484 -17 4313 0 4465 1 4481 18 16 17 17 272 17 3470
                            0 3124 -1 3452 -16 3466 -13 14 -59 16 -344 16 l-329 0 -4 1158 c-4 1215 -4
                            1205 -53 1502 -119 720 -458 1409 -960 1952 -617 666 -1440 1082 -2359 1194
                            -122 14 -579 27 -670 18z m609 -1079 c136 -19 236 -40 351 -71 1030 -282 1806
                            -1137 1984 -2184 38 -225 41 -318 41 -1417 l0 -1073 -2750 0 -2750 0 0 1073
                            c0 1099 3 1192 41 1417 178 1047 953 1900 1984 2184 149 41 348 75 525 90 98
                            8 471 -4 574 -19z"/>
                    </g>
        return image
    }

    /**
     * creates an arrow icon
     * @param xTranslate
     * @param yTranslate
     * @param vertical determines whether the arrow should be vertical or horizontal
     */
    private arrow(xTranslate: number, yTranslate: number, vertical: boolean) {
        let s = "translate(" + xTranslate + ","
                + yTranslate + ")"
        if (vertical) {
            s += " scale(0.0004,-0.0006) rotate(90)"
        } else {
            s += " scale(0.0006,-0.0004)"
        }
        let image = <g transform={s}
                        fill="grey" stroke="none">
                        <path d="M3583 6153 c-44 -34 -632 -506 -2778 -2233 -845 -681 -824 -662 -794
                            -726 20 -41 3601 -2972 3637 -2976 33 -5 78 16 92 41 6 13 10 256 10 710 l0
                            691 2650 0 2650 0 0 -695 0 -696 25 -24 c17 -18 35 -25 64 -25 37 0 122 68
                            1838 1473 1100 901 1803 1484 1812 1501 30 64 51 45 -794 726 -2415 1943
                            -2788 2243 -2813 2257 -40 23 -93 11 -115 -26 -16 -27 -17 -86 -17 -720 l0
                            -691 -2650 0 -2650 0 0 690 c0 587 -2 695 -15 719 -28 54 -84 56 -152 4z"/>
                    </g>
        return image
    }

 }


/**
 * IView component that translates a KPort and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KPortView implements IView {
    render(port: KPort, context: RenderingContext): VNode {
        port.areChildrenRendered = false
        let rendering = getRendering(port.data, port, context as any)
        // If no rendering could be found, just render its children.
        if (rendering === undefined) {
            return <g>
                {context.renderChildren(port)}
            </g>
        }
        // Default cases. If the children are already rendered within a KChildArea, only return the rendering. Otherwise, add the children by default.
        if (port.areChildrenRendered) {
            return <g>
                {rendering}
            </g>
        } else {
            return <g>
                {rendering}
                {context.renderChildren(port)}
            </g>
        }
    }
}

/**
 * IView component that translates a KLabel and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KLabelView implements IView {
    render(label: KLabel, context: RenderingContext): VNode {
        label.areChildrenRendered = false
        let rendering = getRendering(label.data, label, context as any)
        // If no rendering could be found, just render its children.
        if (rendering === undefined) {
            return <g>
                {context.renderChildren(label)}
            </g>
        }
        // Default cases. If the children are already rendered within a KChildArea, only return the rendering. Otherwise, add the children by default.
        if (label.areChildrenRendered) {
            return <g>
                {rendering}
            </g>
        } else {
            return <g>
                {rendering}
                {context.renderChildren(label)}
            </g>
        }
    }
}

/**
 * IView component that translates a KEdge and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KEdgeView implements IView {

    @inject(NewMouseListener) mListener: NewMouseListener

    render(edge: KEdge, context: RenderingContext): VNode {
        edge.areChildrenRendered = false

        // edge should be greyed out if the source or target is moved
        let s = edge.source
        let t = edge.target
        if (s !== undefined && t !== undefined && s instanceof KNode && t instanceof KNode) {
            edge.moved = (s.selected || t.selected) && this.mListener.hasDragged
        }

        let rendering = getRendering(edge.data, edge, context as any)
        edge.moved = false

        // If no rendering could be found, just render its children.
        if (rendering === undefined) {
            return <g>
                {context.renderChildren(edge)}
            </g>
        }
        // Default cases. If the children are already rendered within a KChildArea, only return the rendering. Otherwise, add the children by default.
        if (edge.areChildrenRendered) {
            return <g>
                {rendering}
            </g>
        } else {
            return <g>
                {rendering}
                {context.renderChildren(edge)}
            </g>
        }
    }
}