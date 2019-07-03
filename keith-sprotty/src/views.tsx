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
import { KEdge, KLabel, KNode, KPort } from './kgraph-models';
import { KGraphRenderingContext } from './views-common';
import { getRendering } from './views-rendering';
import { NewMouseListener } from '@kieler/keith-move/lib/newMouseListener'
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

    render(node: KNode, context: RenderingContext): VNode {
        /*console.log("Node: " + node.id)
        console.log("ID: " + node.layerId)
        console.log("Layer: " + node.layerCons)*/

        // TODO: 'as any' is not very nice, but KGraphRenderingContext cannot be used here (two undefined members)
        const ctx = context as any as KGraphRenderingContext
        // reset this property, if the diagram is drawn a second time
        node.areChildrenRendered = false
        let rendering = getRendering(node.data, node, ctx)
        if (node.id === '$root') {
            // the root node should not be rendered, only its children should.
            let children = ctx.renderChildren(node)
            // Add all color and shadow definitions put into the context by the child renderings.
            let defs = <defs></defs>
            ctx.renderingDefs.forEach((value: VNode, key: String) => {
                (defs.children as (string | VNode)[]).push(value)
            })

            if (this.mListener.hasDragged) {
                // filter KNodes
                let nodes: KNode[] = ConstraintUtils.filterKNodes(node.children)
                return <g>
                    {this.renderLayer(nodes)}
                    {defs}
                    {...children}
                </g>
            } else  {
                return <g>
                    {defs}
                    {...children}
                </g>
            }
        }
        // If no rendering could be found, just render its children.
        if (rendering === undefined) {
            return <g>
                {ctx.renderChildren(node)}
            </g>
        }
        // Default cases. If the children are already rendered within a KChildArea, only return the rendering. Otherwise, add the children by default.
        if (node.areChildrenRendered) {
            return <g>
                {rendering}
            </g>
        } else {
            return <g>
                {rendering}
                {ctx.renderChildren(node)}
            </g>
        }
    }

    /**
     * creates a rectangle and lines that visualize the different layers
     * @param node all nodes of the graph
     */
    private renderLayer(nodes: KNode[]) {
        let current = this.currentLayer(nodes)

        let layerCoords = ConstraintUtils.getLayerCoordinates(nodes)

        // calculate y coordinates of the layers
        let topY = Number.MAX_VALUE
        let botY = Number.MIN_VALUE
        for (let node of nodes) {
            if (!node.selected) {
                let tY = node.position.y
                let bY = node.position.y + node.size.height
                if (tY < topY) {
                    topY = tY
                }
                if (bY > botY) {
                    botY = bY
                }
            }
        }

        // create layers
        // TODO: should I show an empty layer on the right/left side?
        // TODO: ignore empty layer
        let result = <g></g>
        for (let i = 0; i < layerCoords.length / 2; i++) {
            if (i === current) {
                let rectLeftX = layerCoords[2 * i]
                let rectRightX = layerCoords[2 * i + 1]
                result = <g>{result}{this.createRect(rectLeftX, topY, rectRightX - rectLeftX, botY - topY)}</g>
            } else {
                let lineX = layerCoords[2 * i] + (layerCoords[2 * i + 1] - layerCoords[2 * i]) / 2
                result  = <g>{result}{this.createLine(lineX, topY, botY)}</g>
            }
        }

        return <g>{result}{this.renderPositions(current, nodes, layerCoords)}</g>
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
                    x={x - 10}
                    y={y - 20}
                    width={width + 20}
                    height={height + 40}
                    fill='none'
                    stroke='grey'
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
                    stroke='grey'
                    style={{ 'stroke-dasharray': "4" } as React.CSSProperties}
                />
            </g>
        return element
    }

    /**
     * creates circles that indicate the available positions.
     * The position the node would be set to if it released is indicated by a not filled circle.
     * @param current number of the layer the moved node is currently in
     * @param nodes all nodes of the graph
     * @param layerCoords coordinates of all layers
     */
    private renderPositions(current: number, nodes: KNode[], layerCoords: number[]) {
        let layerNodes: KNode[] = ConstraintUtils.getNodesOfLayer(current, nodes)

        // get the moved node
        let target = undefined
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
            let x = layerCoords[2 * current] + (layerCoords[2 * current + 1] - layerCoords[2 * current]) / 2

            let shift = 1
            // calculate positions between nodes
            for (let i = 0; i < layerNodes.length - 1; i++) {
                let node = layerNodes[i]
                if (!node.selected && !layerNodes[i + 1].selected) {
                    let topY = node.position.y + node.size.height
                    let botY = layerNodes[i + 1].position.y
                    let midY = topY + (botY - topY) / 2
                    result = <g>{result}{this.createCircle(curPos !== i + shift, x, midY)}</g>
                } else {
                    shift = 0
                }
            }
            // position above the first node is available if the first node is not the selected one
            let first = layerNodes[0]
            if (!first.selected) {
                result = <g>{result}{this.createCircle(curPos !== 0, x, first.position.y - 10)}</g>
            }
            // position below the last node is available if the last node is not the selected one
            let last = layerNodes[layerNodes.length - 1]
            if (!last.selected) {
                result = <g>{result}{this.createCircle(curPos !== layerNodes.length - 1 + shift, x, last.position.y + last.size.height + 10)}</g>
            }

            return result
        } else {
            return <g></g>
        }
    }

    /**
     * creates a circle
     * @param fill determines whether the circle is filled
     * @param x the x coordinate of the center
     * @param y the y coordinate of the center
     */
    private createCircle(fill: boolean, x: number, y: number) {
        if (fill) {
            return  <g>
                        <circle
                            cx={x}
                            cy={y}
                            r="1"
                            stroke="grey"
                            fill="grey"
                        />
                    </g>
        } else {
            return  <g>
                        <circle
                            cx={x}
                            cy={y}
                            r="1"
                            stroke="grey"
                            fill="none"
                            style={{ 'stroke-width': "0.5" } as React.CSSProperties}
                        />
                    </g>
        }
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
    render(edge: KEdge, context: RenderingContext): VNode {
        edge.areChildrenRendered = false
        let rendering = getRendering(edge.data, edge, context as any)
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