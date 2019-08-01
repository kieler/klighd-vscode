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
import { KEdge, KLabel, KPort, KNode } from './kgraph-models';
import { KGraphRenderingContext } from './views-common';
import { getRendering } from './views-rendering';
import { InteractiveMouseListener } from '@kieler/keith-interactive/lib/InteractiveMouseListener'
import { isChildSelected } from '@kieler/keith-interactive/lib/ConstraintUtils'
import { renderInteractiveLayout, renderConstraints } from './interactiveView';

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

    @inject(InteractiveMouseListener) mListener: InteractiveMouseListener

    render(node: KNode, context: RenderingContext): VNode {
        // TODO: 'as any' is not very nice, but KGraphRenderingContext cannot be used here (two undefined members)
        const ctx = context as any as KGraphRenderingContext
        // reset this property, if the diagram is drawn a second time
        node.areChildrenRendered = false

        let result = <g></g>
        // reset hierarchical bounds
        node.hierHeight = 0
        node.hierWidth = 0

        // render shadow of the node
        let isShadow = node.shadow
        let shadow = undefined
        if (this.mListener.hasDragged && isShadow) {
            shadow = getRendering(node.data, node, context as any)
            node.shadow = false
        }

        // render the objects indicating the layer and positions in the graph
        let layer = undefined
        if (this.mListener.hasDragged && isChildSelected(node)) {
            layer = <g>{renderInteractiveLayout(node)}</g>
        }

        // render node
        let rendering = undefined
        let constraints = <g></g>
        if (!this.mListener.hasDragged || isChildSelected(node) || isChildSelected(node.parent as KNode)) {
            // node should only be visible if the node is in the same hierarchical level as the moved node or it is the
            // root of the moved node or no node is moved at all
            rendering = getRendering(node.data, node, ctx)
            // render icons visualizing the set Constraints
            constraints = renderConstraints(node)
        }
        node.shadow = isShadow

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

            return <g>
                        {result}
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
        if (layer !== undefined) {
            result = <g>{result}{layer}</g>
        }
        // Default case. If the children are not already rendered within a KChildArea add the children by default.
        if (!node.areChildrenRendered) {
            result = <g>{result}{constraints}{ctx.renderChildren(node)}</g>
        }
        return result
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

    @inject(InteractiveMouseListener) mListener: InteractiveMouseListener

    render(edge: KEdge, context: RenderingContext): VNode {
        edge.areChildrenRendered = false

        // edge should be greyed out if the source or target is moved
        let s = edge.source
        let t = edge.target
        if (s !== undefined && t !== undefined && s instanceof KNode && t instanceof KNode) {
            edge.moved = (s.selected || t.selected) && this.mListener.hasDragged
        }

        let rendering = undefined
        if (!this.mListener.hasDragged || isChildSelected(edge.parent as KNode)) {
            // edge should only be visible if it is in the same hierarchical level as
            // the moved node or no node is moved at all
            rendering = getRendering(edge.data, edge, context as any)
        }
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