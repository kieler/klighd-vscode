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
import { svg } from 'snabbdom-jsx'
import { RenderingContext, IView, SGraph} from "sprotty/lib"
import { VNode } from "snabbdom/vnode"
import { KNode, KPort, KLabel, KEdge} from "./kgraph-models"
import { getRendering } from "./views-rendering"
import { KGraphRenderingContext } from './views-common'

export class SGraphView implements IView {

    render(model: Readonly<SGraph>, context: RenderingContext): VNode {
        // TODO: 'as any' is not very nice, but KGraphRenderingContext cannot be used here (two undefined members)
        const ctx = context as any as KGraphRenderingContext
        ctx.renderingDefs = new Map
        const transform = `scale(${model.zoom}) translate(${-model.scroll.x},${-model.scroll.y})`
        return <svg class-sprotty-graph={true}>
            <g transform={transform}>
                {context.renderChildren(model)}
            </g>
        </svg>
    }
}

export class KNodeView implements IView {
    render(node: KNode, context: RenderingContext): VNode {
        // TODO: 'as any' is not very nice, but KGraphRenderingContext cannot be used here (two undefined members)
        const ctx = context as any as KGraphRenderingContext
        // reset this property, if the diagram is drawn a second time
        node.areChildrenRendered = false
        let rendering = getRendering(node.data, node, ctx)
        if (node.id === "$root") {
            // the root node should not be rendered, only its children should.
            let children = ctx.renderChildren(node)
            let defs = <defs></defs>
            ctx.renderingDefs.forEach((value: VNode, key: String) => {
                (defs.children as (string | VNode)[]).push(value)
            })
            return <g>
                {defs}
                {...children}
            </g>
        }
        if (rendering === undefined) {
            return <g>
                {ctx.renderChildren(node)}
            </g>
        }
        if (node.areChildrenRendered) {
            return <g>
                {rendering}
            </g>
        } else {
            // TODO: sometimes the children should be rendered, although there is no child area (kgt without explicit childArea)
            // and sometimes the children should not be rendered, when there is no child area (collapsed renderings of sct) (not tested yet)
            // how should that be handled?
            return <g>
                {rendering}
                {ctx.renderChildren(node)}
            </g>
        }
    }
}

export class KPortView implements IView {
    render(port: KPort, context: RenderingContext): VNode {
        port.areChildrenRendered = false
        let rendering = getRendering(port.data, port, context as any)
        if (rendering === undefined) {
            return <g>
                {context.renderChildren(port)}
            </g>
        }
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

export class KLabelView implements IView {
    render(label: KLabel, context: RenderingContext): VNode {
        label.areChildrenRendered = false
        let rendering = getRendering(label.data, label, context as any)
        if (rendering === undefined) {
            return <g>
                {context.renderChildren(label)}
            </g>
        }
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

export class KEdgeView implements IView {
    render(edge: KEdge, context: RenderingContext): VNode {
        edge.areChildrenRendered = false
        let rendering = getRendering(edge.data, edge, context as any)
        if (rendering === undefined) {
            return <g>
                {context.renderChildren(edge)}
            </g>
        }
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