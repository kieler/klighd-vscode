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
import { ProxyViewClusteringEnabled, ProxyViewEnabled, ProxyViewFilterUnconnected, ProxyViewSize, RenderOptionsRegistry } from "../options/render-options-registry";
import { SKGraphModelRenderer } from "../skgraph-model-renderer";
import { SKEdge, SKNode } from "../skgraph-models";
import { SendProxyViewAction, ShowProxyViewAction, TransformAttributes } from "./proxy-view-actions";

@injectable()
export class ProxyView extends AbstractUIExtension {
    /** ID. */
    static readonly ID = "proxy-view";
    /** ID used for proxy rendering property of SKNodes. */
    static readonly PROXY_RENDERING_PROPERTY = "de.cau.cs.kieler.klighd.proxyRendering";
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
    /**
     * Stores the absolute coordinates (without scroll) of already rendered nodes.
     * Always make sure the ids ending with "-proxy" are used.
     */
    private positions: Map<string, Point>;
    /** Stores the proxy's current size. Used for clearing {@link renderings} if the size has changed. */
    private currSize: number;
    /** Whether the proxy-view is enabled. */
    private proxyViewEnabled: boolean;
    /** Part of calculating the proxies' size. */
    private sizePercentage: number;
    /** Whether clustering is enabled. */
    private clusteringEnabled: boolean;
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

    // !!! TODO: might be a useful addition to save absolute coords in SKNode, not my task but also required here

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

        //// Initial nodes ////
        const { offScreenNodes, onScreenNodes } = this.getOffAndOnScreenNodes(root, ctx);

        //// Apply filters ////
        const filteredOffScreenNodes = this.applyFilters(offScreenNodes, onScreenNodes);

        // Calculate size
        const size = Math.min(canvasWidth, canvasHeight) * this.sizePercentage * 0.08;
        if (size !== this.currSize) {
            // Size of proxies has changed, cannot reuse previous renderings
            this.clearRenderings();
        }
        this.currSize = size;

        //// Calculate transformations ////
        const transformedOffScreenNodes = filteredOffScreenNodes.map(node => ({
            node: node,
            transform: this.getTransform(node, size, canvasWidth, canvasHeight, scroll, zoom)
        }));

        //// Apply clustering ////
        const clusteredNodes = this.applyClustering(transformedOffScreenNodes);

        // Render the proxies
        const res = [];
        for (const { node, transform } of clusteredNodes) {
            // Create a proxy
            const vnode = this.createSingleProxy(node, transform, ctx);
            if (vnode) {
                res.push(vnode);
            }
        }

        // OLD: clustering
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

    /** Applies clustering to all `offScreenNodes`. TODO: */
    private applyClustering(offScreenNodes: { node: SKNode, transform: TransformAttributes }[]): { node: SKNode, transform: TransformAttributes }[] {
        if (!this.clusteringEnabled) {
            return offScreenNodes;
        }

        // Set containing groups of indices of overlapping proxies
        const overlapIndexGroups = new Set<Set<number>>();
        for (let i = 0; i < offScreenNodes.length; i++) {
            // New set for current overlap group
            const currOverlapIndexGroup = new Set<number>();
            let overlap = false;

            // TODO: skip if i already in overlapIndexGroups
            
            // Check next proxies for overlap
            for (let j = i + 1; j < offScreenNodes.length; j++) {
                if (this.checkOverlap(offScreenNodes[i].transform, offScreenNodes[j].transform)) {
                    // Proxies at i and j overlap
                    overlap = true;
                    currOverlapIndexGroup.add(j);

                }
            }

            if (overlap) {
                // This proxy overlaps
                currOverlapIndexGroup.add(i);
                overlapIndexGroups.add(currOverlapIndexGroup);
            }
        }

        const overlapIndices: number[] = [];
        const clusterProxies = [];
        for (const group of Array.from(overlapIndexGroups)) {
            // Add a cluster for each group
            // TODO: push a cluster rendering (VNode)
            clusterProxies.push(offScreenNodes[0]);
            // Also push this group's indices
            overlapIndices.push(...Array.from(group));
        }

        // Filter all overlapping nodes
        const res = offScreenNodes.filter((_, index) => !overlapIndices.includes(index));

        // Add the cluster proxies
        // res.push(...clusterProxies);

        return res;
    }

    /** Returns the proxy rendering for a single off-screen node and applies logic, e.g. the proxy's position. */
    private createSingleProxy(node: SKNode | VNode, transform: TransformAttributes, ctx: SKGraphModelRenderer): VNode | undefined {
        let transformString = `translate(${transform.x}, ${transform.y})`;
        if (transform.scale) {
            transformString += ` scale(${transform.scale})`;
        }

        if (!(node instanceof SKNode)) {
            // VNode, this is a predefined rendering
            if (node.data && node.data.attrs) {
                // Just changing the vnode's attribute is insufficient as it doesn't change the document's attribute while on the canvas
                // Update position once the canvas is left
                node.data.attrs["transform"] = transformString;
                // Update position while on the canvas
                document.getElementById(`keith-diagram_sprotty_${node.key?.toString()}`)?.setAttribute("transform", transformString);
            }
            return node;
        }

        // Get VNode
        const id = this.getProxyId(node.id);
        let vnode = this.renderings.get(id);
        if (vnode && vnode.data && vnode.data.attrs) {
            // Node has already been rendered, update position and return

            // Just changing the vnode's attribute is insufficient as it doesn't change the document's attribute while on the canvas
            // Update position once the canvas is left
            vnode.data.attrs["transform"] = transformString;
            // Update position while on the canvas
            document.getElementById(`keith-diagram_sprotty_${id}`)?.setAttribute("transform", transformString);
        } else {
            // This effectively clones the node
            const clone: SKNode = Object.create(node);
            // Change its id for good measure
            clone.id = id;
            // Clear children, proxies don't show nested nodes
            clone.children = [];
            // Update bounds
            clone.bounds = transform;

            // Check if synthesis has specified a proxy rendering
            if (node.properties && node.properties[ProxyView.PROXY_RENDERING_PROPERTY]) {
                // Proxy rendering available
                console.log("Rendering available"); // FIXME:
                clone.data = node.properties[ProxyView.PROXY_RENDERING_PROPERTY] as KGraphData[];
            } else {
                // Fallback, use mock
                // TODO: further specify what to change for the mock?
            }

            vnode = ctx.renderProxy(clone);
            if (vnode && vnode.data && vnode.data.attrs) {
                // Place proxy at the calculated position
                vnode.data.attrs["transform"] = transformString;

                // OLD: code to make a proxy non-click-through
                const clickThrough = true;
                if (!clickThrough) {
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

    //////// General helper methods ////////

    /** Appends "-proxy" to the given id if the given id isn't already a proxy's id. */
    private getProxyId(id: string): string {
        return id.endsWith("-proxy") ? id : id + "-proxy";
    }

    /** Returns whether the given `node` is valid for rendering. */
    private canRenderNode(node: SKNode, id?: string): boolean {
        if (!id) {
            id = this.getProxyId(node.id);
        }
        // Not an edge, not a comment/non-explicitly specified region
        // Don't just use includes("$$") since non-explicitly specified regions may contain nodes
        return node instanceof SKNode && id.charAt(id.lastIndexOf("$") - 1) !== "$";
    }

    /** Updates the proxy-view options specified in the {@link RenderOptionsRegistry}. */
    updateOptions(renderOptionsRegistry: RenderOptionsRegistry): void {
        this.proxyViewEnabled = renderOptionsRegistry.getValue(ProxyViewEnabled);
        this.sizePercentage = renderOptionsRegistry.getValue(ProxyViewSize);
        this.clusteringEnabled = renderOptionsRegistry.getValue(ProxyViewClusteringEnabled);
        this.filterUnconnected = renderOptionsRegistry.getValue(ProxyViewFilterUnconnected);
    }

    /** Clears the {@link renderings} map. */
    clearRenderings(): void {
        this.renderings.clear();
    }

    /** Clears the {@link positions} map. */
    clearPositions(): void {
        this.positions.clear();
    }

    /**
     * Calculates the TransformAttributes for this node's proxy, e.g. the position to place the proxy at aswell as its scale and bounds.
     * Note that the position is pre-scaling.
     */
    private getTransform(node: SKNode, desiredSize: number, canvasWidth: number, canvasHeight: number, scroll: Point, zoom: number): TransformAttributes {
        // OLD: without resizing the proxy
        // const offsetX = 0.5 * bounds.width * (zoom - 1);
        // const offsetY = 0.5 * bounds.height * (zoom - 1);

        // OLD: size dependant on node's bounds
        // const proxyWidth = size * 0.001;
        // const proxySizeScale = Math.min(proxyHeightScale, proxyWidthScale);
        // console.log(proxySizeScale);

        // TODO: cap node to parent bounds

        const pos = this.getPosition(node);
        const bounds = node.bounds;

        // Calculate the scale and the resulting proxy dimensions
        // The scale is calculated such that width & height are capped to a max value
        const proxyWidthScale = desiredSize / bounds.width;
        const proxyHeightScale = desiredSize / bounds.height;
        const scale = Math.min(proxyWidthScale, proxyHeightScale);
        const proxyWidth = bounds.width * scale;
        const proxyHeight = bounds.height * scale;

        // Center at middle of node
        const offsetX = 0.5 * (node.bounds.width * zoom - proxyWidth);
        const offsetY = 0.5 * (node.bounds.height * zoom - proxyHeight);
        let x = (pos.x - scroll.x) * zoom + offsetX;
        let y = (pos.y - scroll.y) * zoom + offsetY;

        // Cap proxy at canvas border
        x = Math.max(0, Math.min(canvasWidth - proxyWidth, x));
        y = Math.max(0, Math.min(canvasHeight - proxyHeight, y));

        // Make sure the proxies aren't rendered behind the sidebar buttons at the top right
        /* Don't need to check for the opened sidebar since it closes as soon as the diagram is moved
          (onMouseDown), e.g. don't reposition proxies accordingly */
        const rect = document.querySelector('.sidebar__toggle-container')?.getBoundingClientRect();
        if (rect && y < rect.bottom && x > rect.left - proxyWidth) {
            x = rect.left - proxyWidth;
        }

        // OLD: Scale the coordinates (to get position post-scaling)
        // x /= scale;
        // y /= scale;

        return { x: x, y: y, scale: scale, width: proxyWidth, height: proxyHeight };
    }

    /** Recursively calculates the positions of this node and all of its predecessors and stores them in {@link positions}. */
    private getPosition(node: SKNode): Point {
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
            point = this.getPosition(node.parent as SKNode);
            const x = point.x + node.bounds.x;
            const y = point.y + node.bounds.y;
            point = { x: x, y: y };

            // Also store this point
            this.positions.set(id, point);
            return point;
        }
    }

    /**
     * Checks if the given bounds overlap.
     * 
     * @returns `true` if there is overlap.
     */
    private checkOverlap(bounds1: TransformAttributes, bounds2: TransformAttributes): boolean {
        // TODO: could add an overlap percentage?
        const left1 = bounds1.x;
        const right1 = left1 + bounds1.width;
        const top1 = bounds1.y;
        const bottom1 = top1 + bounds1.height;
        const left2 = bounds2.x;
        const right2 = left2 + bounds2.width;
        const top2 = bounds2.y;
        const bottom2 = top2 + bounds2.height;

        // 1 in 2
        const horizontalOverlap1 = left1 >= left2 && left1 <= right2 || right1 >= left2 && right1 <= right2;
        const verticalOverlap1 = bottom1 >= top2 && bottom1 <= bottom2 || top1 >= top2 && top1 <= bottom2;
        // 2 in 1
        const horizontalOverlap2 = left2 >= left1 && left2 <= right1 || right2 >= left1 && right2 <= right1;
        const verticalOverlap2 = bottom2 >= top1 && bottom2 <= bottom1 || top2 >= top1 && top2 <= bottom1;

        return horizontalOverlap1 && verticalOverlap1 || horizontalOverlap2 && verticalOverlap2;
    }

    //////// Filter methods ////////

    /** Returns all `offScreenNodes` matching the enabled filters. */
    private applyFilters(offScreenNodes: SKNode[], onScreenNodes: SKNode[]): SKNode[] {
        return offScreenNodes.filter(node =>
            this.canRenderNode(node) &&
            (!this.filterUnconnected || this.isConnected(node, onScreenNodes)));
    }

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
