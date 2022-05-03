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
import { DepthMap } from "../depth-map";
import { SKGraphModelRenderer } from "../skgraph-model-renderer";
import { SKNode } from "../skgraph-models";
import { SendProxyViewAction, ShowProxyViewAction } from "./proxy-view-actions";

@injectable()
export class ProxyView extends AbstractUIExtension {
    /** ID. */
    static readonly ID = "proxy-view";
    /** ActionDispatcher mainly needed for init(). */
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    /** Used to replace HTML elements. */
    @inject(TYPES.PatcherProvider) patcherProvider: PatcherProvider;
    private patcher: Patcher;
    /** VNode of the current HTML root element. Used by the {@link patcher}. */
    private currHTMLRoot: VNode;
    // TODO: when the diagram is changed these maps should be reloaded
    /**
     * Stores the proxy renderings of already rendered nodes.
     * Always make sure the ids ending with "-proxy" are used.
     */
    private renderings: Map<string, VNode>;
    /**
     * Stores the relative coordinates (without scroll) of already rendered nodes.
     * Always make sure the ids ending with "-proxy" are used.
     */
    private positions: Map<string, Point>;

    id(): string {
        return ProxyView.ID;
    }

    containerClass(): string {
        return ProxyView.ID;
    }

    @postConstruct()
    init(): void {
        // Send and show proxy view
        this.actionDispatcher.dispatch(SendProxyViewAction.create(this));
        this.actionDispatcher.dispatch(ShowProxyViewAction.create());
        this.patcher = this.patcherProvider.patcher;
        this.renderings = new Map;
        this.positions = new Map;
    }

    protected initializeContents(containerElement: HTMLElement): void {
        // Use temp for initializing oldContentRoot
        const temp = document.createElement("div");
        this.currHTMLRoot = this.patcher(temp, <div />);
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
        if (!this.currHTMLRoot) {
            return;
        } else if (!ctx.depthMap) {
            // Create a new depthmap if otherwise unused
            ctx.depthMap = DepthMap.init(model);
        }

        const width = model.canvasBounds.width;
        const height = model.canvasBounds.height;
        const scroll = model.scroll;
        const zoom = model.zoom;
        const root = model.children[0] as SKNode;
        // const rootClone: SKNode = Object.create(root);
        // rootClone.id += "-proxy";
        this.currHTMLRoot = this.patcher(this.currHTMLRoot,
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
    private createAllProxies(currRoot: SKNode, ctx: SKGraphModelRenderer, canvasWidth: number, canvasHeight: number, scroll: Point, zoom: number): VNode[] {
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
    private createSingleProxy(node: SKNode, ctx: SKGraphModelRenderer, canvasWidth: number, canvasHeight: number, scroll: Point, zoom: number): VNode | undefined {
        /* Notes:
        - use a min-max-norm of sorts to render the proxy at the border (min/max the coords)
        - node bounds.x/y -> vnode transform: translate(x,y)
        */

        const id = node.id.endsWith("-proxy") ? node.id : node.id + "-proxy";
        let vnode = this.renderings.get(id);
        if (vnode && vnode.data && vnode.data.attrs) {
            // Node has already been rendered, update position and return
            // TODO: dynamic position update only partially working, transform updates only once the <g> is removed from html, ask Max about this
            const pos = this.getPosition(node, canvasWidth, canvasHeight, scroll, zoom);
            // vnode.data.attrs["transform"] = `translate(${pos.x}, ${pos.y})`; // Update position once non-rendered
            // document.getElementById(`keith-diagram_sprotty_${id}`)?.setAttribute("transform", `translate(${pos.x}, ${pos.y})`); // Update position while rendered
            // console.log(document.getElementById(`keith-diagram_sprotty_${node.id}`));
            // console.log(vnode);
            return vnode;
        }

        if (node instanceof SKNode && id.charAt(id.lastIndexOf("$") - 1) !== "$") {
            // Not an edge, not a comment/non-explicitly specified region
            // Don't just use includes("$$") since non-explicitly specified regions may contain nodes

            const pos = this.getPosition(node, canvasWidth, canvasHeight, scroll, zoom);

            // Calculate size
            const sizePercentage = 0.1; // TODO: could be configured in options
            const size = Math.min(canvasWidth, canvasHeight) * sizePercentage;

            vnode = ctx.renderProxy(node, size);
            if (vnode && vnode.data && vnode.data.attrs) {
                // Place proxy at the calculated position
                vnode.data.attrs["transform"] = `translate(${pos.x}, ${pos.y})`;
                // TODO: non-click-through or click-through? Mouseevents should work either way
                // vnode.data.attrs["style"] = "pointer-events: auto; " + (vnode.data.attrs["style"] ?? "");
            }
        }

        if (vnode) {
            // Store this node
            this.renderings.set(id, vnode);
        }

        return vnode;
    }

    /** Calculates the position to place this node's proxy at. */
    private getPosition(node: SKNode, canvasWidth: number, canvasHeight: number, scroll: Point, zoom: number): Point {
        // !!! TODO: might be a useful addition to save absolute coords in SKNode, not my task but also required here
        // Also TODO: take sidebar bounds/coords into consideration
        const point = this.getPositionRec(node);
        let x = (point.x - scroll.x) * zoom;
        let y = (point.y - scroll.y) * zoom;
        // TODO: currently using bounds width/height of SKNode, change to size later on?
        const nodeWidth = node.bounds.width;
        const nodeHeight = node.bounds.height;

        // Calculate position to put the proxy at
        x = Math.max(0, Math.min(canvasWidth - nodeWidth, x));
        y = Math.max(0, Math.min(canvasHeight - nodeHeight, y));

        // Make sure the proxies aren't rendered behind the sidebar buttons at the top right
        /* Don't need to check for the opened sidebar since it closes as soon as the diagram is moved
          (onMouseDown), e.g. don't reposition proxies accordingly */
        const rect = document.querySelector('.sidebar__toggle-container')?.getBoundingClientRect();
        if (rect && y < rect.bottom && x > rect.left - nodeWidth) {
            x = rect.left - nodeWidth;
        }

        return { x: x, y: y };
    }

    /** Recursively calculates the positions of this node and all of its predecessors and stores them in {@link positions}. */
    private getPositionRec(node: SKNode): Point {
        if (!node) {
            return { x: 0, y: 0 };
        }

        const id = node.id.endsWith("-proxy") ? node.id : node.id + "-proxy";
        let point = this.positions.get(id);
        if (point) {
            // Point already stored
            return point;
        } else {
            console.log("Recalc: " + id);
            // Point hasn't been stored yet, check parent
            point = this.getPositionRec(node.parent as SKNode);
            const x = point.x + node.bounds.x;
            const y = point.y + node.bounds.y;
            point = { x: x, y: y };

            // Also store this point
            this.positions.set(id, point);
            return point;
        }
    }
}
