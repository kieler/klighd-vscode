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
        let children = node.children
        // filter KNodes
        let nodes: KNode[] = []
        let counter = 0
        for (let elem of children) {
            if (elem instanceof KNode) {
                nodes[counter] = elem as KNode
                counter++
            }
        }

        // sort nodes based on their layer
        nodes.sort((a, b) => a.layerId - b.layerId)

        // TODO: calculate current
        // create layer indicators
        let current = this.calcCurrentLayer(nodes)
        return  <g>
                    {this.renderCurrentLayer(nodes, current)}
                    {this.renderOtherLayer(nodes, current)}
                </g>
    }

    private calcCurrentLayer(nodes: KNode[]) {
        // TODO: calculate current
        for (let node of nodes) {
            if (node.selected) {
                return node.layerId
            }
        }
        return 0
    }

    private renderCurrentLayer(nodes: KNode[], current: number) {
        let leftX = Number.MAX_VALUE
        let topY = Number.MAX_VALUE
        let rightX = Number.MIN_VALUE
        let botY = Number.MIN_VALUE

        // caluclate position and bounds of the layer
        for (let node of nodes) {
            if (!node.selected) {
                if (node.layerId === current) {
                    if (node.position.x < leftX) {
                        leftX = node.position.x
                    }
                    if (node.position.x + node.size.width > rightX) {
                        rightX = node.position.x + node.size.width
                    }
                }
                if (node.position.y + node.size.height > botY) {
                    botY = node.position.y + node.size.height
                }
                if (node.position.y < topY) {
                    topY = node.position.y
                }
            }
        }
        // create rectangle that indicatees the current layer
        return this.createRect(leftX, topY, rightX - leftX, botY - topY)
    }

    private renderOtherLayer(nodes: KNode[], current: number) {
        let layer = 0
        let leftX = Number.MAX_VALUE
        let topY = Number.MAX_VALUE
        let rightX = Number.MIN_VALUE
        let botY = Number.MIN_VALUE
        let xValues = []
        // TODO: current layer should be ignored
        // create line for every layer except the current one
        for (let node of nodes) {
            if (!node.selected) {
                if (node.layerId !== layer) {
                    xValues[layer] = leftX + (rightX - leftX) / 2
                    leftX = Number.MAX_VALUE
                    rightX = Number.MIN_VALUE
                    layer++
                }
                if (node.position.x < leftX) {
                    leftX = node.position.x
                }
                if (node.position.y < topY) {
                    topY = node.position.y
                }
                if (node.position.x + node.size.width > rightX) {
                    rightX = node.position.x + node.size.width
                }
                if (node.position.y + node.size.height > botY) {
                    botY = node.position.y + node.size.height
                }
            }
        }
        xValues[layer] = leftX + (rightX - leftX) / 2

        let result = <g></g>
        for (let i = 0; i < xValues.length; i++) {
            if (i !== current) {
                result = <g>{result}{this.createLine(xValues[i], topY, botY)}</g>
            }
        }
        return result
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