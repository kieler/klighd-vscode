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
import {
    ProxyViewCapProxyToParent, ProxyViewClusteringCascading, ProxyViewClusteringEnabled, ProxyViewEnabled,
    ProxyViewFilterUnconnected, ProxyViewSize, ProxyViewUseSynthesisProxyRendering, RenderOptionsRegistry
} from "../options/render-options-registry";
import { SKGraphModelRenderer } from "../skgraph-model-renderer";
import { SKEdge, SKNode } from "../skgraph-models";
import { SendProxyViewAction, ShowProxyViewAction, TransformAttributes } from "./proxy-view-actions";

@injectable()
export class ProxyView extends AbstractUIExtension {
    /** ID. */
    static readonly ID = "proxy-view";
    /** ID used for proxy rendering property of SKNodes. */
    static readonly PROXY_RENDERING_PROPERTY = "de.cau.cs.kieler.klighd.proxyRendering";
    /** ID used for proxy rendering property of SKNodes. */
    static readonly RENDER_NODE_AS_PROXY_PROPERTY = "de.cau.cs.kieler.klighd.renderNodeAsProxy";
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
    /** @see {@link ProxyViewEnabled} */
    private proxyViewEnabled: boolean;
    /** @see {@link ProxyViewSize} */
    private sizePercentage: number;
    /** @see {@link ProxyViewClusteringEnabled} */
    private clusteringEnabled: boolean;
    /** @see {@link ProxyViewClusteringCascading} */
    private clusteringCascading: boolean;
    /** @see {@link ProxyViewCapProxyToParent} */
    private capProxyToParent: boolean;
    /** @see {@link ProxyViewUseSynthesisProxyRendering} */
    private useSynthesisProxyRendering: boolean;
    /** @see {@link ProxyViewFilterUnconnected} */
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
        const clusteredNodes = this.applyClustering(transformedOffScreenNodes, size, canvasWidth, canvasHeight);

        // Render the proxies
        const res = [];
        for (const { node, transform } of clusteredNodes) {
            // Create a proxy
            const vnode = this.createSingleProxy(node, transform, ctx);
            if (vnode) {
                res.push(vnode);
            }
        }

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
    private applyClustering(offScreenNodes: { node: SKNode, transform: TransformAttributes }[],
        size: number, canvasWidth: number, canvasHeight: number): { node: SKNode | VNode, transform: TransformAttributes }[] {
        if (!this.clusteringEnabled) {
            return offScreenNodes;
        }

        // List containing groups of indices of overlapping proxies
        // Could use a set of sets here, not needed since the same group cannot appear twice
        let overlapIndexGroups: number[][] = [[]];
        let res: { node: SKNode | VNode, transform: TransformAttributes }[] = offScreenNodes;

        while (overlapIndexGroups.length > 0) {
            overlapIndexGroups = [];
            for (let i = 0; i < res.length; i++) {
                if (!this.clusteringCascading && overlapIndexGroups.reduce((acc, group) => acc.concat(group), []).includes(i)) {
                    // i already in an overlapIndexGroup, prevent cascading clustering
                    continue;
                }

                // New list for current overlap group
                const currOverlapIndexGroup = [];

                // Check next proxies for overlap
                for (let j = i + 1; j < res.length; j++) {
                    if (this.checkOverlap(res[i].transform, res[j].transform)) {
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

            if (overlapIndexGroups.length <= 0) {
                // No more overlap
                break;
            }

            if (this.clusteringCascading) {
                // Join groups containing at least 1 same index
                overlapIndexGroups = this.joinTransitiveGroups(overlapIndexGroups);
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
                for (const { transform } of currGroupNodes) {
                    // Weigh coordinates by the number of proxies in the current proxy (which might be a cluster)
                    const numProxiesInCurr = (transform as any).numProxies ?? 1;

                    numProxiesInCluster += numProxiesInCurr;
                    x += transform.x * numProxiesInCurr;
                    y += transform.y * numProxiesInCurr;
                }
                x /= numProxiesInCluster;
                y /= numProxiesInCluster;

                // Make sure the calculated positions don't leave the canvas bounds
                x = Math.max(0, Math.min(canvasWidth - size, x));
                y = Math.max(0, Math.min(canvasHeight - size, y));
                // Also make sure the calculated positions are still capped to the border (no floating proxies)
                if (y > 0 && y < canvasHeight - size && (x < canvasWidth - size || x > 0)) {
                    x = x > (canvasWidth - size) / 2 ? canvasWidth - size : 0;
                }
                if (x > 0 && x < canvasWidth - size && (y < canvasHeight - size || y > 0)) {
                    y = y > (canvasHeight - size) / 2 ? canvasHeight - size : 0;
                }

                const clusterNode = this.getClusterRendering(`cluster-${i}-proxy`, numProxiesInCluster, size, x, y);
                res.push({
                    node: clusterNode,
                    transform: {
                        x: x, y: y, scale: 1, width: size, height: size,
                        numProxies: numProxiesInCluster // Store the number of proxies in this cluster in case the cluster is clustered later on
                    } as any as TransformAttributes
                });
            }

            // Filter all overlapping nodes
            res = res.filter((_, index) => !overlapIndexGroups.reduce((acc, group) => acc.concat(group), []).includes(index));
        }

        return res;
    }

    /** Returns the proxy rendering for a single off-screen node and applies logic, e.g. the proxy's position. */
    private createSingleProxy(node: SKNode | VNode, transform: TransformAttributes, ctx: SKGraphModelRenderer): VNode | undefined {
        let transformString = `translate(${transform.x}, ${transform.y})`;
        if (transform.scale) {
            transformString += ` scale(${transform.scale})`;
        }

        if (!(node instanceof SKNode)) {
            // VNode, this is a predefined rendering (e.g. cluster)
            this.updateTransform(node, transformString);
            return node;
        }

        // Get VNode
        const id = this.getProxyId(node.id);
        let vnode = this.renderings.get(id);
        if (vnode) {
            // Node has already been rendered, update position and return
            this.updateTransform(vnode, transformString);
        } else {
            // This effectively clones the node
            const clone: SKNode = Object.create(node);
            // Change its id for good measure
            clone.id = id;
            // Clear children, proxies don't show nested nodes (but keep Labels)
            clone.children = clone.children.filter(node => !(node instanceof SKNode || node instanceof SKEdge));
            // Update bounds
            clone.bounds = transform;

            // Check if synthesis has specified a proxy rendering
            if (this.useSynthesisProxyRendering && node.properties && node.properties[ProxyView.PROXY_RENDERING_PROPERTY]) {
                // Proxy rendering available
                console.log("node"); // FIXME:
                console.log(node.properties[ProxyView.PROXY_RENDERING_PROPERTY]); // FIXME:
                console.log("proxyRendering"); // FIXME:
                console.log(node.properties[ProxyView.PROXY_RENDERING_PROPERTY + "2"]); // FIXME:
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
    private canRenderNode(node: SKNode): boolean {
        if (this.useSynthesisProxyRendering) {
            return !this.useSynthesisProxyRendering || (node.properties[ProxyView.RENDER_NODE_AS_PROXY_PROPERTY] as boolean ?? true);
        } else {
            // Not an edge, not a comment/non-explicitly specified region
            // Don't just use includes("$$") since non-explicitly specified regions may contain nodes
            return node instanceof SKNode && node.id.charAt(node.id.lastIndexOf("$") - 1) !== "$";
        }
    }

    /** Updates the proxy-view options specified in the {@link RenderOptionsRegistry}. */
    updateOptions(renderOptionsRegistry: RenderOptionsRegistry): void {
        this.proxyViewEnabled = renderOptionsRegistry.getValue(ProxyViewEnabled);
        this.sizePercentage = renderOptionsRegistry.getValue(ProxyViewSize);
        this.clusteringEnabled = renderOptionsRegistry.getValue(ProxyViewClusteringEnabled);
        this.clusteringCascading = renderOptionsRegistry.getValue(ProxyViewClusteringCascading);
        this.capProxyToParent = renderOptionsRegistry.getValue(ProxyViewCapProxyToParent);
        // TODO: toggling while a proxy is on-screen doesn't get rid of the old proxy yet
        const useSynthesisProxyRendering = renderOptionsRegistry.getValue(ProxyViewUseSynthesisProxyRendering);
        if (this.useSynthesisProxyRendering !== useSynthesisProxyRendering) {
            // Make sure not to use the wrong renderings if changed
            this.clearRenderings();
        }
        this.useSynthesisProxyRendering = useSynthesisProxyRendering;
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
        // OLD: size dependant on node's bounds
        // const proxyWidth = size * 0.001;
        // const proxySizeScale = Math.min(proxyHeightScale, proxyWidthScale);
        // console.log(proxySizeScale);

        const pos = this.getPosition(node);
        const bounds = node.bounds;

        // Calculate the scale and the resulting proxy dimensions
        // The scale is calculated such that width & height are capped to a max value
        const proxyWidthScale = desiredSize / bounds.width;
        const proxyHeightScale = desiredSize / bounds.height;
        const scale = Math.min(1, proxyWidthScale, proxyHeightScale); // TODO: max 1? (include in min)
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
        const isSidebarOpen = document.querySelector('.sidebar--open');
        if (!isSidebarOpen && rect && y < rect.bottom && x > rect.left - proxyWidth) {
            x = rect.left - proxyWidth;
        }

        if (this.capProxyToParent && node.parent && node.parent.id !== "$root") {
            const parent = node.parent as SKNode;
            const parentBounds = parent.bounds;
            const parentPos = this.getPosition(parent);
            x = Math.max((parentPos.x - scroll.x) * zoom, Math.min((parentPos.x + parentBounds.width - scroll.x) * zoom - proxyWidth, x));
            y = Math.max((parentPos.y - scroll.y) * zoom, Math.min((parentPos.y + parentBounds.height - scroll.y) * zoom - proxyHeight, y));
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

    /** Updates a VNode's transform attribute. */
    private updateTransform(node: VNode, transformString: string): void {
        if (node && node.data && node.data.attrs) {
            // Just changing the VNode's attribute is insufficient as it doesn't change the document's attribute while on the canvas
            // Update transform while off the canvas
            node.data.attrs["transform"] = transformString;
            // Update transform while on the canvas
            document.getElementById(`keith-diagram_sprotty_${node.key?.toString()}`)?.setAttribute("transform", transformString);
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

    /**
     * Join groups containing at least 1 same element. Transitive joining applies:
     * @example joinTransitiveGroups([[0, 1], [1, 2], [2, 3]]) == [[0, 1, 2, 3]]
     */
    private joinTransitiveGroups<T>(groups: T[][]): T[][] {
        const res = [];
        while (groups.length > 0) {
            // Use a set for removing duplicates
            let firstGroup = Array.from(new Set(groups.shift()));
            let remainingGroups = [...groups];

            let prevLength = -1;
            while (firstGroup.length > prevLength) {
                // Iterate until no group can be joined with firstGroup anymore
                prevLength = firstGroup.length;
                const nextRemainingGroups = [];
                for (const group of remainingGroups) {
                    if (new Set([...firstGroup].filter(x => group.includes(x))).size > 0) {
                        // Intersection of firstGroup and group is not empty, join both groups
                        firstGroup = Array.from(new Set(firstGroup.concat(group)));
                    } else {
                        // firstGroup and group share no element
                        nextRemainingGroups.push(group);
                    }
                }
                remainingGroups = nextRemainingGroups;
            }

            // firstGroup has been fully joined, add to res and continue with remainingGroups
            res.push(Array.from(new Set(firstGroup)));
            groups = remainingGroups;
        }
        return res;
    }

    /** Returns the rendering of clusters. */
    private getClusterRendering(id: string, numProxies: number, size: number, x: number, y: number): VNode {
        return JSON.parse(
            `{
                "sel": "g",
                "data": {
                    "ns": "http://www.w3.org/2000/svg",
                    "attrs": {
                        "id": "keith-diagram_sprotty_$${id}",
                        "transform": "translate(${x}, ${y})"
                    },
                    "class": {
                        "selected": false
                    }
                },
                "children": [
                    {
                        "sel": "g",
                        "data": {
                            "ns": "http://www.w3.org/2000/svg",
                            "attrs": {
                                "id": "${id}1"
                            }
                        },
                        "children": [
                            {
                                "sel": "rect",
                                "data": {
                                    "ns": "http://www.w3.org/2000/svg",
                                    "style": {
                                        "opacity": "1"
                                    },
                                    "attrs": {
                                        "width":${size * 0.9},
                                        "height":${size * 0.9},
                                        "x":${size * 0.1},
                                        "y":${size * 0.1},
                                        "stroke": "black",
                                        "fill": "rgb(220,220,220)"
                                    }
                                },
                                "children": []
                            },
                            {
                                "sel": "g",
                                "data": {
                                    "ns": "http://www.w3.org/2000/svg",
                                    "attrs": {
                                        "id": "${id}2"
                                    }
                                },
                                "children": []
                            }
                        ]
                    },
                    {
                        "sel": "g",
                        "data": {
                            "ns": "http://www.w3.org/2000/svg",
                            "attrs": {
                                "id": "${id}3"
                            }
                        },
                        "children": [
                            {
                                "sel": "rect",
                                "data": {
                                    "ns": "http://www.w3.org/2000/svg",
                                    "style": {
                                        "opacity": "1"
                                    },
                                    "attrs": {
                                        "width":${size * 0.9},
                                        "height":${size * 0.9},
                                        "stroke": "black",
                                        "fill": "rgb(220,220,220)"
                                    }
                                },
                                "children": []
                            },
                            {
                                "sel": "g",
                                "data": {
                                    "ns": "http://www.w3.org/2000/svg",
                                    "attrs": {
                                        "id": "${id}4"
                                    }
                                },
                                "children": []
                            }
                        ]
                    },
                    {
                        "sel": "g",
                        "data": {
                            "ns": "http://www.w3.org/2000/svg",
                            "attrs": {
                                "id": "keith-diagram_sprotty_$${id}2",
                                "transform": "translate(${size * 0.25}, ${size * 0.5})"
                            },
                            "class": {
                                "selected": false
                            }
                        },
                        "children": [
                            {
                                "sel": "g",
                                "data": {
                                    "ns": "http://www.w3.org/2000/svg",
                                    "attrs": {
                                        "id": "${id}5"
                                    }
                                },
                                "children": [
                                    {
                                        "sel": "text",
                                        "data": {
                                            "ns": "http://www.w3.org/2000/svg",
                                            "style": {
                                                "dominant-baseline": "middle",
                                                "font-family": "overpass, sans-serif",
                                                "font-size": "${size * 0.5}",
                                                "opacity": 1
                                            },
                                            "attrs": {
                                                "x": 0,
                                                "xml:space": "preserve",
                                                "y": 0,
                                                "lengthAdjust": "spacingAndGlyphs"
                                            }
                                        },
                                        "text": "${numProxies}"
                                    }
                                ]
                            }
                        ],
                        "key": "$${id}2"
                    }
                ],
                "key": "$${id}"
            }`);
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
}
