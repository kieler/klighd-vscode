/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

/** @jsx html */
import { inject, injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom";
import { AbstractUIExtension, html, IActionDispatcher, Patcher, PatcherProvider, SGraph, SModelRoot, TYPES } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Point } from "sprotty-protocol";
import { SKGraphModelRenderer } from "../skgraph-model-renderer";
import { SKNode } from "../skgraph-models";
import { SendProxyViewAction, ShowProxyViewAction } from "./proxy-view-actions";

@injectable()
export class ProxyView extends AbstractUIExtension {
    static readonly ID = "proxy-view";
    /** This actionDispatcher is needed for init(), so the class may be rendered as visible. */
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    /** Use for replacing the HTML elements. */
    @inject(TYPES.PatcherProvider) patcherProvider: PatcherProvider;
    private patcher: Patcher;
    private oldContentRoot: VNode;

    id(): string {
        return ProxyView.ID;
    }

    containerClass(): string {
        return ProxyView.ID;
    }

    @postConstruct()
    init(): void {
        // Send and show to proxy view
        this.actionDispatcher.dispatch(SendProxyViewAction.create(this));
        this.actionDispatcher.dispatch(ShowProxyViewAction.create());
        this.patcher = this.patcherProvider.patcher;
    }

    protected initializeContents(containerElement: HTMLElement): void {
        // Use temp for initializing oldContentRoot
        const temp = document.createElement("div");
        this.oldContentRoot = this.patcher(temp, <div />);
        containerElement.appendChild(temp);
    }

    protected onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRoot>, ...contextElementIds: string[]): void {
        // TODO: could be useful?
    }

    update(model: SGraph, ctx: SKGraphModelRenderer): void {
        /* Notes:
        - iterate through nodes starting by outer layer for efficiency
        - root.canvasBounds / model.canvasBounds -> get bounds for border region
        - root.id -> get file name (use for adding modules per diagram type)
        - root.children == model.children
        - this.containerElement -> remember this already exists, example:
            <div id="keith-diagram_sprotty_ProxyView" class="ProxyView" style="visibility: visible; opacity: 1;">
            <h1 style="color: red;">Hello, world!</h1>
            </div>
            - this.activeElement -> not sure yet
        - (context as SKGraphModelRenderer).depthMap -> depthmap, check if region is in bounds
            const depthMap = (context as SKGraphModelRenderer).depthMap;
            if (depthMap?.viewport !== undefined) {
                console.log(depthMap?.isInBounds(depthMap.rootRegions[0], depthMap.viewport));
            }
            - this.patcher() -> replaces oldRoot with newRoot
            - edges are handled like this: children=[SKNode, SKNode, SKEdge] -> edge between the nodes
            */
        if (!this.oldContentRoot) {
            return;
        }

        const width = model.canvasBounds.width;
        const height = model.canvasBounds.height;
        const scroll = model.scroll;
        const zoom = model.zoom;
        const root = model.children[0] as SKNode;
        // const rootClone: SKNode = Object.create(root);
        // rootClone.id += "-proxy";
        this.oldContentRoot = this.patcher(this.oldContentRoot,
            <svg style={
                {
                    width: width.toString(), height: height.toString(), // Set size to whole canvas
                    pointerEvents: "none" // Make click-through
                }
            }>
                {...this.createAllProxies(root, ctx, width, height, scroll, zoom)}
            </svg>);
    }

    /**
     * Returns the proxy rendering for all of currRoot's off-screen children and applies logic, e.g. clustering.
     */
    createAllProxies(currRoot: SKNode, ctx: SKGraphModelRenderer, canvasWidth: number, canvasHeight: number, scroll: Point, zoom: number): VNode[] {
        // Iterate through nodes starting by root
        // check if node is: 
        // (partially) in bounds -> no proxy, check children
        // out of bounds         -> proxy
        // TODO: save nodes for efficiency (no need for rerendering)

        const depthMap = ctx.depthMap;
        const viewport = ctx.viewport;
        if (!depthMap || !viewport) {
            // Not yet initialized
            return [];
        }

        // console.log(currRoot);

        const res: VNode[] = [];
        for (const node of currRoot.children as SKNode[]) {
            const region = depthMap.getProvidingRegion(node, viewport, ctx.renderOptionsRegistry);
            if (region && !depthMap.isInBounds(region, viewport)) {
                // Node out of bounds, create a proxy
                // This effectively clones the node, also change its id for good measure
                const clone: SKNode = Object.create(node);
                clone.id += "-proxy";

                const vnode = this.createSingleProxy(clone, ctx, canvasWidth, canvasHeight, scroll, zoom);
                if (vnode) {
                    res.push(vnode);
                }
            } else if (node.children.length > 0) {
                // Node in bounds, check children
                res.push(...this.createAllProxies(node, ctx, canvasWidth, canvasHeight, scroll, zoom));
            }
        }
        // TODO: clustering
        return res;
    }

    /**
     * Returns the proxy rendering for a single off-screen node and applies logic, e.g. where the proxy is placed place.
     */
    createSingleProxy(node: SKNode, ctx: SKGraphModelRenderer, canvasWidth: number, canvasHeight: number, scroll: Point, zoom: number): VNode | undefined {
        // TODO: width, height, x, y of canvas?

        /* Notes:
        - use a min-max-norm of sorts to render the proxy at the border (min/max the coords)
        - node bounds.x/y -> vnode transform: translate(x,y)
        */

        // Get absolute coordinates, could be more efficient
        // !!! TODO: might be a useful addition to save absolute coords in SKNode, not my task but also required here
        // Also TODO: take sidebar bounds/coords into consideration
        // Even more TODO: currently using bounds of SKNode, change to size later on?
        const bounds = node.bounds;
        let newX = bounds.x - scroll.x;
        let newY = bounds.y - scroll.y;
        let next = node.parent as SKNode;
        while (next) {
            newX += next.bounds.x;
            newY += next.bounds.y;
            next = next.parent as SKNode;
        }

        // Calculate position to put the proxy at
        newX = Math.max(0, Math.min(canvasWidth - bounds.width, newX * zoom));
        newY = Math.max(0, Math.min(canvasHeight - bounds.height, newY * zoom));

        // Calculate size
        const sizePercentage = 0.1; // TODO: could be configured in options
        const size = Math.min(canvasWidth, canvasHeight) * sizePercentage;

        let vnode = undefined;
        // if (node instanceof SKNode && !node.id.includes("$$")) {
        if (node instanceof SKNode && node.id.charAt(node.id.lastIndexOf("$") - 1) !== "$") {
            // Not an edge, not a comment/non-explicitly specified region
            // Don't just use includes("$$") since non-explicitly specified regions may contain nodes
            vnode = ctx.renderProxy(node, size, newX, newY);
        }
        return vnode;
    }
}
