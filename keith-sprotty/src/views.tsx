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
                return <g>
                    {this.renderLayer(node)}
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

    private renderLayer(node: KNode) {
        // filter KNodes
        let nodes: KNode[] = ConstraintUtils.filterKNodes(node.children)

        // sort nodes based on their layer
        nodes.sort((a, b) => a.layerId - b.layerId)

        let current = this.currentLayer(nodes)

        let layerCoords = ConstraintUtils.getLayerCoordinates(nodes)

        // calculate y coordinates of the layers
        let topY = 0
        let botY = 0
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

        return result
    }

    private currentLayer(nodes: KNode[]) {
        for (let node of nodes) {
            if (node.selected) {
                return ConstraintUtils.getLayerOfNode(node, nodes)
            }
        }
        // should not be reached
        return -1
    }

    private createRect(leftX: number, topY: number, width: number, height: number) {
        let element =
            <g> <rect
                    x={leftX - 10}
                    y={topY - 10}
                    width={width + 20}
                    height={height + 20}
                    fill='none'
                    stroke='grey'
                    style={{ 'stroke-dasharray': "4" } as React.CSSProperties}>
                </rect>
            </g>
        return element
    }

    private createLine(x: number, topY: number, botY: number) {
        let element =
            <g> <line
                    x1={x}
                    y1={topY - 10}
                    x2={x}
                    y2={botY + 10}
                    fill='none'
                    stroke='grey'
                    style={{ 'stroke-dasharray': "4" } as React.CSSProperties}
                />
            </g>
        return element
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