/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2022 by
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
import { isChildSelected } from '@kieler/klighd-interactive/lib/helper-methods';
import { renderConstraints, renderInteractiveLayout } from '@kieler/klighd-interactive/lib/interactive-view';
import { KlighdInteractiveMouseListener } from '@kieler/klighd-interactive/lib/klighd-interactive-mouselistener';
import { inject, injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { findParentByFeature, isViewport, IView, RenderingContext, SGraph, svg } from 'sprotty'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { DepthMap, DetailLevel } from './depth-map';
import { DISymbol } from './di.symbols';
import { overpass_mono_regular_style, overpass_regular_style } from './fonts/overpass';
import { RenderOptionsRegistry, ShowConstraintOption, UseSmartZoom } from './options/render-options-registry';
import { SKGraphModelRenderer } from './skgraph-model-renderer';
import { SKEdge, SKLabel, SKNode, SKPort } from './skgraph-models';
import { getJunctionPointRenderings, getRendering } from './views-rendering';
import { KStyles } from './views-styles';

/**
 * IView component that turns an SGraph element and its children into a tree of virtual DOM elements.
 * Extends the SGraphView by initializing the context for KGraph rendering.
 */
@injectable()
export class SKGraphView implements IView {

    @inject(KlighdInteractiveMouseListener) mListener: KlighdInteractiveMouseListener
    @inject(DISymbol.RenderOptionsRegistry) renderOptionsRegistry: RenderOptionsRegistry

    render(model: Readonly<SGraph>, context: RenderingContext): VNode {
        const ctx = context as SKGraphModelRenderer
        ctx.renderingDefs = new Map
        ctx.renderingDefs.set("font", fontDefinition())
        ctx.mListener = this.mListener
        ctx.renderOptionsRegistry = this.renderOptionsRegistry

        const viewport = findParentByFeature(model, isViewport)
        if (viewport) {
            ctx.viewport = viewport
        }
        ctx.titles = []
        ctx.positions = []



        // Add depthMap to context for rendering, when required.
        const smartZoomOption = ctx.renderOptionsRegistry.getValue(UseSmartZoom)

        // Only enable, if option is found.
        const useSmartZoom = smartZoomOption ?? false

        if (useSmartZoom && ctx.targetKind !== 'hidden') {
            ctx.depthMap = DepthMap.getDM()
            if (ctx.viewport && ctx.depthMap) {
                ctx.depthMap.updateDetailLevels(ctx.viewport, ctx.renderOptionsRegistry)
            }
        } else {
            ctx.depthMap = undefined
        }

        const transform = `scale(${model.zoom}) translate(${-model.scroll.x},${-model.scroll.y})`;
        return <svg class-sprotty-graph={true}>
            <g transform={transform}>
                {context.renderChildren(model)}
            </g>
        </svg>;
    }
}

/**
 * IView component that translates a KNode and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KNodeView implements IView {

    render(node: SKNode, context: RenderingContext): VNode | undefined {
        // Add new level to title and position array for correct placement of titles
        const ctx = context as SKGraphModelRenderer

        if (ctx.depthMap) {
            const containingRegion = ctx.depthMap.getContainingRegion(node, ctx.viewport, ctx.renderOptionsRegistry)
            if (ctx.depthMap && containingRegion && containingRegion.detail !== DetailLevel.FullDetails) {
                // Make sure this node and its children are not drawn as long as it is not on full details.
                node.areChildAreaChildrenRendered = true
                node.areNonChildAreaChildrenRendered = true
                return undefined
            }
        }

        ctx.titles.push([])
        ctx.positions.push("")
        // reset these properties, if the diagram is drawn a second time
        node.areChildAreaChildrenRendered = false
        node.areNonChildAreaChildrenRendered = false

        const result: VNode[] = []

        const isShadow = node.shadow
        let shadow = undefined
        let interactiveNodes = undefined
        let interactiveConstraints = undefined

        if (isShadow) {
            // Render shadow of the node
            shadow = getRendering(node.data, node, new KStyles, ctx)
        }
        if (isChildSelected(node as SKNode)) {
            if (((node as SKNode).properties.interactiveLayout) && ctx.mListener.hasDragged) {
                // Render the objects indicating the layer and positions in the graph
                interactiveNodes = renderInteractiveLayout(node as SKNode)
            }
        }

        // Render nodes and constraint icon. All nodes that are not moved do not have a shadow and have their opacity set to 0.1.
        node.shadow = false
        let rendering = undefined
        if (!ctx.mListener.hasDragged || isChildSelected(node.parent as SKNode)) {
            // Node should only be visible if the node is in the same hierarchical level as the moved node or no node is moved at all
            rendering = getRendering(node.data, node, new KStyles, ctx)

            if (ctx.renderOptionsRegistry.getValue(ShowConstraintOption) && (node.parent as SKNode).properties && (node.parent as SKNode).properties.interactiveLayout) {
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
            rendering = getRendering(node.data, node, new KStyles, ctx)
        }
        node.shadow = isShadow

        if (node.id === '$root') {
            // The root node should not be rendered, only its children should.
            const children = ctx.renderChildren(node)
            // Add all color and shadow definitions put into the context by the child renderings.
            const defs = <defs></defs>
            ctx.renderingDefs.forEach((value: VNode) => {
                (defs.children as (string | VNode)[]).push(value)
            })

            result.push(defs)
            if (interactiveNodes) {
                result.push(interactiveNodes)
            }
            result.push(...children)
            result.push(...(ctx.titles.pop() ?? []))
            ctx.positions.pop()
            return <g>{...result}</g>
            // return scaleRendering(<g>{...result}</g>, node)
        }

        // Add renderings that are not undefined
        if (shadow !== undefined) {
            result.push(shadow)
        }
        if (rendering !== undefined) {
            result.push(rendering)
        } else {
            ctx.positions.pop()
            // return scaleRendering(<g>
            //     {ctx.titles.pop() ?? []}
            //     {ctx.renderChildren(node)}
            // </g>, node)
            return <g>
               {ctx.titles.pop() ?? []}
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
            console.log("child area children are not rendered: " + node.id) // elkgraphs completely land here
        } else if (!node.areNonChildAreaChildrenRendered) {
            console.log("non-child area children are not rendered: " + node.id) // nodes with children in sccharts land here
            result.push(...ctx.renderNonChildAreaChildren(node))
        }
        result.push(...(ctx.titles.pop() ?? []))
        ctx.positions.pop()

        result.map(rendering => scaleRendering(rendering, node))
        // scalerendering has SIDE EFFECTS, not so nice when combining it with the functional map
        // TODO: here instead of scaling the result we need either scale exactly the child area or if there is no child area, all child nodes wrapped in one <g>
        return <g>{...result}</g> // <-- this for stuff with child areas (sccharts), there is an extra element in between children and parent
        // return scaleRendering(<g>{...result}</g>, node) <-- this for stuff without child areas + different internals of scaleRendering necessary, because 
        //                                                     children are siblings of other renderings that belong to the parent such as the parents rectangle
    }
}


/**
 * IView component that translates a KPort and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KPortView implements IView {

    render(port: SKPort, context: RenderingContext): VNode | undefined {
        // Add new level to title and position array for correct placement of titles
        const ctx = context as SKGraphModelRenderer

        if (ctx.depthMap) {
            const containingRegion = ctx.depthMap.getContainingRegion(port, ctx.viewport, ctx.renderOptionsRegistry)
            if (ctx.depthMap && containingRegion && containingRegion.detail !== DetailLevel.FullDetails) {
                port.areChildAreaChildrenRendered = true
                port.areNonChildAreaChildrenRendered = true
                return undefined
            }
        }

        ctx.titles.push([])
        ctx.positions.push("")
        port.areChildAreaChildrenRendered = false
        port.areNonChildAreaChildrenRendered = false
        const rendering = getRendering(port.data, port, new KStyles, ctx)
        // If no rendering could be found, just render its children.
        if (rendering === undefined) {
            const element = <g>
                {ctx.titles.pop() ?? []}
                {ctx.renderChildren(port)}
            </g>

            ctx.positions.pop()
            return element
        }
        // Default case. If no child area children or no non-child area children are already rendered within the rendering, add the children by default.
        let element: VNode
        if (!port.areChildAreaChildrenRendered) {
            element = <g>
                {rendering}
                {ctx.titles.pop() ?? []}
                {ctx.renderChildren(port)}
            </g>
        } else if (!port.areNonChildAreaChildrenRendered) {
            element = <g>
                {rendering}
                {ctx.titles.pop() ?? []}
                {ctx.renderNonChildAreaChildren(port)}
            </g>
        } else {
            element = <g>
                {rendering}
                {ctx.titles.pop() ?? []}
            </g>
        }

        ctx.positions.pop()
        return element
    }
}

/**
 * IView component that translates a KLabel and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KLabelView implements IView {

    render(label: SKLabel, context: RenderingContext): VNode | undefined {
        // Add new level to title and position array for correct placement of titles
        const ctx = context as SKGraphModelRenderer

        if (ctx.depthMap) {
            const containingRegion = ctx.depthMap.getContainingRegion(label, ctx.viewport, ctx.renderOptionsRegistry)
            if (ctx.depthMap && containingRegion && containingRegion.detail !== DetailLevel.FullDetails) {
                label.areChildAreaChildrenRendered = true
                label.areNonChildAreaChildrenRendered = true
                return undefined
            }
        }
        ctx.titles.push([])
        ctx.positions.push("")
        label.areChildAreaChildrenRendered = false
        label.areNonChildAreaChildrenRendered = false

        // let parent = label.parent
        if (ctx.mListener.hasDragged) {
            // Nodes that are not on the same hierarchy are less visible.
            label.opacity = 0.1
        }
        const rendering = getRendering(label.data, label, new KStyles, ctx)

        // If no rendering could be found, just render its children.
        if (rendering === undefined) {
            const element = <g>
                {ctx.renderChildren(label).push(...ctx.titles.pop() ?? [])}
            </g>

            ctx.positions.pop()
            return element
        }
        // Default case. If no child area children or no non-child area children are already rendered within the rendering, add the children by default.
        let element: VNode
        if (!label.areChildAreaChildrenRendered) {
            element = <g>
                {rendering}
                {ctx.titles.pop() ?? []}
                {ctx.renderChildren(label)}
            </g>
        } else if (!label.areNonChildAreaChildrenRendered) {
            element = <g>
                {rendering}
                {ctx.titles.pop() ?? []}
                {ctx.renderNonChildAreaChildren(label)}
            </g>
        } else {
            element = <g>
                {rendering}
                {ctx.titles.pop() ?? []}
            </g>
        }

        ctx.positions.pop()
        return element
    }
}

/**
 * IView component that translates a KEdge and its children into a tree of virtual DOM elements.
 */
@injectable()
export class KEdgeView implements IView {

    render(edge: SKEdge, context: RenderingContext): VNode | undefined {
        const ctx = context as SKGraphModelRenderer

        if (ctx.depthMap) {
            const containingRegion = ctx.depthMap.getContainingRegion(edge, ctx.viewport, ctx.renderOptionsRegistry)
            if (ctx.depthMap && containingRegion && containingRegion.detail !== DetailLevel.FullDetails) {
                edge.areChildAreaChildrenRendered = true
                edge.areNonChildAreaChildrenRendered = true
                return undefined
            }
        }

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
            edge.moved = (s.selected || t.selected) && ctx.mListener.hasDragged
        }

        let rendering = undefined
        if (!ctx.mListener.hasDragged || isChildSelected(edge.parent as SKNode)) {
            // edge should only be visible if it is in the same hierarchical level as
            // the moved node or no node is moved at all
            rendering = getRendering(edge.data, edge, new KStyles, ctx)
        }
        edge.moved = false

        // Also get the renderings for all junction points
        const junctionPointRenderings = getJunctionPointRenderings(edge, ctx)

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

function fontDefinition(): VNode {
    // TODO: maybe find a way to only include the font if it is used in the SVG.
    return <style>
        {overpass_regular_style}
        {overpass_mono_regular_style}
    </style>
}

function scaleRendering(rendering: VNode, parent: SKNode) {

    // This code would need to be called one parent higher so that we always have access to all the children correctly
    // The problem still remains though how to manipulate the svg in the right places
    // A better solution handles this more abstractly somewhere else, but I'm not sure where

    if ((parent as any).properties == undefined || (parent as any).properties['org.eclipse.elk.topdown.scaleFactor'] == undefined) {
        return rendering
    }
    // FIXME: this only works correctly for SCCharts
    const topdownScaleFactor = (parent as any).properties['org.eclipse.elk.topdown.scaleFactor'] as number

    if (rendering.children != undefined) {
        if (rendering.children.length >= 2) {

            rendering.children[1] = <g transform={`scale (${topdownScaleFactor})`}>${rendering.children[1]}</g>
        }
    }
    return rendering
}