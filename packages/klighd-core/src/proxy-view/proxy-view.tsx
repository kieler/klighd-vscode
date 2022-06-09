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
import { Bounds, CenterAction, Point } from "sprotty-protocol";
import { isDetailWithChildren } from "../depth-map";
import { RenderOptionsRegistry } from "../options/render-options-registry";
import { SKGraphModelRenderer } from "../skgraph-model-renderer";
import { K_POLYGON, SKEdge, SKLabel, SKNode, SKPort } from "../skgraph-models";
import { getKRendering } from "../views-rendering";
import { SendProxyViewAction, ShowProxyViewAction } from "./proxy-view-actions";
import { getClusterRendering } from "./proxy-view-cluster";
import { ProxyViewCapProxyToParent, ProxyViewCapScaleToOne, ProxyViewClusteringCascading, ProxyViewClusteringEnabled, ProxyViewClusteringSweepLine, ProxyViewClusterTransparent, ProxyViewActionsEnabled, ProxyViewEnabled, ProxyViewFilterDistant, ProxyViewFilterUnconnected, ProxyViewFilterUnconnectedToSelected, ProxyViewHighlightSelected, ProxyViewOpacityByDistance, ProxyViewOpacityBySelected, ProxyViewSize, ProxyViewStackingOrderByDistance, ProxyViewUsePositionsCache, ProxyViewUseSynthesisProxyRendering, ProxyViewDrawStraightEdges, ProxyViewUseDetailLevel } from "./proxy-view-options";
import { anyContains, CanvasAttributes, capToCanvas, checkOverlap, getDistanceToCanvas, getTranslatedBounds, isConnectedToAny, isInBounds, isIncomingToAny, isOutgoingToAny, joinTransitiveGroups, ProxyVNode, SelectedElementsUtil, TransformAttributes, updateClickThrough, updateOpacity, updateTransform } from "./proxy-view-util";

/** A UIExtension which adds a proxy-view to the Sprotty container. */
@injectable()
export class ProxyView extends AbstractUIExtension {
    /** ID. */
    static readonly ID = "proxy-view";
    /** ID used for proxy rendering property of SKNodes. */
    static readonly PROXY_RENDERING_PROPERTY = "de.cau.cs.kieler.klighd.proxyRendering";
    /** ID used to indicate whether an SKNode should be rendered as a proxy. */
    static readonly RENDER_NODE_AS_PROXY_PROPERTY = "de.cau.cs.kieler.klighd.renderNodeAsProxy";
    /** Number indicating at what distance a node is close. */
    static readonly DISTANCE_CLOSE = 300;
    /** Number indicating at what distance a node is distant. */
    static readonly DISTANCE_DISTANT = 700;
    /** Suffix of a proxy's ID. */
    static readonly PROXY_SUFFIX = "-proxy";
    /** ActionDispatcher mainly needed for init(). */
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    /** Provides the utensil to replace HTML elements. */
    @inject(TYPES.PatcherProvider) private patcherProvider: PatcherProvider;
    /** Used to replace HTML elements. */
    private patcher: Patcher;
    /** VNode of the current HTML root element. Used by the {@link patcher}. */
    private currHTMLRoot: VNode;
    /** The currently rendered proxies. */
    private currProxies: { proxy: VNode, transform: TransformAttributes }[];
    /** Whether the proxies should be click-through. */
    private clickThrough: boolean;

    //// Caches ////
    /**
     * Stores the proxy renderings of already rendered nodes.
     * Always make sure the ids ending with "-proxy" are used.
     */
    private renderings: Map<string, ProxyVNode>;
    /**
     * Stores the absolute coordinates (without scroll and zoom) of already rendered nodes.
     * Always make sure the ids ending with "-proxy" are used.
     */
    private positions: Map<string, Point>;
    /**
     * Stores the distances of nodes to the canvas.
     * Always make sure the ids ending with "-proxy" are used.
     */
    private distances: Map<string, number>;

    //// Sidebar options ////
    /** @see {@link ProxyViewEnabled} */
    private proxyViewEnabled: boolean;
    /** Whether the proxy view was previously enabled. Used to avoid excessive patching. */
    private prevProxyViewEnabled: boolean;
    /** @see {@link ProxyViewSize} */
    private sizePercentage: number;
    /** @see {@link ProxyViewClusteringEnabled} */
    private clusteringEnabled: boolean;
    /** @see {@link ProxyViewOpacityByDistance} */
    private opacityByDistance: boolean;
    /** @see {@link ProxyViewActionsEnabled} */
    private actionsEnabled: boolean;
    /** @see {@link ProxyViewDrawStraightEdges} */
    private drawStraightEdges: boolean;
    /** @see {@link ProxyViewCapProxyToParent} */
    private capProxyToParent: boolean;
    /** @see {@link ProxyViewFilterUnconnected} */
    private filterUnconnected: boolean;
    /** @see {@link ProxyViewFilterUnconnectedToSelected} */
    private filterUnconnectedToSelected: boolean;
    /** @see {@link ProxyViewFilterDistant} */
    private filterDistant: string;

    //// Sidebar debug options ////
    /** 
     * Note that clusters are never highlighted, as highlighting is synthesis-specific while cluster renderings are not.
     * @see {@link ProxyViewHighlightSelected}
     */
    private highlightSelected: boolean;
    /** @see {@link ProxyViewOpacityBySelected} */
    private opacityBySelected: boolean;
    /** @see {@link ProxyViewUseSynthesisProxyRendering} */
    private useSynthesisProxyRendering: boolean;
    /** @see {@link ProxyViewStackingOrderByDistance} */
    private stackingOrderByDistance: boolean;
    /** @see {@link ProxyViewUseDetailLevel} */
    private useDetailLevel: boolean;
    /** @see {@link ProxyViewCapScaleToOne} */
    private capScaleToOne: boolean;
    /** @see {@link ProxyViewClusterTransparent} */
    private clusterTransparent: boolean;
    /** @see {@link ProxyViewClusteringCascading} */
    private clusteringCascading: boolean;
    /** @see {@link ProxyViewClusteringSweepLine} */
    private clusteringSweepLine: boolean;
    /** @see {@link ProxyViewUsePositionsCache} */
    private usePositionsCache: boolean;

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
        // Initialize caches
        this.renderings = new Map;
        this.positions = new Map;
        this.distances = new Map;
        this.currProxies = [];
    }

    protected initializeContents(containerElement: HTMLElement): void {
        // Use temp for initializing currHTMLRoot
        const temp = document.createElement("div");
        this.currHTMLRoot = this.patcher(temp, <div />);
        containerElement.appendChild(temp);
    }

    protected onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRoot>, ...contextElementIds: string[]): void {
        // TODO: could be useful?
    }

    //////// Main methods ////////

    // !!! TODO: might be a useful addition to save absolute coords in SKNode, not my task but also required here
    // TODO: performance in developer options for measuring performance
    // TODO: API for filters

    /**
     * Update step of the proxy-view. Handles everything proxy-view related.
     * @param model The current SGraph.
     * @param ctx The rendering context.
     */
    update(model: SGraph, ctx: SKGraphModelRenderer): void {
        if (!this.proxyViewEnabled) {
            if (this.prevProxyViewEnabled) {
                // Prevent excessive patching, only patch if disabled just now
                this.currHTMLRoot = this.patcher(this.currHTMLRoot, <div />);
                this.prevProxyViewEnabled = this.proxyViewEnabled;
            }
            return;
        } else if (!this.currHTMLRoot) {
            return;
        }


        const canvasWidth = model.canvasBounds.width;
        const canvasHeight = model.canvasBounds.height;
        const viewport = ctx.viewport;
        const canvas = { ...model.canvasBounds, scroll: viewport.scroll, zoom: viewport.zoom };
        const root = model.children[0] as SKNode;
        // Actually update the document
        this.currHTMLRoot = this.patcher(this.currHTMLRoot,
            <svg style={
                {
                    width: canvasWidth.toString(), height: canvasHeight.toString(), // Set size to whole canvas
                    pointerEvents: "none" // Make click-through
                }
            }>
                {...this.createAllProxies(root, ctx, canvas)}
            </svg>);
    }

    /** Returns the proxy rendering for all of currRoot's off-screen children and applies logic, e.g. clustering. */
    private createAllProxies(root: SKNode, ctx: SKGraphModelRenderer, canvas: CanvasAttributes): VNode[] {
        // Iterate through nodes starting by root, check if node is: 
        // (partially) in bounds -> no proxy, check children
        // out of bounds         -> proxy

        //// Initial nodes ////
        const { offScreenNodes, onScreenNodes } = this.getOffAndOnScreenNodes(root, canvas, ctx);

        //// Apply filters ////
        const filteredOffScreenNodes = this.applyFilters(offScreenNodes, // The nodes to filter
            onScreenNodes, canvas); // Additional arguments for filters

        //// Clone nodes ////
        const clonedNodes = this.cloneNodes(filteredOffScreenNodes);

        //// Stacking order ////
        const distanceOrderedOffScreenNodes = this.orderByDistance(clonedNodes, canvas);

        //// Opacity ////
        const opacityOffScreenNodes = this.calculateOpacity(distanceOrderedOffScreenNodes, canvas);

        //// Use proxy-rendering as specified by synthesis ////
        const synthesisRenderedOffScreenNodes = this.getSynthesisProxyRendering(opacityOffScreenNodes, ctx);

        //// Calculate transformations ////
        const size = Math.min(canvas.width, canvas.height) * this.sizePercentage;
        const transformedOffScreenNodes = synthesisRenderedOffScreenNodes.map(({ node, proxyBounds }) => ({
            node,
            transform: this.getTransform(node, size, proxyBounds, canvas)
        }));

        //// Apply clustering ////
        const clusteredNodes = this.applyClustering(transformedOffScreenNodes, size, canvas);

        //// Create edges ////
        const edges = this.routeEdges(clusteredNodes, onScreenNodes, canvas, ctx);

        //// Render the proxies ////
        const proxies = [];
        this.currProxies = [];

        // Start with edges since they should never appear in front of nodes
        for (const edge of edges) {
            // Create an edge proxy
            const edgeProxy = this.createEdgeProxy(edge, ctx);
            if (edgeProxy) {
                proxies.push(edgeProxy);
            }
        }

        // Nodes
        for (const { node, transform } of clusteredNodes) {
            // Create a proxy
            const proxy = this.createProxy(node, transform, ctx);
            if (proxy) {
                proxies.push(proxy);
                this.currProxies.push({ proxy, transform });
            }
        }

        // Clear caches for the next model
        this.clearPositions();
        this.clearDistances();

        return proxies;
    }

    /**
     * Returns an object containing lists of all off-screen and on-screen nodes in `currRoot`.
     * Note that an off-screen node's children aren't included in the list, e.g. only outer-most off-screen nodes are returned.
     */
    private getOffAndOnScreenNodes(currRoot: SKNode, canvas: CanvasAttributes, ctx: SKGraphModelRenderer): { offScreenNodes: SKNode[], onScreenNodes: SKNode[] } {
        // For each node check if it's off-screen
        const offScreenNodes = [];
        const onScreenNodes = [];
        for (const node of currRoot.children) {
            if (node instanceof SKNode) {
                const translated = this.getTranslatedNodeBounds(node, canvas);

                if (!isInBounds(translated, canvas)) {
                    // Node out of bounds
                    offScreenNodes.push(node);
                } else {
                    // Node in bounds
                    onScreenNodes.push(node);

                    if (node.children.length > 0) {
                        const region = ctx.depthMap?.getProvidingRegion(node, ctx.viewport, ctx.renderOptionsRegistry);

                        if (!(this.useDetailLevel && region?.detail) || isDetailWithChildren(region.detail)) {
                            // Has children, recursively check them
                            const childRes = this.getOffAndOnScreenNodes(node, canvas, ctx);
                            offScreenNodes.push(...childRes.offScreenNodes);
                            onScreenNodes.push(...childRes.onScreenNodes);
                        }
                    }
                }
            }
        }

        return { offScreenNodes, onScreenNodes };
    }

    /** Performs a shallow copy of the nodes so that the original nodes aren't mutated. */
    private cloneNodes(offScreenNodes: SKNode[]): SKNode[] {
        return offScreenNodes.map(node => Object.create(node));
    }

    /**
     * Orders `offScreenNodes` by distance to the canvas,
     * such that closer nodes appear at the end - therefore being rendered above distant nodes.
     */
    private orderByDistance(offScreenNodes: SKNode[], canvas: CanvasAttributes): SKNode[] {
        const res = [...offScreenNodes];
        if (this.stackingOrderByDistance && !this.clusteringEnabled) {
            // Makes no sense to order when clustering is enabled since proxies cannot be stacked
            res.sort((n1, n2) => this.getNodeDistanceToCanvas(n2, canvas) - this.getNodeDistanceToCanvas(n1, canvas));
        }
        return res;
    }

    /** Calculates the opacities of `offScreenNodes`. */
    private calculateOpacity(offScreenNodes: SKNode[], canvas: CanvasAttributes): SKNode[] {
        const res = offScreenNodes;
        if (this.opacityByDistance) {
            for (const node of res) {
                node.opacity = Math.max(0, node.opacity - this.getNodeDistanceToCanvas(node, canvas) / ProxyView.DISTANCE_DISTANT);
            }
        }

        if (this.opacityBySelected && SelectedElementsUtil.areNodesSelected()) {
            // Only change opacity if there are selected nodes
            for (const node of res) {
                if (this.isSelectedOrConnectedToSelected(node)) {
                    // If selected itself or connected to a selected node, this node should be opaque
                    node.opacity = 1;
                } else {
                    // Node not relevant to current selection context, decrease opacity
                    node.opacity = Math.max(0, node.opacity - 0.5);
                }
            }
        }
        return res;
    }

    /** Returns the nodes updated to use the rendering specified by the synthesis. */
    private getSynthesisProxyRendering(offScreenNodes: SKNode[], ctx: SKGraphModelRenderer): { node: SKNode, proxyBounds: Bounds }[] {
        const res = [];
        for (const node of offScreenNodes) {
            // Fallback, if property undefined use universal proxy rendering for this node
            let proxyBounds = node.bounds;

            if (this.useSynthesisProxyRendering && node.properties && node.properties[ProxyView.PROXY_RENDERING_PROPERTY]) {
                const data = node.properties[ProxyView.PROXY_RENDERING_PROPERTY] as KGraphData[];
                const kRendering = getKRendering(data, ctx);

                if (kRendering && kRendering.properties["klighd.lsp.calculated.bounds"]) {
                    // Proxy rendering available, update data
                    node.data = data;
                    // Also update the bounds
                    proxyBounds = kRendering.properties["klighd.lsp.calculated.bounds"] as Bounds;
                }
            }
            res.push({ node, proxyBounds });
        }
        return res;
    }

    /** Applies clustering to all `offScreenNodes` until there's no more overlap. Cluster-proxies are returned as VNodes. */
    private applyClustering(offScreenNodes: { node: SKNode, transform: TransformAttributes }[],
        size: number, canvas: CanvasAttributes): { node: SKNode | VNode, transform: TransformAttributes }[] {
        if (!this.clusteringEnabled) {
            return offScreenNodes;
        }

        // List containing groups of indices of overlapping proxies
        // Could use a set of sets here, not needed since the same group cannot appear twice
        let overlapIndexGroups: number[][] = [[]];
        let res: { node: SKNode | VNode, transform: TransformAttributes }[] = offScreenNodes;

        // Make sure each cluster id is unique
        let clusterIDOffset = 0;
        while (overlapIndexGroups.length > 0) {
            overlapIndexGroups = [];

            if (this.clusteringSweepLine) {
                // Sort res primarily by leftmost x value, secondarily by uppermost y value, i.e.
                // res[0] has leftmost proxy (and of all leftmost proxies it's the uppermost one)
                res = res.sort(
                    ({ transform: transform1 }, { transform: transform2 }) => {
                        let res = transform1.x - transform2.x;
                        if (res == 0) {
                            res = transform1.y - transform2.y;
                        }
                        return res;
                    });

                for (let i = 0; i < res.length; i++) {
                    if (!this.clusteringCascading && anyContains(overlapIndexGroups, i)) {
                        // i already in an overlapIndexGroup, prevent redundant clustering
                        continue;
                    }

                    // New list for current overlap group
                    const currOverlapIndexGroup = [];

                    // Check proxies to the left of the current one's right border for overlap
                    const transform1 = res[i].transform;
                    const right = transform1.x + transform1.width;
                    const bottom = transform1.y + transform1.height;
                    for (let j = 0; j < res.length; j++) {
                        if (i == j || anyContains(overlapIndexGroups, j)) {
                            // Every proxy overlaps with itself or
                            // j already in an overlapIndexGroup, prevent redundant clustering
                            continue;
                        }

                        const transform2 = res[j].transform;
                        if (transform2.x > right) {
                            // Too far right, no need to check
                            break;
                        } else if (transform2.x == right && transform2.y > bottom) {
                            // Too far down, no need to check
                            break;
                        } else if (checkOverlap(transform1, transform2)) {
                            // Proxies at i and j overlap
                            currOverlapIndexGroup.push(j);
                        }
                    }

                    if (currOverlapIndexGroup.length > 0) {
                        // This proxy overlaps
                        currOverlapIndexGroup.push(i);
                        overlapIndexGroups.push(currOverlapIndexGroup);
                    }
                }
            } else {
                for (let i = 0; i < res.length; i++) {
                    if (!this.clusteringCascading && anyContains(overlapIndexGroups, i)) {
                        // i already in an overlapIndexGroup, prevent redundant clustering
                        continue;
                    }

                    // New list for current overlap group
                    const currOverlapIndexGroup = [];

                    // Check next proxies for overlap
                    for (let j = i + 1; j < res.length; j++) {
                        if (checkOverlap(res[i].transform, res[j].transform)) {
                            // Proxies at i and j overlap
                            currOverlapIndexGroup.push(j);
                        }
                    }

                    if (currOverlapIndexGroup.length > 0) {
                        // This proxy overlaps
                        currOverlapIndexGroup.push(i);
                        overlapIndexGroups.push(currOverlapIndexGroup);
                    }
                }
            }

            if (overlapIndexGroups.length <= 0) {
                // No more overlap, clustering is done
                break;
            }

            if (this.clusteringCascading) {
                // Join groups containing at least 1 same index
                overlapIndexGroups = joinTransitiveGroups(overlapIndexGroups);
            }

            // Add cluster proxies
            for (let i = 0; i < overlapIndexGroups.length; i++) {
                // Add a cluster for each group
                const group = overlapIndexGroups[i];
                // Get all nodes of the current group
                const currGroupNodes = res.filter((_, index) => group.includes(index));

                // Calculate position to put cluster proxy at, e.g. average of this group's positions
                let numProxiesInCluster = 0;
                let x = 0;
                let y = 0;
                let opacity = 1;
                for (const { node, transform } of currGroupNodes) {
                    // Weigh coordinates by the number of proxies in the current proxy (which might be a cluster)
                    const numProxiesInCurr = (transform as any).numProxies ?? 1;

                    numProxiesInCluster += numProxiesInCurr;
                    x += transform.x * numProxiesInCurr;
                    y += transform.y * numProxiesInCurr;
                    if (this.clusterTransparent) {
                        opacity += ((node as any).opacity ?? 1) * numProxiesInCurr;
                    }
                }
                x /= numProxiesInCluster;
                y /= numProxiesInCluster;
                if (this.clusterTransparent) {
                    // +1 since it starts at 1
                    opacity /= numProxiesInCluster + 1;
                }

                // Cap opacity in [0,1]
                opacity = Math.max(0, Math.min(1, opacity));
                // Make sure the calculated positions don't leave the canvas bounds
                ({ x, y } = capToCanvas({ x, y, width: size, height: size }, canvas));

                // Also make sure the calculated positions are still capped to the border (no floating proxies)
                let floating = false;
                if (y > 0 && y < canvas.height - size && (x < canvas.width - size || x > 0)) {
                    x = x > (canvas.width - size) / 2 ? canvas.width - size : 0;
                    floating = true;
                }
                if (x > 0 && x < canvas.width - size && (y < canvas.height - size || y > 0)) {
                    y = y > (canvas.height - size) / 2 ? canvas.height - size : 0;
                    floating = true;
                }
                if (floating) {
                    // Readjust if it was previously floating
                    ({ x, y } = capToCanvas({ x, y, width: size, height: size }, canvas));
                }

                const clusterNode = getClusterRendering(`cluster-${clusterIDOffset + i}-proxy`, numProxiesInCluster, size, x, y, opacity);
                res.push({
                    node: clusterNode || { opacity: opacity },
                    transform: {
                        x, y, scale: 1, width: size, height: size,
                        numProxies: numProxiesInCluster // Store the number of proxies in this cluster in case the cluster is clustered later on
                    } as any as TransformAttributes
                });
            }

            // Filter all overlapping nodes
            res = res.filter((_, index) => !anyContains(overlapIndexGroups, index));
            clusterIDOffset += overlapIndexGroups.length;
        }

        return res;
    }

    /** Routes edges from `onScreenNodes` to the corresponding proxies of `nodes`. */
    private routeEdges(nodes: { node: SKNode | VNode, transform: TransformAttributes }[],
        onScreenNodes: SKNode[], canvas: CanvasAttributes, ctx: SKGraphModelRenderer): SKEdge[] {
        if (!this.drawStraightEdges) {
            return [];
        }

        // TODO: could set opacity of original edge to 0 (and reset later on)
        const res = [];
        for (const { node, transform } of nodes) {
            if (node instanceof SKNode) {
                // Incoming edges
                if (isIncomingToAny(node, onScreenNodes)) {
                    for (const edge of node.incomingEdges as SKEdge[]) {
                        if (edge.routingPoints.length > 1) {
                            // Only reroute actual edges with start and end
                            // Proxy is target, node is source
                            const proxyConnector = edge.routingPoints[edge.routingPoints.length - 1];
                            const nodeConnector = edge.routingPoints[0];
                            const proxyEdge = this.rerouteEdge(node, transform, edge, nodeConnector, proxyConnector, false, canvas, ctx);
                            res.push(proxyEdge);
                        }
                    }
                }
                // Outgoing edges
                if (isOutgoingToAny(node, onScreenNodes)) {
                    for (const edge of node.outgoingEdges as SKEdge[]) {
                        if (edge.routingPoints.length > 1) {
                            // Only reroute actual edges with start and end
                            // Proxy is source, node is target
                            const proxyConnector = edge.routingPoints[0];
                            const nodeConnector = edge.routingPoints[edge.routingPoints.length - 1];
                            const proxyEdge = this.rerouteEdge(node, transform, edge, nodeConnector, proxyConnector, true, canvas, ctx);
                            res.push(proxyEdge);
                        }
                    }
                }
            }
        }
        return res;
    }

    /**
     * Returns an edge rerouted to the proxy.
     * `nodeConnector` and `proxyConnector` are the endpoints of the original edge.
     * @param `outgoing` Whether the edge is outgoing from the proxy.
     */
    private rerouteEdge(node: SKNode, transform: TransformAttributes, edge: SKEdge,
        nodeConnector: Point, proxyConnector: Point, outgoing: boolean, canvas: CanvasAttributes, ctx: SKGraphModelRenderer): SKEdge {
        // Connected to node, just calculate absolute coordinates + basic translation
        const parentPos = this.getAbsolutePosition(node.parent as SKNode);
        nodeConnector = Point.add(parentPos, nodeConnector);
        const nodeTranslated = getTranslatedBounds(nodeConnector, canvas);

        // Connected to proxy, use ratio to calculate where to connect to the proxy
        const proxyPointRelative = node.parentToLocal(proxyConnector);
        const proxyRatioX = proxyPointRelative.x / node.bounds.width;
        const proxyRatioY = proxyPointRelative.y / node.bounds.height;
        const proxyTranslated = { x: transform.x + transform.width * proxyRatioX, y: transform.y + transform.height * proxyRatioY };

        // Keep direction of edge
        const source = outgoing ? proxyTranslated : nodeTranslated;
        const target = outgoing ? nodeTranslated : proxyTranslated;

        // Clone the edge so as to not change the real one
        const clone = Object.create(edge) as SKEdge;
        // Set attributes
        clone.routingPoints = [source, target];
        clone.junctionPoints = [];
        // OLD: cannot change these, edges won't be rendered
        // clone.sourceId = outgoing ? this.getProxyId(clone.sourceId) : clone.sourceId;
        // clone.targetId = outgoing ? clone.targetId : this.getProxyId(clone.targetId);
        clone.data = this.placeDecorator(edge.data, ctx, target);
        this.placeDecorator
        clone.opacity = node.opacity;

        return clone;
    }

    /** Returns the proxy rendering for an off-screen node. */
    private createProxy(node: SKNode | VNode, transform: TransformAttributes, ctx: SKGraphModelRenderer): VNode | undefined {
        if (!(node instanceof SKNode)) {
            // VNode, this is a predefined rendering (e.g. cluster)
            updateTransform(node, transform);
            return node;
        } else if (node.opacity <= 0) {
            // Don't render invisible nodes
            return undefined;
        }

        // Check if this node's proxy should be highlighted
        const highlight = node.selected || this.highlightSelected && this.isSelectedOrConnectedToSelected(node);
        const opacity = node.opacity;

        // Get VNode
        const id = this.getProxyId(node.id);
        let vnode = this.renderings.get(id);
        if (!vnode || vnode.selected !== highlight) {
            // Node hasn't been rendered yet (cache empty for this node) or the attributes don't match

            // Change its id to differ from the original node
            node.id = id;
            // Clear children, proxies don't show nested nodes (but keep labels)
            node.children = node.children.filter(node => node instanceof SKLabel);
            // OLD:
            // node.children = node.children.filter(node => !(node instanceof SKNode || node instanceof SKEdge || node instanceof SKPort));
            // Update bounds
            node.bounds = transform;
            // Proxies should never appear to be selected (even if their on-screen counterpart is selected)
            // unless highlighting is enabled
            node.selected = highlight;
            // Render this node as opaque to change opacity later on
            node.opacity = 1;

            vnode = ctx.renderProxy(node);
            if (vnode) {
                // New rendering, set ProxyVNode attributes
                vnode.selected = highlight;
                // Add actions
                this.addEventActions(vnode, node);
            }
        }

        if (vnode) {
            // Store this node
            this.renderings.set(id, vnode);
            // Place proxy at the calculated position
            updateTransform(vnode, transform);
            // Update its opacity
            updateOpacity(vnode, opacity);
            // Update whether it should be click-through
            updateClickThrough(vnode, !this.actionsEnabled || this.clickThrough);
        }

        return vnode;
    }

    /** Returns the proxy rendering for an edge. */
    private createEdgeProxy(edge: SKEdge, ctx: SKGraphModelRenderer): VNode | undefined {
        if (edge.opacity <= 0) {
            // Don't draw an invisible edge
            return undefined;
        }

        // Change its id to differ from the original edge
        /*
        If ids aren't unique, errors like
        - "TypeError: Cannot read property 'removeChild' of null"
        - "DOMException: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
        - "TypeError: Cannot read property 'sel' of undefined"
        can occur
        */
        let id = this.getProxyId(edge.id);
        while (document.getElementById(`keith-diagram_sprotty_${id}`)) {
            id += "-temp";
        }
        edge.id = id;
        // Clear children to remove label decorators,
        // use assign() since children is readonly for SKEdges (but not for SKNodes)
        Object.assign(edge, { children: [] });

        const vnode = ctx.renderProxy(edge);
        return vnode;
    }

    //////// General helper methods ////////

    /** Appends {@link PROXY_SUFFIX} to the given id if the given id isn't already a proxy's id. */
    private getProxyId(id: string): string {
        return id.endsWith(ProxyView.PROXY_SUFFIX) ? id : id + ProxyView.PROXY_SUFFIX;
    }

    /** Removes {@link PROXY_SUFFIX} from the given id if the given id is a proxy's id. */
    private getNodeId(id: string): string {
        return id.endsWith(ProxyView.PROXY_SUFFIX) ? id.substring(0, id.length - ProxyView.PROXY_SUFFIX.length) : id;
    }

    /** Returns whether the given `node` is valid for rendering. */
    private canRenderNode(node: SKNode): boolean {
        // Specified by rendering, otherwise all nodes should be rendered
        return !this.useSynthesisProxyRendering || (node.properties[ProxyView.RENDER_NODE_AS_PROXY_PROPERTY] as boolean ?? true);
    }

    /**
     * Calculates the TransformAttributes for this node's proxy, e.g. the position to place the proxy at aswell as its scale and bounds.
     * Note that the position is pre-scaling. To get position post-scaling, divide `x` and `y` by `scale`.
     */
    private getTransform(node: SKNode, desiredSize: number, proxyBounds: Bounds, canvas: CanvasAttributes): TransformAttributes {
        // OLD: size dependant on node's bounds
        // const proxyWidth = size * 0.001;
        // const proxySizeScale = Math.min(proxyHeightScale, proxyWidthScale);

        // Calculate the scale and the resulting proxy dimensions
        // The scale is calculated such that width & height are capped to a max value
        const proxyWidthScale = desiredSize / proxyBounds.width;
        const proxyHeightScale = desiredSize / proxyBounds.height;
        const scale = Math.min(proxyWidthScale, proxyHeightScale, this.capScaleToOne ? 1 : proxyHeightScale);
        const proxyWidth = proxyBounds.width * scale;
        const proxyHeight = proxyBounds.height * scale;

        // Center at middle of node
        const translated = this.getTranslatedNodeBounds(node, canvas);
        const offsetX = 0.5 * (translated.width - proxyWidth);
        const offsetY = 0.5 * (translated.height - proxyHeight);
        let x = translated.x + offsetX;
        let y = translated.y + offsetY;

        // Cap proxy to canvas
        ({ x, y } = capToCanvas({ x, y, width: proxyWidth, height: proxyHeight }, canvas));

        if (this.capProxyToParent && node.parent && node.parent.id !== "$root") {
            const translatedParent = this.getTranslatedNodeBounds(node.parent as SKNode, canvas);
            x = Math.max(translatedParent.x, Math.min(translatedParent.x + translatedParent.width - proxyWidth, x));
            y = Math.max(translatedParent.y, Math.min(translatedParent.y + translatedParent.height - proxyHeight, y));
        }

        return { x, y, scale, width: proxyWidth, height: proxyHeight };
    }

    /**
     * Returns the translated bounds for the given `node`.
     * @see {@link getTranslatedBounds()}
     */
    private getTranslatedNodeBounds(node: SKNode, canvas: CanvasAttributes): Bounds {
        const absoluteBounds = { ...node.bounds, ...this.getAbsolutePosition(node) };
        return getTranslatedBounds(absoluteBounds, canvas);
    }

    /** Recursively calculates the positions of this node and all of its predecessors and stores them in {@link positions}. */
    private getAbsolutePosition(node: SKNode | SKEdge | SKPort | SKLabel): Point {
        if (!node) {
            return { x: 0, y: 0 };
        }

        // This node might not be a proxy, make sure to store the right id
        const id = this.getProxyId(node.id);
        let point = this.positions.get(id);
        if (!point) {
            // Point hasn't been stored yet, get parent position
            point = this.getAbsolutePosition(node.parent as SKNode | SKEdge | SKPort | SKLabel);
            point = Point.add(point, node.bounds);

            // Also store this point
            if (this.usePositionsCache) {
                this.positions.set(id, point);
            }
        }
        return point;
    }

    /**
     * Returns the distance between the node and the canvas.
     * @see {@link getDistanceToCanvas()}
     */
    private getNodeDistanceToCanvas(node: SKNode, canvas: CanvasAttributes): number {
        const id = this.getProxyId(node.id);
        let dist = this.distances.get(id);
        if (dist) {
            // Cached
            return dist;
        }

        // Calculate distance
        const translated = this.getTranslatedNodeBounds(node, canvas);
        dist = getDistanceToCanvas(translated, canvas);
        this.distances.set(id, dist);

        return dist;
    }

    /** Returns a copy of `edgeData` with the decorators placed at `target`. */
    private placeDecorator(edgeData: KGraphData[], ctx: SKGraphModelRenderer, target: Point): KGraphData[] {
        if (!edgeData || edgeData.length <= 0) {
            return edgeData;
        }
        const data = getKRendering(edgeData, ctx);
        if (!data) {
            return edgeData;
        }

        const res = [];
        const clone = { ...data } as any;
        const props = { ...clone.properties };
        clone.properties = props;
        // OLD: changing the rendering id doesn't work for kgraphs
        // props["klighd.lsp.rendering.id"] = this.getProxyId(props["klighd.lsp.rendering.id"]);

        if (clone.type === K_POLYGON) {
            // Arrow head
            if (props["klighd.lsp.calculated.decoration"]) {
                // TODO: maybe adjust rotation?
                // Move arrow head if actually defined
                props["klighd.lsp.calculated.decoration"] = { ...props["klighd.lsp.calculated.decoration"], origin: target };
            } else {
                // Better not to show it as it would be floating around somewhere
                return [];
            }
        }

        if ((clone as any).children) {
            // Keep going recursively
            (clone as any).children = this.placeDecorator((clone as any).children, ctx, target);
        }

        res.push(clone);
        return res;
    }

    /** Adds actions on events to the vnode. */
    private addEventActions(vnode: VNode, node: SKNode): void {
        if (!this.actionsEnabled) {
            return;
        }

        if (vnode.data) {
            if (!vnode.data.on) {
                vnode.data.on = {};
            }

            // TODO: zoom out (fit to screen) if node is larger than canvas
            // Center on node when proxy is clicked
            vnode.data.on.click = () => this.actionDispatcher.dispatch(
                CenterAction.create([this.getNodeId(node.id)], { animate: true, retainZoom: true })
            );
        }
    }

    //////// Filter methods ////////

    /**
     * Returns all `offScreenNodes` matching the enabled filters.
     * @param `onScreenNodes` is needed by since some filters.
     */
    private applyFilters(offScreenNodes: SKNode[],
        onScreenNodes: SKNode[], canvas: CanvasAttributes): SKNode[] {
        // TODO: filters for node type?, mega nodes (num children, size, ...?)
        // Order by strongest filter criterion first, secondary ordering by simplicity/cost of check
        const range = this.choiceToRange(this.filterDistant);
        return offScreenNodes.filter(node =>
            this.canRenderNode(node) &&
            node.opacity > 0 &&
            (!this.filterUnconnectedToSelected || this.isSelectedOrConnectedToSelected(node)) &&
            (!this.filterUnconnected || isConnectedToAny(node, onScreenNodes)) &&
            (range <= 0 || this.isInRange(node, canvas, range)));
    }

    /** Checks if `node` is selected or connected to any selected element. */
    private isSelectedOrConnectedToSelected(node: SKNode): boolean {
        const selectedNodes = SelectedElementsUtil.getSelectedNodes();
        return node.selected || isConnectedToAny(node, selectedNodes);
    }

    /**
     * Maps the filterDistant choice to a range.
     * If the filter is turned off, returns `-1`.
     */
    private choiceToRange(choice: string): number {
        switch (choice) {
            case ProxyViewFilterDistant.CHOICE_CLOSE:
                return ProxyView.DISTANCE_CLOSE;
            case ProxyViewFilterDistant.CHOICE_DISTANT:
                return ProxyView.DISTANCE_DISTANT;
        }
        return -1;
    }

    /** Checks if the distance between `node` and the canvas is in the given range. */
    private isInRange(node: SKNode, canvas: CanvasAttributes, range: number): boolean {
        return this.getNodeDistanceToCanvas(node, canvas) <= range;
    }

    //////// Misc public methods ////////

    /** Called on mouse down, used for making proxies click-through. */
    setMouseDown(event: MouseEvent): void {
        // Check if the user started the click on a proxy, if not, make click-through
        this.clickThrough = !this.currProxies.some(({ transform }) => Bounds.includes(transform, event));
    }

    /** Called on mouse up, used for making proxies click-through. */
    setMouseUp(event: MouseEvent): void {
        // Upon release, proxies shouldn't be click-through
        this.clickThrough = false;
        this.currProxies.forEach(({ proxy }) => updateClickThrough(proxy, !this.actionsEnabled));
    }

    /** Updates the proxy-view options specified in the {@link RenderOptionsRegistry}. */
    updateOptions(renderOptionsRegistry: RenderOptionsRegistry): void {
        this.prevProxyViewEnabled = this.proxyViewEnabled;
        this.proxyViewEnabled = renderOptionsRegistry.getValue(ProxyViewEnabled);

        const fromPercent = 0.01;
        this.sizePercentage = renderOptionsRegistry.getValue(ProxyViewSize) * fromPercent;

        this.clusteringEnabled = renderOptionsRegistry.getValue(ProxyViewClusteringEnabled);
        this.opacityByDistance = renderOptionsRegistry.getValue(ProxyViewOpacityByDistance);

        this.actionsEnabled = renderOptionsRegistry.getValue(ProxyViewActionsEnabled);

        this.drawStraightEdges = renderOptionsRegistry.getValue(ProxyViewDrawStraightEdges);

        this.capProxyToParent = renderOptionsRegistry.getValue(ProxyViewCapProxyToParent);

        this.filterUnconnected = renderOptionsRegistry.getValue(ProxyViewFilterUnconnected);
        this.filterUnconnectedToSelected = renderOptionsRegistry.getValue(ProxyViewFilterUnconnectedToSelected);
        this.filterDistant = renderOptionsRegistry.getValue(ProxyViewFilterDistant);

        // Debug
        this.highlightSelected = renderOptionsRegistry.getValue(ProxyViewHighlightSelected);
        this.opacityBySelected = renderOptionsRegistry.getValue(ProxyViewOpacityBySelected);

        const useSynthesisProxyRendering = renderOptionsRegistry.getValue(ProxyViewUseSynthesisProxyRendering);
        if (this.useSynthesisProxyRendering !== useSynthesisProxyRendering) {
            // Make sure not to use the wrong renderings if changed
            this.clearRenderings();
        }
        this.useSynthesisProxyRendering = useSynthesisProxyRendering;

        this.stackingOrderByDistance = renderOptionsRegistry.getValue(ProxyViewStackingOrderByDistance);

        this.useDetailLevel = renderOptionsRegistry.getValue(ProxyViewUseDetailLevel);

        this.capScaleToOne = renderOptionsRegistry.getValue(ProxyViewCapScaleToOne);

        this.clusterTransparent = renderOptionsRegistry.getValue(ProxyViewClusterTransparent);
        this.clusteringCascading = renderOptionsRegistry.getValue(ProxyViewClusteringCascading);
        this.clusteringSweepLine = renderOptionsRegistry.getValue(ProxyViewClusteringSweepLine);

        this.usePositionsCache = renderOptionsRegistry.getValue(ProxyViewUsePositionsCache);
        if (this.usePositionsCache) {
            // Make sure to also clear previously cached positions
            this.clearPositions();
        }
    }

    /** Resets the proxy-view, i.e. when the model is updated. */
    reset(): void {
        this.clearPositions();
        this.clearRenderings();
        this.clearDistances();
    }

    /** Clears the {@link renderings} map. */
    clearRenderings(): void {
        this.renderings.clear();
    }

    /** Clears the {@link positions} map. */
    clearPositions(): void {
        this.positions.clear();
    }

    /** Clears the {@link distances} map. */
    clearDistances(): void {
        this.distances.clear();
    }
}
