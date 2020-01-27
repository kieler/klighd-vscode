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
import { renderInteractiveLayout, renderConstraints } from '@kieler/keith-interactive/lib/interactive-view';
import { isChildSelected } from '@kieler/keith-interactive/lib/helper-methods'
import { KeithInteractiveMouseListener } from '@kieler/keith-interactive/lib/keith-interactive-mouselistener'
import { RenderOptions } from './options';
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

    @inject(KeithInteractiveMouseListener) mListener: KeithInteractiveMouseListener
    @inject(RenderOptions) protected rOptions: RenderOptions

    render(node: SKNode, context: RenderingContext): VNode {
        // TODO: 'as any' is not very nice, but KGraphRenderingContext cannot be used here (two undefined members)
        const ctx = context as any as SKGraphRenderingContext
        // reset this property, if the diagram is drawn a second time
        node.areChildrenRendered = false

        let result = <g></g>

        // reset hierarchical bounds
        node.hierHeight = 0
        node.hierWidth = 0

        let isShadow = node.shadow
        let shadow = undefined
        let layer = <g></g>
        let constraints = <g></g>

        if (((node as SKNode).properties.interactiveLayout) && this.mListener.hasDragged) {
            if (isShadow) {
                // render shadow of the node
                shadow = getRendering(node.data, node, new KStyles, context as any)
            }

            if (isChildSelected(node as SKNode)) {
                // render the objects indicating the layer and positions in the graph
                layer = <g>{renderInteractiveLayout(node as SKNode)}</g>
            }
        }

        // render node & icon
        node.shadow = false
        let rendering = undefined
        if (!this.mListener.hasDragged || isChildSelected(node.parent as SKNode)) {
            // Node should only be visible if the node is in the same hierarchical level as the moved node or no node is moved at all
            rendering = getRendering(node.data, node, new KStyles, ctx)

            if (this.rOptions.getShowConstraint() && (node.parent as SKNode).properties && (node.parent as SKNode).properties.interactiveLayout) {
                // render icon visualizing the set Constraints
                constraints = renderConstraints(node)
            }
        }
        node.shadow = isShadow

        if (node.id === '$root') {
            // the root node should not be rendered, only its children should.
            const children = ctx.renderChildren(node)
            // Add all color and shadow definitions put into the context by the child renderings.
            const defs = <defs></defs>
            ctx.renderingDefs.forEach((value: VNode, key: String) => {
                (defs.children as (string | VNode)[]).push(value)
            })

            return <g>
                        {result}
                        {layer}
                        {defs}
                        {...children}
                    </g>
        }

        // add renderings that are not undefined
        if (shadow !== undefined) {
            result = <g>{result}{shadow}</g>
        }
        if (rendering !== undefined) {
            result = <g>{result}{rendering}</g>
        }
        result = <g>{result}{layer}{constraints}</g>
        // Default case. If the children are not already rendered within a KChildArea add the children by default.
        if (!node.areChildrenRendered) {
            result = <g>{result}{ctx.renderChildren(node)}</g>
        }
        return result
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
    @inject(KeithInteractiveMouseListener) mListener: KeithInteractiveMouseListener

    render(label: SKLabel, context: RenderingContext): VNode {
        label.areChildrenRendered = false

        let parent = label.parent
        let rendering = undefined
        // labels should not be visible if the nodes are hidden
        if (!(parent instanceof SKNode) || isChildSelected(parent) || isChildSelected(parent.parent as SKNode) || !this.mListener.hasDragged) {
            rendering = getRendering(label.data, label, new KStyles, context as any)
        }
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

    @inject(KeithInteractiveMouseListener) mListener: KeithInteractiveMouseListener

    render(edge: SKEdge, context: RenderingContext): VNode {
        edge.areChildrenRendered = false

        // edge should be greyed out if the source or target is moved
        let s = edge.source
        let t = edge.target
        if (s !== undefined && t !== undefined && s instanceof SKNode && t instanceof SKNode) {
            edge.moved = (s.selected || t.selected) && this.mListener.hasDragged
        }

        let rendering = undefined
        if (!this.mListener.hasDragged || isChildSelected(edge.parent as SKNode)) {
            // edge should only be visible if it is in the same hierarchical level as
            // the moved node or no node is moved at all
            rendering = getRendering(edge.data, edge, new KStyles, context as any)
        }
        edge.moved = false

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