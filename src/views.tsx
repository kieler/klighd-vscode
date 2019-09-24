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
import { injectable } from 'inversify';
import { svg } from 'snabbdom-jsx';
import { VNode } from 'snabbdom/vnode';
import { IView, RenderingContext, SGraph, SGraphView } from 'sprotty/lib';
import { SKEdge, SKLabel, SKNode, SKPort } from './skgraph-models';
import { SKGraphRenderingContext } from './views-common';
import { getJunctionPointRenderings, getRendering } from './views-rendering';
import { KStyles } from './views-styles';

/**
 * IView component that turns an SGraph element and its children into a tree of virtual DOM elements.
 * Extends the SGraphView by initializing the context for KGraph rendering.
 */
@injectable()
export class SKGraphView extends SGraphView {
    render(model: Readonly<SGraph>, context: RenderingContext): VNode {
        // TODO: 'as any' is not very nice, but SKGraphRenderingContext cannot be used here (two undefined members)
        const ctx = context as any as SKGraphRenderingContext
        ctx.renderingDefs = new Map
        return super.render(model, context)
    }
}

/**
 * IView component that translates a KNode and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KNodeView implements IView {
    render(node: SKNode, context: RenderingContext): VNode {
        // TODO: 'as any' is not very nice, but SKGraphRenderingContext cannot be used here (two undefined members)
        const ctx = context as any as SKGraphRenderingContext
        // reset this property, if the diagram is drawn a second time
        node.areChildrenRendered = false
        const rendering = getRendering(node.data, node, new KStyles, ctx)
        if (node.id === '$root') {
            // the root node should not be rendered, only its children should.
            const children = ctx.renderChildren(node)
            // Add all color and shadow definitions put into the context by the child renderings.
            const defs = <defs></defs>
            ctx.renderingDefs.forEach((value: VNode, key: String) => {
                (defs.children as (string | VNode)[]).push(value)
            })
            return <g>
                {defs}
                {...children}
            </g>
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
}

/**
 * IView component that translates a KPort and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KPortView implements IView {
    render(port: SKPort, context: RenderingContext): VNode {
        port.areChildrenRendered = false
        const rendering = getRendering(port.data, port, new KStyles, context as any)
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
    render(label: SKLabel, context: RenderingContext): VNode {
        label.areChildrenRendered = false
        const rendering = getRendering(label.data, label, new KStyles, context as any)
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
    render(edge: SKEdge, context: RenderingContext): VNode {
        edge.areChildrenRendered = false
        const rendering = getRendering(edge.data, edge, new KStyles, context as any)

        // Also get the renderings for all junction points
        const junctionPointRenderings = getJunctionPointRenderings(edge, context as any)

        // If no rendering could be found, just render its children.
        if (rendering === undefined) {
            return <g>
                {context.renderChildren(edge)}
                {...junctionPointRenderings}
            </g>
        }
        // Default cases. If the children are already rendered within a KChildArea, only return the rendering. Otherwise, add the children by default.
        if (edge.areChildrenRendered) {
            return <g>
                {rendering}
                {...junctionPointRenderings}
            </g>
        } else {
            return <g>
                {rendering}
                {context.renderChildren(edge)}
                {...junctionPointRenderings}
            </g>
        }
    }
}