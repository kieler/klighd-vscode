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
import { KGraphData } from "@kieler/klighd-interactive/lib/constraint-classes";
import { inject, injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom";
import { AbstractUIExtension, html, IActionDispatcher, Patcher, PatcherProvider, SGraph, SModelRoot, TYPES } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Point } from "sprotty-protocol";
import { DepthMap } from "../depth-map";
import { ProxyViewEnabled, ProxyViewFilterUnconnected, ProxyViewSize, RenderOptionsRegistry } from "../options/render-options-registry";
import { SKGraphModelRenderer } from "../skgraph-model-renderer";
import { SKEdge, SKNode } from "../skgraph-models";
import { SendProxyViewAction, ShowProxyViewAction } from "./proxy-view-actions";

@injectable()
export class ProxyView extends AbstractUIExtension {
    /** ID. */
    static readonly ID = "proxy-view";
    /** ID used for proxy rendering property of SKNodes. */
    static readonly proxyRenderingId = "de.cau.cs.kieler.klighd.proxyRendering";
    /** ActionDispatcher mainly needed for init(). */
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    /** Used to replace HTML elements. */
    @inject(TYPES.PatcherProvider) patcherProvider: PatcherProvider;
    private patcher: Patcher;
    /** VNode of the current HTML root element. Used by the {@link patcher}. */
    private currHTMLRoot: VNode;
    /**
     * Stores the proxy renderings of already rendered nodes.
     * Always make sure the ids ending with "-proxy" are used.
     */
    private renderings: Map<string, VNode>;
    /** Stores the proxy's current size. Used for clearing {@link renderings} if the size has changed. */
    private currSize: number;
    /**
     * Stores the relative coordinates (without scroll) of already rendered nodes.
     * Always make sure the ids ending with "-proxy" are used.
     */
    private positions: Map<string, Point>;
    /** Whether the Proxy-View is enabled. */
    private proxyViewEnabled: boolean;
    /** Part of calculating the proxies' size. */
    private sizePercentage: number;
    /** Whether proxies should be filtered by removing unconnected nodes. */
    private filterUnconnected: boolean;

    id(): string {
        return ProxyView.ID;
    }

    containerClass(): string {
        return ProxyView.ID;
    }

    @postConstruct()
    init(): void {
        // Send and show proxy-view
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

    //////// Main methods ////////

    /** Updates the proxy-view. */
    update(model: SGraph, ctx: SKGraphModelRenderer): void {
        /* Notes:
        - edges are handled like this: children=[SKNode, SKNode, SKEdge] -> edge between the nodes
        */
        /* TODO: define proxy rendering in synthesis as attribute of KNode -> when writing a new synthesis
        no client-side changes need to be made (diagram specifics are server-side only) */

        if (!this.proxyViewEnabled) {
            this.currHTMLRoot = this.patcher(this.currHTMLRoot, <div />);
            return;
        } else if (!this.currHTMLRoot) {
            return;
        } else if (!ctx.depthMap) {
            // Create a new depthmap if otherwise unused
            ctx.depthMap = DepthMap.init(model);
        }

        const canvasWidth = model.canvasBounds.width;
        const canvasHeight = model.canvasBounds.height;
        const scroll = model.scroll;
        const zoom = model.zoom;
        const root = model.children[0] as SKNode;
        this.currHTMLRoot = this.patcher(this.currHTMLRoot,
            <svg style={
                {
                    width: canvasWidth.toString(), height: canvasHeight.toString(), // Set size to whole canvas
                    pointerEvents: "none" // Make click-through
                }
            }>
                {...this.createAllProxies(root, ctx, canvasWidth, canvasHeight, scroll, zoom)}
            </svg>);
    }

    /** Returns the proxy rendering for all of currRoot's off-screen children and applies logic, e.g. clustering. */
    private createAllProxies(root: SKNode, ctx: SKGraphModelRenderer, canvasWidth: number, canvasHeight: number, scroll: Point, zoom: number): VNode[] {
        // Iterate through nodes starting by root
        // check if node is: 
        // (partially) in bounds -> no proxy, check children
        // out of bounds         -> proxy

        const depthMap = ctx.depthMap;
        const viewport = ctx.viewport;
        if (!depthMap || !viewport) {
            // Not yet initialized
            return [];
        }

        // Used for filters
        const { offScreenNodes, onScreenNodes } = this.getOffAndOnScreenNodes(root, ctx);

        const res = [];
        for (const node of offScreenNodes) {
            if (!this.filterUnconnected || this.isConnected(node, onScreenNodes)) {
                // Create a proxy
                const vnode = this.createSingleProxy(node, ctx, canvasWidth, canvasHeight, scroll, zoom);
                if (vnode) {
                    // TODO: check for overlap here? For clustering
                    res.push(vnode);
                }
            }
        }

        // ctx.renderOptionsRegistry.

        // TODO: clustering
        // for (let i = 0; i < res.length; i++) {
        //     // Check if the current node overlaps with any of the following
        //     const node1 = res[i];
        //     for (let j = i + 1; j < res.length; j++) {
        //         const node2 = res[j];
        //         const verticalOverlap = node1.
        //     }
        // }

        return res;
    }

    /** Returns an object containing lists of all off-screen and on-screen nodes in `currRoot`.
     * Note that an off-screen node's children aren't included in the list, e.g. only outer-most off-screen nodes are returned. */
    private getOffAndOnScreenNodes(currRoot: SKNode, ctx: SKGraphModelRenderer): { offScreenNodes: SKNode[], onScreenNodes: SKNode[] } {
        const depthMap = ctx.depthMap;
        const viewport = ctx.viewport;
        if (!depthMap || !viewport) {
            // Not yet initialized
            return { offScreenNodes: [], onScreenNodes: [] };
        }

        // For each node check if it's off-screen
        const offScreenNodes = [];
        const onScreenNodes = [];
        for (const node of currRoot.children as SKNode[]) {
            const region = depthMap.getProvidingRegion(node, viewport, ctx.renderOptionsRegistry);
            if (region && !depthMap.isInBounds(region, viewport)) {
                // Node out of bounds
                offScreenNodes.push(node);
            } else {
                // Node in bounds
                onScreenNodes.push(node);

                if (node.children.length > 0) {
                    // Has children, recursively check them
                    const offAndOnScreenNodes = this.getOffAndOnScreenNodes(node, ctx);
                    offScreenNodes.push(...offAndOnScreenNodes.offScreenNodes);
                    onScreenNodes.push(...offAndOnScreenNodes.onScreenNodes);
                }
            }
        }

        return { offScreenNodes: offScreenNodes, onScreenNodes: onScreenNodes };
    }

    /** Returns the proxy rendering for a single off-screen node and applies logic, e.g. where the proxy is placed place. */
    private createSingleProxy(node: SKNode, ctx: SKGraphModelRenderer, canvasWidth: number, canvasHeight: number, scroll: Point, zoom: number): VNode | undefined {
        // Get position and calculate size
        const size = Math.min(canvasWidth, canvasHeight) * this.sizePercentage;
        const proxyHeight = size / node.bounds.width * 0.08 // TODO:
        const proxyWidth = size / node.bounds.width * 0.08; // All have same width (capped)
        // const proxyWidth = size * 0.001; // Size dependant on node's bounds
        const proxySize = Math.min(proxyHeight, proxyWidth);
        console.log(proxySize);

        const pos = this.getPosition(node, canvasWidth, canvasHeight, scroll, zoom);

        if (size !== this.currSize) {
            // Size of proxies has changed, cannot reuse previous renderings
            this.clearRenderings();
        }
        this.currSize = size;

        const transformString = `scale(${proxySize}) translate(${pos.x}, ${pos.y})`;
        const id = this.getProxyId(node.id);
        let vnode = this.renderings.get(id);
        if (vnode && vnode.data && vnode.data.attrs) {
            // Node has already been rendered, update position and return

            // Just changing the vnode's attribute is insufficient as it doesn't change the document's attribute while on the canvas
            // Update position once the canvas is left
            vnode.data.attrs["transform"] = transformString;
            // Update position while on the canvas
            document.getElementById(`keith-diagram_sprotty_${id}`)?.setAttribute("transform", transformString);
        } else if (node instanceof SKNode && id.charAt(id.lastIndexOf("$") - 1) !== "$") {
            // Not an edge, not a comment/non-explicitly specified region
            // Don't just use includes("$$") since non-explicitly specified regions may contain nodes

            // This effectively clones the node
            const clone: SKNode = Object.create(node);
            // Change its id for good measure
            clone.id = id;
            // Clear children, proxies don't show nested nodes
            clone.children = [];

            // console.log("node");
            // console.log(node);
            // console.log("clone");
            // console.log(clone);
            // Specification of rendering data depends on if the synthesis has specified it
            if (node.properties && node.properties[ProxyView.proxyRenderingId]) {
                // Proxy rendering available
                clone.data = node.properties[ProxyView.proxyRenderingId] as KGraphData[];
            } else {
                // Fallback, use mock
                // TODO: further specify what to change for the mock?
            }

            vnode = ctx.renderProxy(clone);
            if (vnode && vnode.data && vnode.data.attrs) {
                // Place proxy at the calculated position
                vnode.data.attrs["transform"] = transformString;

                const clickThrough = true; // TODO: could be configured in options
                if (!clickThrough) {
                    // Make proxies non-click-through
                    vnode.data.attrs["style"] = "pointer-events: auto; " + (vnode.data.attrs["style"] ?? "");
                }
            }
        }

        if (vnode) {
            // Store this node
            this.renderings.set(id, vnode);
        }

        return vnode;
    }

    /** Updates the options specified in the {@link RenderOptionsRegistry}. */
    updateOptions(renderOptionsRegistry: RenderOptionsRegistry): void {
        this.proxyViewEnabled = renderOptionsRegistry.getValue(ProxyViewEnabled);
        this.sizePercentage = renderOptionsRegistry.getValue(ProxyViewSize);
        this.filterUnconnected = renderOptionsRegistry.getValue(ProxyViewFilterUnconnected);
    }

    //////// General helper methods ////////

    /** Appends "-proxy" to the given id if the given id isn't already a proxy's id. */
    private getProxyId(id: string): string {
        return id.endsWith("-proxy") ? id : id + "-proxy";
    }

    /** Clears the {@link renderings} map. */
    clearRenderings(): void {
        this.renderings.clear();
    }

    /** Calculates the position to place this node's proxy at. */
    private getPosition(node: SKNode, canvasWidth: number, canvasHeight: number, scroll: Point, zoom: number): Point {
        // !!! TODO: might be a useful addition to save absolute coords in SKNode, not my task but also required here

        // OLD: if the proxy should be resized, replace bounds.width/height with size
        // const offsetX = 0.5 * (node.bounds.width * zoom - size);
        // const offsetY = 0.5 * (node.bounds.height * zoom - size);

        const point = this.getPositionRec(node);
        const bounds = node.bounds;
        const offsetX = 0.5 * bounds.width * (zoom - 1);
        const offsetY = 0.5 * bounds.height * (zoom - 1);
        let x = (point.x - scroll.x) * zoom + offsetX;
        let y = (point.y - scroll.y) * zoom + offsetY;

        // Calculate position to put the proxy at
        x = Math.max(0, Math.min(canvasWidth - bounds.width, x));
        y = Math.max(0, Math.min(canvasHeight - bounds.height, y));

        // Make sure the proxies aren't rendered behind the sidebar buttons at the top right
        /* Don't need to check for the opened sidebar since it closes as soon as the diagram is moved
          (onMouseDown), e.g. don't reposition proxies accordingly */
        const rect = document.querySelector('.sidebar__toggle-container')?.getBoundingClientRect();
        if (rect && y < rect.bottom && x > rect.left - bounds.width) {
            x = rect.left - bounds.width;
        }

        return { x: x, y: y };
    }

    /** Recursively calculates the positions of this node and all of its predecessors and stores them in {@link positions}. */
    private getPositionRec(node: SKNode): Point {
        if (!node) {
            return { x: 0, y: 0 };
        }

        // This node might not be a proxy, make sure to store the right id
        const id = this.getProxyId(node.id);
        let point = this.positions.get(id);
        if (point) {
            // Point already stored
            return point;
        } else {
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

    //////// Filter methods ////////

    /** Checks if `currNode` is connected to at least one of the other given `nodes`. */
    private isConnected(currNode: SKNode, nodes: SKNode[]): boolean {
        return (
            (currNode.outgoingEdges as SKEdge[])
                .map(edge => edge.target as SKNode)
                .some(target => nodes.includes(target))
            ||
            (currNode.incomingEdges as SKEdge[])
                .map(edge => edge.source as SKNode)
                .some(source => nodes.includes(source))
        );
    }

    /* OLD: previously used by createAllProxies() for rendering proxies
    // Get proxy renderings
    const res: VNode[] = [];
    for (const node of currRoot.children as SKNode[]) {
        const region = depthMap.getProvidingRegion(node, viewport, ctx.renderOptionsRegistry);
        if (region && !depthMap.isInBounds(region, viewport)) {
            // Node out of bounds
            offScreenNodes.push(node);

            // Create a proxy
            const vnode = this.createSingleProxy(node, ctx, canvasWidth, canvasHeight, scroll, zoom);
            if (vnode) {
                res.push(vnode);
            }
        } else {
            // Node in bounds
            onScreenNodes.push(node);

            if (node.children.length > 0) {
                // Has children, recursively check them
                res.push(...this.createAllProxies(node, ctx, canvasWidth, canvasHeight, scroll, zoom));
            }
        }
    }
    */

    /** Returns a copy of the data fit to the given size. */
    /* OLD: previously used for resizing proxies
    private fitToSize(data: KGraphData[], size: number): KGraphData[] {
        if (!data) {
            return [];
        }

        const res = [];
        for (const temp of data) {
            // TODO check type and act accordingly
            const clone = Object.create(temp);
            const prop = Object.create(clone.properties);
            if (prop) {
                const calcBounds = prop["klighd.lsp.calculated.bounds"];
                const renderingId = prop["klighd.lsp.rendering.id"];
                if (calcBounds && renderingId) {
                    prop["klighd.lsp.calculated.bounds"] = { x: calcBounds.x, y: calcBounds.y, width: size, height: size };
                    prop["klighd.lsp.rendering.id"] = this.getProxyId(renderingId);
                    clone.children = this.fitToSize(clone.children, size);

                    res.push(clone);
                }
            }
        }
        return res;
    }
    */
}
