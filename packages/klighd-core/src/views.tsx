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
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
/** @jsx svg */
import { svg } from 'snabbdom-jsx'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { VNode } from 'snabbdom/vnode';

import { isChildSelected } from '@kieler/klighd-interactive/lib/helper-methods';
import { renderConstraints, renderInteractiveLayout } from '@kieler/klighd-interactive/lib/interactive-view';
import { KlighdInteractiveMouseListener } from '@kieler/klighd-interactive/lib/klighd-interactive-mouselistener';
import { inject, injectable } from 'inversify';
import { findParentByFeature, isViewport, IView, RenderingContext, SGraph, SGraphFactory, SGraphView, TYPES } from 'sprotty/lib';
import { RenderOptionsRegistry, ShowConstraintOption, UseSmartZoom } from './options/render-options-registry';
import { DepthMap } from './depth-map';
import { SKGraphModelRenderer } from './skgraph-model-renderer';
import { SKEdge, SKLabel, SKNode, SKPort } from './skgraph-models';
import { getJunctionPointRenderings, getRendering } from './views-rendering';
import { KStyles } from './views-styles';
import { DISymbol } from './di.symbols';

/**
 * IView component that turns an SGraph element and its children into a tree of virtual DOM elements.
 * Extends the SGraphView by initializing the context for KGraph rendering.
 */
@injectable()
export class SKGraphView extends SGraphView {

    @inject(DISymbol.RenderOptionsRegistry) protected renderOptionsRegistry: RenderOptionsRegistry

    render(model: Readonly<SGraph>, context: RenderingContext): VNode {
        const ctx = context as SKGraphModelRenderer
        ctx.renderingDefs = new Map
        ctx.renderingOptions = this.renderOptionsRegistry;

        const viewport = findParentByFeature(model, isViewport)
        if (viewport) {
            ctx.viewport = viewport
        }



        // Add depthMap to context for rendering, when required.
        const smartZoomOption = this.renderOptionsRegistry.getValueForId(UseSmartZoom.ID)

        // Only enable, if option is found.
        const useSmartZoom = smartZoomOption ?? false

        if (useSmartZoom && ctx.targetKind !== 'hidden') {
            ctx.depthMap = DepthMap.getDM()
            if (ctx.viewport && ctx.depthMap) {
                ctx.depthMap.updateDetailLevels(ctx.viewport, this.renderOptionsRegistry)
            }
        } else {
            ctx.depthMap = undefined
        }

        //  do the same as return super.render(model, context)
        // but reuse the child rendering if nothing changed there

        const transform = `scale(${model.zoom}) translate(${-model.scroll.x},${-model.scroll.y})`;

        const childsRedered = context.renderChildren(model)

        return <svg class-sprotty-graph={true}>
            <g transform={transform}>
                {childsRedered}
            </g>
        </svg>;

    }
}

/**
 * IView component that translates a KNode and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KNodeView implements IView {

    @inject(KlighdInteractiveMouseListener) mListener: KlighdInteractiveMouseListener
    @inject(DISymbol.RenderOptionsRegistry) protected renderOptionsRegistry: RenderOptionsRegistry
    @inject(TYPES.IModelFactory) protected graphFactory: SGraphFactory

    render(node: SKNode, context: RenderingContext): VNode {
        const ctx = context as SKGraphModelRenderer
        // reset these properties, if the diagram is drawn a second time
        node.areChildAreaChildrenRendered = false
        node.areNonChildAreaChildrenRendered = false

        const result: VNode[] = []

        const isShadow = node.shadow
        let interactiveNodes = undefined

        if (isChildSelected(node as SKNode)) {
            if (((node as SKNode).properties.interactiveLayout) && this.mListener.hasDragged) {
                // Render the objects indicating the layer and positions in the graph
                interactiveNodes = renderInteractiveLayout(node as SKNode)
            }
        }

        if (node.id === '$root') {
            // The root node should not be rendered, only its children should.
            const children = ctx.renderChildren(node)
            // Add all color and shadow definitions put into the context by the child renderings.
            const defs = <defs></defs>
            ctx.renderingDefs.forEach((value: VNode, key: string) => {
                (defs.children as (string | VNode)[]).push(value)
            })

            result.push(defs)
            if (interactiveNodes) {
                result.push(interactiveNodes)
            }
            result.push(...children)

            return <g>{...result}</g>
        }

        let interactiveConstraints = undefined

        // Render nodes and constraint icon. All nodes that are not moved do not have a shadow and have their opacity set to 0.1.
        node.shadow = false
        let rendering = undefined
        if (!this.mListener.hasDragged || isChildSelected(node.parent as SKNode)) {
            // Node should only be visible if the node is in the same hierarchical level as the moved node or no node is moved at all
            rendering = getRendering(node.data, node, new KStyles, ctx, this.mListener)

            if (this.renderOptionsRegistry.getValueForId(ShowConstraintOption.ID) && (node.parent as SKNode).properties && (node.parent as SKNode).properties.interactiveLayout) {
                // render icon visualizing the set Constraints
                interactiveConstraints = renderConstraints(node)
            }

            // Currently does not work, since it changes the order of teh nodes in the dom.
            // After setting a constraint and deleting it afterwards this leads to the problem that one node is there twice and one is gone
            // until the diagram is again updated.
            // if (node.selected) {
            //     let root = node.parent
            //     while ((root as SKNode).parent) {
            //         root = (root as SKNode).parent
            //     }
            //     new BringToFrontCommand(new BringToFrontAction([node.id])).execute({
            //         root: root as SModelRoot,
            //         modelFactory: this.graphFactory,
            //         duration: 100,
            //         modelChanged: undefined!,
            //         logger: new ConsoleLogger(),
            //         syncer: new AnimationFrameSyncer()

            //     })
            // }
        } else {
            node.opacity = 0.1
            rendering = getRendering(node.data, node, new KStyles, ctx, this.mListener)
        }

        node.shadow = isShadow

        let shadow = undefined

        if (isShadow) {
            // Render shadow of the node
            shadow = getRendering(node.data, node, new KStyles, ctx, this.mListener)
        }

        // Add renderings that are not undefined
        if (shadow !== undefined) {
            result.push(shadow)
        }
        if (rendering !== undefined) {
            result.push(rendering)
        } else {
            return <g>
                {ctx.renderChildren(node)}
            </g>
        }
        if (interactiveNodes) {
            result.push(interactiveNodes)
        }
        if (interactiveConstraints) {
            result.push(interactiveConstraints)
        }
        // Default case. If no child area children or no non-child area children are already rendered within the rendering, add the children by default.
        if (!node.areChildAreaChildrenRendered) {
            result.push(...ctx.renderChildren(node))
        } else if (!node.areNonChildAreaChildrenRendered) {
            result.push(...ctx.renderNonChildAreaChildren(node))
        }
        return <g>{...result}</g>
    }
}


/**
 * IView component that translates a KPort and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KPortView implements IView {

    @inject(KlighdInteractiveMouseListener) mListener: KlighdInteractiveMouseListener
    render(port: SKPort, context: RenderingContext): VNode {
        const ctx = context as SKGraphModelRenderer
        port.areChildAreaChildrenRendered = false
        port.areNonChildAreaChildrenRendered = false
        const rendering = getRendering(port.data, port, new KStyles, ctx, this.mListener)
        // If no rendering could be found, just render its children.
        if (rendering === undefined) {
            return <g>
                {ctx.renderChildren(port)}
            </g>
        }
        // Default case. If no child area children or no non-child area children are already rendered within the rendering, add the children by default.
        if (!port.areChildAreaChildrenRendered) {
            return <g>
                {rendering}
                {ctx.renderChildren(port)}
            </g>
        } else if (!port.areNonChildAreaChildrenRendered) {
            return <g>
                {rendering}
                {ctx.renderNonChildAreaChildren(port)}
            </g>
        } else {
            return <g>
                {rendering}
            </g>
        }
    }
}

/**
 * IView component that translates a KLabel and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KLabelView implements IView {
    @inject(KlighdInteractiveMouseListener) mListener: KlighdInteractiveMouseListener

    render(label: SKLabel, context: RenderingContext): VNode {
        const ctx = context as SKGraphModelRenderer
        label.areChildAreaChildrenRendered = false
        label.areNonChildAreaChildrenRendered = false

        // let parent = label.parent
        if (this.mListener.hasDragged) {
            // Nodes that are not on the same hierarchy are less visible.
            label.opacity = 0.1
        }
        const rendering = getRendering(label.data, label, new KStyles, ctx, this.mListener)

        // If no rendering could be found, just render its children.
        if (rendering === undefined) {
            return <g>
                {ctx.renderChildren(label)}
            </g>
        }
        // Default case. If no child area children or no non-child area children are already rendered within the rendering, add the children by default.
        if (!label.areChildAreaChildrenRendered) {
            return <g>
                {rendering}
                {ctx.renderChildren(label)}
            </g>
        } else if (!label.areNonChildAreaChildrenRendered) {
            return <g>
                {rendering}
                {ctx.renderNonChildAreaChildren(label)}
            </g>
        } else {
            return <g>
                {rendering}
            </g>
        }
    }
}

/**
 * IView component that translates a KEdge and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KEdgeView implements IView {

    @inject(KlighdInteractiveMouseListener) mListener: KlighdInteractiveMouseListener

    render(edge: SKEdge, context: RenderingContext): VNode {
        const ctx = context as SKGraphModelRenderer
        edge.areChildAreaChildrenRendered = false
        edge.areNonChildAreaChildrenRendered = false

        const s = edge.source
        const t = edge.target

        // Do not draw edges without a source or target.
        if (s === undefined || t === undefined) {
            return <g />
        }
        // edge should be greyed out if the source or target is moved
        if (s !== undefined && t !== undefined && s instanceof SKNode && t instanceof SKNode) {
            edge.moved = (s.selected || t.selected) && this.mListener.hasDragged
        }

        let rendering = undefined
        if (!this.mListener.hasDragged || isChildSelected(edge.parent as SKNode)) {
            // edge should only be visible if it is in the same hierarchical level as
            // the moved node or no node is moved at all
            rendering = getRendering(edge.data, edge, new KStyles, ctx, this.mListener)
        }
        edge.moved = false

        // Also get the renderings for all junction points
        const junctionPointRenderings = getJunctionPointRenderings(edge, ctx, this.mListener)

        // If no rendering could be found, just render its children.
        if (rendering === undefined) {
            return <g>
                {ctx.renderChildren(edge)}
                {...junctionPointRenderings}
            </g>
        }
        // Default case. If no child area children or no non-child area children are already rendered within the rendering, add the children by default.
        if (!edge.areChildAreaChildrenRendered) {
            return <g>
                {rendering}
                {ctx.renderChildren(edge)}
                {...junctionPointRenderings}
            </g>
        } else if (!edge.areNonChildAreaChildrenRendered) {
            return <g>
                {rendering}
                {ctx.renderNonChildAreaChildren(edge)}
                {...junctionPointRenderings}
            </g>
        } else {
            return <g>
                {rendering}
                {...junctionPointRenderings}
            </g>
        }
    }
}