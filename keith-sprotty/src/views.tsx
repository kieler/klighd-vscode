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
import { IView, RenderingContext, SGraph, SGraphView, SChildElement, SNode } from 'sprotty/lib';
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
                console.log("Moving")
                return <g>
                    {this.renderLayer(node)}
                    {defs}
                    {...children}
                </g>
            } else  {
                console.log("notMoving")
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
        // TODO:
        // should layer be drawn? (add boolean in newMouseListener)
        let children = node.children
        return this.renderCurrentLayer(children)
        this.renderOtherLayer(children)
    }

    private renderCurrentLayer(nodes: SChildElement[]) {
        // TODO:
        // #1 select nodes in the current layer (save the current in newMouseListener)
        // #2 calculate position and dimension of layer
        // #3 return svg of the layer (retangle)

        // test drawing
        for (let el of nodes) {
            if (el instanceof SNode) {
                let node = el as SNode
                let element =
                    <g> <rect
                            x={node.position.x - 10}
                            y={node.position.y - 10}
                            width={node.bounds.width + 20}
                            height={node.bounds.height + 20}>
                        </rect>
                    </g>
                return element
            }
        }

       /* let element = <g id={rendering.id} {...gAttrs}>
        <rect
            width={boundsAndTransformation.bounds.width}
            height={boundsAndTransformation.bounds.height}
            {...(rx ? { rx: rx } : {})}
            {...(ry ? { ry: ry } : {})}
            style={{
                'stroke-linecap': lineStyles.lineCap,
                'stroke-linejoin': lineStyles.lineJoin,
                'stroke-width': lineStyles.lineWidth,
                'stroke-dasharray': lineStyles.dashArray,
                'stroke-miterlimit': lineStyles.miterLimit
            } as React.CSSProperties}
            stroke={colorStyles.foreground}
            fill={colorStyles.background}
            filter={shadowStyles}
        />
        {renderChildRenderings(rendering, parent, context)}
    </g>*/
    }

    private renderOtherLayer(nodes: SChildElement[]) {
        // TODO:
        // #1 sort nodes based on their layer
        // #2 delete nodes in the current layer (save the current in newMouseListener)
        // #3 calculate position and dimension of layer
        // #4 return svg of the layer (line)

        /*let element = <g id={rendering.id} {...gAttrs}>
        <path
            d={path}
            style={{
                'stroke-linecap': lineStyles.lineCap,
                'stroke-linejoin': lineStyles.lineJoin,
                'stroke-width': lineStyles.lineWidth,
                'stroke-dasharray': lineStyles.dashArray,
                'stroke-miterlimit': lineStyles.miterLimit
            } as React.CSSProperties}
            stroke={colorStyles.foreground}
            fill={colorStyles.background}
            filter={shadowStyles}
        />
        {renderChildRenderings(rendering, parent, context)}
    </g>*/
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