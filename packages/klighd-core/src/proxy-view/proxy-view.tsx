/* eslint-disable no-continue */
/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2023 by
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
import { KGraphData } from '@kieler/klighd-interactive/lib/constraint-classes'
import { inject, injectable, postConstruct } from 'inversify'
import { VNode } from 'snabbdom'
import {
    AbstractUIExtension,
    html, // eslint-disable-line @typescript-eslint/no-unused-vars
    IActionDispatcher,
    isThunk,
    MouseTool,
    Patcher,
    PatcherProvider,
    SGraphImpl,
    TYPES,
} from 'sprotty'
import { angleOfPoint, Bounds, Point } from 'sprotty-protocol'
import { isDetailWithChildren } from '../depth-map'
import { RenderOptionsRegistry } from '../options/render-options-registry'
import { SKGraphModelRenderer } from '../skgraph-model-renderer'
import { isContainerRendering, isPolyline, K_POLYGON, SKEdge, SKLabel, SKNode, SKPort } from '../skgraph-models'
import { getKRendering } from '../views-common'
import { K_BACKGROUND, K_FOREGROUND } from '../views-styles'
import { ProxyFilter, ProxyFilterAndID } from './filters/proxy-view-filters'
import { SendProxyViewAction, ShowProxyViewAction } from './proxy-view-actions'
import { getClusterRendering } from './proxy-view-cluster'
import {
    ProxyViewCapProxyToParent,
    ProxyViewCapScaleToOne,
    ProxyViewClusterTransparent,
    ProxyViewClusteringCascading,
    ProxyViewClusteringSweepLine,
    ProxyViewDecreaseProxyClutter,
    ProxyViewDrawEdgesAboveNodes,
    ProxyViewEdgesToOffScreenPoint,
    ProxyViewEnableEdgeProxies,
    ProxyViewEnableSegmentProxies,
    ProxyViewEnabled,
    ProxyViewHighlightSelected,
    ProxyViewInteractiveProxies,
    ProxyViewOpacityBySelected,
    ProxyViewOriginalNodeScale,
    ProxyViewShowProxiesEarly,
    ProxyViewShowProxiesEarlyNumber,
    ProxyViewShowProxiesImmediately,
    ProxyViewSimpleAlongBorderRouting,
    ProxyViewSize,
    ProxyViewStackingOrderByDistance,
    ProxyViewStackingOrderByOpacity,
    ProxyViewStackingOrderBySelected,
    ProxyViewTitleScaling,
    ProxyViewTransparentEdges,
    ProxyViewUseDetailLevel,
    ProxyViewUseSynthesisProxyRendering,
} from './proxy-view-options'
import {
    anyContains,
    Canvas,
    capNumber,
    checkOverlap,
    getIntersection,
    isSelectedOrConnectedToSelected,
    joinTransitiveGroups,
    getProxyId,
    ProxyKGraphData,
    ProxyVNode,
    SelectedElementsUtil,
    TransformAttributes,
    updateClickThrough,
    updateOpacity,
    updateTransform,
} from './proxy-view-util'
/* global document, HTMLElement, MouseEvent */

/** A UIExtension which adds a proxy-view to the Sprotty container. */
@injectable()
export class ProxyView extends AbstractUIExtension {
    /** ID. */
    static readonly ID = 'proxy-view'

    /**
     * ID used to indicate whether an SKNode should be rendered as a proxy.
     * The corresponding property can be `true` or `false`.
     */
    static readonly RENDER_NODE_AS_PROXY_PROPERTY = 'de.cau.cs.kieler.klighd.proxyView.renderNodeAsProxy'

    /**
     * ID used for proxy rendering property of SKNodes.
     * The corresponding property contains the proxy's data.
     */
    static readonly PROXY_RENDERING_PROPERTY = 'de.cau.cs.kieler.klighd.proxyView.proxyRendering'

    /**
     * ID used for specifying depth of going into hierarchical off-screen nodes.
     * `0` indicates default behavior, showing only the outermost node as a proxy.
     * A value `x>0` indicates showing proxies up to x layers deep inside a hierarchical node.
     * A value `x<0` indicates always showing proxies for all layers.
     */
    static readonly HIERARCHICAL_OFF_SCREEN_DEPTH = 'de.cau.cs.kieler.klighd.proxyView.hierarchicalOffScreenDepth'

    /** Number indicating at what distance a node is close. */ // TODO: could let the synthesis define the distance values
    static readonly DISTANCE_CLOSE = 300

    /** Number indicating at what distance a node is distant. */
    static readonly DISTANCE_DISTANT = 700

    /** ActionDispatcher mainly needed for init(). */
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher

    /** Provides the utensil to replace HTML elements. */
    @inject(TYPES.PatcherProvider) private patcherProvider: PatcherProvider

    /** Used to replace HTML elements. */
    private patcher: Patcher

    /** VNode of the current HTML root element. Used by the {@link patcher}. */
    private currHTMLRoot: VNode

    /** The mouse tool to decorate the proxy nodes with. */
    @inject(MouseTool) mouseTool: MouseTool

    /** The registered filters. */
    private filters: Map<string, ProxyFilter>

    /** The currently rendered proxies. */
    private currProxies: { proxy: VNode; transform: TransformAttributes }[]

    /** Whether the proxies should be click-through. */
    private clickThrough: boolean

    /**
     * Stores the previous opacity of edges whose opacity was modified.
     * Always make sure the ids from {@link getProxyId()} are used.
     */
    private prevModifiedEdges: Map<string, [SKEdge, number]>

    /// / Caches ////
    /**
     * Stores the proxy renderings of already rendered nodes.
     * Always make sure the ids from {@link getProxyId()} are used.
     */
    private renderings: Map<string, ProxyVNode>

    /**
     * Stores the absolute coordinates (without scroll and zoom) of already rendered nodes.
     * Always make sure the ids from {@link getProxyId()} are used.
     */
    private positions: Map<string, Point>

    /**
     * Stores the distances of nodes to the canvas.
     * Always make sure the ids from {@link getProxyId()} are used.
     */
    private distances: Map<string, number>

    /// / Sidebar options ////
    /** @see {@link ProxyViewEnabled} */
    private proxyViewEnabled: boolean

    /** Whether the proxy view was previously enabled. Used to avoid excessive patching. */
    private prevProxyViewEnabled: boolean

    /** @see {@link ProxyViewSize} */
    private sizePercentage: number

    /** @see {@link ProxyViewDecreaseProxyClutter} */
    private clusteringEnabled: boolean

    /** @see {@link ProxyViewDecreaseProxyClutter} */
    private opacityByDistanceEnabled: boolean

    /** @see {@link ProxyViewEnableEdgeProxies} */
    private straightEdgeRoutingEnabled: boolean

    /** @see {@link ProxyViewEnableEdgeProxies} */
    private alongBorderRoutingEnabled: boolean

    /** @see {@link ProxyViewEnableSegmentProxies} */
    private segmentProxiesEnabled: boolean

    /** @see {@link ProxyViewInteractiveProxies} */
    private interactiveProxiesEnabled: boolean

    /** @see {@link ProxyViewTitleScaling} */
    private titleScalingEnabled: boolean

    /// / Sidebar debug options ////
    /**
     * Note that clusters are never highlighted, as highlighting is synthesis-specific while cluster renderings are not.
     * @see {@link ProxyViewHighlightSelected}
     */
    private highlightSelected: boolean

    /** @see {@link ProxyViewOpacityBySelected} */
    private opacityBySelected: boolean

    /** @see {@link ProxyViewUseSynthesisProxyRendering} */
    private useSynthesisProxyRendering: boolean

    /** @see {@link ProxyViewSimpleAlongBorderRouting} */
    private simpleAlongBorderRouting: boolean

    /** @see {@link ProxyViewCapProxyToParent} */
    private capProxyToParent: boolean

    /** @see {@link ProxyViewShowProxiesImmediately} */
    private showProxiesImmediately: boolean

    /** @see {@link ProxyViewShowProxiesEarly} */
    private showProxiesEarly: boolean

    /** @see {@link ProxyViewShowProxiesEarlyNumber} */
    private showProxiesEarlyNumber: number

    /** @see {@link ProxyViewStackingOrderByDistance} */
    private stackingOrderByDistance: boolean

    /** @see {@link ProxyViewStackingOrderByOpacity} */
    private stackingOrderByOpacity: boolean

    /** @see {@link ProxyViewStackingOrderBySelected} */
    private stackingOrderBySelected: boolean

    /** @see {@link ProxyViewUseDetailLevel} */
    private useDetailLevel: boolean

    /** @see {@link ProxyViewDrawEdgesAboveNodes} */
    private edgesAboveNodes: boolean

    /** @see {@link ProxyViewEdgesToOffScreenPoint} */
    private edgesToOffScreenPoint: boolean

    /** @see {@link ProxyViewTransparentEdges} */
    private transparentEdges: boolean

    /** @see {@link ProxyViewOriginalNodeScale} */
    private originalNodeScale: boolean

    /** @see {@link ProxyViewCapScaleToOne} */
    private capScaleToOne: boolean

    /** @see {@link ProxyViewClusterTransparent} */
    private clusterTransparent: boolean

    /** @see {@link ProxyViewClusteringCascading} */
    private clusteringCascading: boolean

    /** @see {@link ProxyViewClusteringSweepLine} */
    private clusteringSweepLine: boolean

    id(): string {
        return ProxyView.ID
    }

    containerClass(): string {
        return ProxyView.ID
    }

    @postConstruct()
    init(): void {
        // Send and show proxy-view
        this.actionDispatcher.dispatch(SendProxyViewAction.create(this))
        this.actionDispatcher.dispatch(ShowProxyViewAction.create())
        this.patcher = this.patcherProvider.patcher
        // Initialize caches
        this.filters = new Map()
        this.currProxies = []
        this.prevModifiedEdges = new Map()
        this.renderings = new Map()
        this.positions = new Map()
        this.distances = new Map()
    }

    protected initializeContents(containerElement: HTMLElement): void {
        // Use temp for initializing currHTMLRoot
        const temp = document.createElement('div')
        this.currHTMLRoot = this.patcher(temp, <div />)
        containerElement.appendChild(temp)
    }

    /// ///// Main methods ////////

    /**
     * Update step of the proxy-view. Handles everything proxy-view related.
     * @param model The current SGraph.
     * @param ctx The rendering context.
     */
    update(model: SGraphImpl, ctx: SKGraphModelRenderer): void {
        if (!this.proxyViewEnabled) {
            if (this.prevProxyViewEnabled) {
                // Prevent excessive patching, only patch if disabled just now
                this.currHTMLRoot = this.patcher(this.currHTMLRoot, <div />)
                this.prevProxyViewEnabled = this.proxyViewEnabled
            }
            return
        }
        if (!this.currHTMLRoot) {
            return
        }

        const canvasWidth = model.canvasBounds.width
        const canvasHeight = model.canvasBounds.height
        const canvas = Canvas.of(model, ctx.viewport)
        const root = model.children[0] as SKNode
        // Actually update the document
        this.currHTMLRoot = this.patcher(
            this.currHTMLRoot,
            <svg
                style={{
                    // Set size to whole canvas
                    width: `${canvasWidth}`,
                    height: `${canvasHeight}`,
                }}
            >
                {...this.createAllProxies(root, ctx, canvas)}
            </svg>
        )
    }

    /** Returns the proxy rendering for all of currRoot's off-screen children and applies logic, e.g. clustering. */
    private createAllProxies(root: SKNode, ctx: SKGraphModelRenderer, canvas: Canvas): VNode[] {
        // Iterate through nodes starting by root, check if node is:
        // (partially) in bounds -> no proxy, check children
        // out of bounds         -> proxy

        // Translate canvas to both Reference Frames
        const canvasCRF = Canvas.translateCanvasToCRF(canvas)
        const canvasGRF = Canvas.translateCanvasToGRF(canvas)

        // Calculate size of proxies
        const size = Math.min(canvasCRF.width, canvasCRF.height) * this.sizePercentage

        const fromPercent = 0.01
        // The amount of pixels to offset the GRF canvas size by 1%.
        const onePercentOffsetGRF = Math.min(canvasGRF.width, canvasGRF.height) * fromPercent

        /// / Initial nodes ////
        const depth = (root.properties[ProxyView.HIERARCHICAL_OFF_SCREEN_DEPTH] as number) ?? 0
        // Reduce canvas size to show proxies early
        const sizedCanvas = this.showProxiesEarly
            ? Canvas.offsetCanvas(canvasGRF, this.showProxiesEarlyNumber * onePercentOffsetGRF)
            : canvasGRF
        const { offScreenNodes, onScreenNodes } = this.getOffAndOnScreenNodes(root, sizedCanvas, depth, ctx)

        /// / Apply filters ////
        const filteredOffScreenNodes = this.applyFilters(
            // The nodes to filter
            offScreenNodes,
            // Additional arguments for filters
            onScreenNodes,
            canvasCRF,
            canvasGRF
        )

        /// / Clone nodes ////
        const clonedNodes = this.cloneNodes(filteredOffScreenNodes)

        /// / Opacity ////
        const opacityOffScreenNodes = this.calculateOpacity(clonedNodes, canvasGRF)

        /// / Stacking order ////
        const orderedOffScreenNodes = this.orderNodes(opacityOffScreenNodes, canvasGRF)

        /// / Use proxy-rendering as specified by synthesis ////
        const synthesisRenderedOffScreenNodes = this.getSynthesisProxyRendering(orderedOffScreenNodes, ctx)

        /// / Calculate transformations ////
        const transformedOffScreenNodes = synthesisRenderedOffScreenNodes.map(({ node, proxyBounds }) => ({
            node,
            transform: this.getTransform(node, size, proxyBounds, canvasCRF),
        }))

        /// / Apply clustering ////
        const clusteredNodes = this.applyClustering(transformedOffScreenNodes, size, canvasCRF)

        /// / Route edges to proxies ////
        const routedEdges = this.routeEdges(clusteredNodes, onScreenNodes, canvasCRF, onePercentOffsetGRF, ctx)

        /// / Connect off-screen edges ////
        const segmentConnectors = this.connectEdgeSegments(root, canvasGRF, onePercentOffsetGRF, ctx)

        /// / Render the proxies ////
        const proxies = []
        this.currProxies = []

        // Nodes
        for (const { node, transform } of clusteredNodes) {
            // Create a proxy
            const proxy = this.createProxy(node, transform, canvasGRF, ctx)
            if (proxy) {
                proxies.push(proxy)
                this.currProxies.push({ proxy, transform })
            }
        }

        // Edges that can be rendered above/below proxies
        const edgeProxies = []
        for (const { edge, transform } of routedEdges.proxyEdges) {
            // Create an edge proxy
            const edgeProxy = this.createEdgeProxy(edge, transform, ctx)
            if (edgeProxy) {
                edgeProxies.push(edgeProxy)
            }
        }
        if (this.edgesAboveNodes) {
            // Insert at end to be rendered above nodes
            proxies.push(...edgeProxies)
        } else {
            // Insert at start to be rendered below nodes
            proxies.unshift(...edgeProxies)
        }

        // Edges that should always be rendered below proxies
        const backEdgeProxies = []
        const backEdges = ([] as { edge: SKEdge; transform: TransformAttributes }[]).concat(
            // Start with overlays to not have overlays over proxy edges
            segmentConnectors.overlayEdges,
            segmentConnectors.proxyEdges,
            // But routing overlays should still be over segment connectors
            routedEdges.overlayEdges
        )
        for (const { edge, transform } of backEdges) {
            // Create an edge proxy
            const edgeProxy = this.createEdgeProxy(edge, transform, ctx)
            if (edgeProxy) {
                backEdgeProxies.push(edgeProxy)
            }
        }
        proxies.unshift(...backEdgeProxies)

        // Clear caches for the next model
        this.clearPositions()
        this.clearDistances()

        return proxies
    }

    /**
     * Returns an object containing lists of all off-screen and on-screen nodes in `currRoot`.
     * Note that an off-screen node's children aren't included in the list, e.g. only outer-most off-screen nodes are returned.
     */
    private getOffAndOnScreenNodes(
        currRoot: SKNode,
        canvasGRF: Canvas,
        depth: number,
        ctx: SKGraphModelRenderer
    ): { offScreenNodes: SKNode[]; onScreenNodes: SKNode[] } {
        // For each node check if it's off-screen
        const offScreenNodes = []
        const onScreenNodes = []
        for (const node of currRoot.children) {
            if (node instanceof SKNode) {
                const bounds = this.getAbsoluteBounds(node)

                if (this.showProxiesImmediately) {
                    // Show proxies as soon as a node is not completely on-screen
                    if (
                        (bounds.x < canvasGRF.x ||
                            bounds.x + bounds.width > canvasGRF.x + canvasGRF.width ||
                            bounds.y < canvasGRF.y ||
                            bounds.y + bounds.height > canvasGRF.y + canvasGRF.height) &&
                        !(
                            (canvasGRF.x >= bounds.x && canvasGRF.x + canvasGRF.width <= bounds.x + bounds.width) ||
                            (canvasGRF.y >= bounds.y && canvasGRF.y + canvasGRF.height <= bounds.y + bounds.height)
                        )
                    ) {
                        // Node partially out of bounds and doesn't envelop canvas
                        offScreenNodes.push(node)

                        if (Canvas.isOnScreen(bounds, canvasGRF)) {
                            // Just partially out of bounds
                            if (node.children.length > 0) {
                                const region = ctx.depthMap?.getProvidingRegion(
                                    node,
                                    ctx.viewport,
                                    ctx.renderOptionsRegistry
                                )

                                if (!(this.useDetailLevel && region?.detail) || isDetailWithChildren(region.detail)) {
                                    // Has children, recursively check them
                                    const childRes = this.getOffAndOnScreenNodes(node, canvasGRF, depth, ctx)
                                    offScreenNodes.push(...childRes.offScreenNodes)
                                    onScreenNodes.push(...childRes.onScreenNodes)
                                }
                            }
                        } else if (depth !== 0 && node.children.length > 0) {
                            // Fully out of bounds
                            /** depth > 0 or < 0 (see {@link HIERARCHICAL_OFF_SCREEN_DEPTH}), go further in */
                            const childRes = this.getOffAndOnScreenNodes(node, canvasGRF, depth - 1, ctx)
                            offScreenNodes.push(...childRes.offScreenNodes)
                            onScreenNodes.push(...childRes.onScreenNodes)
                        }
                    } else {
                        // Node completely in bounds or envelops canvas
                        onScreenNodes.push(node)

                        if (node.children.length > 0) {
                            const region = ctx.depthMap?.getProvidingRegion(
                                node,
                                ctx.viewport,
                                ctx.renderOptionsRegistry
                            )

                            if (!(this.useDetailLevel && region?.detail) || isDetailWithChildren(region.detail)) {
                                // Has children, recursively check them
                                const childRes = this.getOffAndOnScreenNodes(node, canvasGRF, depth, ctx)
                                offScreenNodes.push(...childRes.offScreenNodes)
                                onScreenNodes.push(...childRes.onScreenNodes)
                            }
                        }
                    }
                } else if (!Canvas.isOnScreen(bounds, canvasGRF)) {
                    // Normal proxy-view behaviour
                    // Node out of bounds
                    offScreenNodes.push(node)

                    if (depth !== 0 && node.children.length > 0) {
                        /** depth > 0 or < 0 (see {@link HIERARCHICAL_OFF_SCREEN_DEPTH}), go further in */
                        const childRes = this.getOffAndOnScreenNodes(node, canvasGRF, depth - 1, ctx)
                        offScreenNodes.push(...childRes.offScreenNodes)
                        onScreenNodes.push(...childRes.onScreenNodes)
                    }
                } else {
                    // Node in bounds
                    onScreenNodes.push(node)

                    if (node.children.length > 0) {
                        const region = ctx.depthMap?.getProvidingRegion(node, ctx.viewport, ctx.renderOptionsRegistry)

                        if (!(this.useDetailLevel && region?.detail) || isDetailWithChildren(region.detail)) {
                            // Has children, recursively check them
                            const childRes = this.getOffAndOnScreenNodes(node, canvasGRF, depth, ctx)
                            offScreenNodes.push(...childRes.offScreenNodes)
                            onScreenNodes.push(...childRes.onScreenNodes)
                        }
                    }
                }
            }
        }

        return { offScreenNodes, onScreenNodes }
    }

    /**
     * Returns all `offScreenNodes` matching the enabled filters.
     * @param offScreenNodes The nodes to filter.
     * @param onScreenNodes Argument for filters.
     * @param canvasGRF Argument for filters.
     */
    private applyFilters(
        offScreenNodes: SKNode[],
        onScreenNodes: SKNode[],
        canvasCRF: Canvas,
        canvasGRF: Canvas
    ): SKNode[] {
        return offScreenNodes.filter(
            (node) =>
                this.canRenderNode(node) &&
                node.opacity > 0 &&
                Array.from(this.filters.values()).every((filter) =>
                    filter({
                        node,
                        offScreenNodes,
                        onScreenNodes,
                        canvasCRF,
                        canvasGRF,
                        distance: this.getNodeDistanceToCanvas(node, canvasGRF),
                    })
                )
        )
    }

    /** Performs a shallow copy of the nodes so that the original nodes aren't mutated. */
    private cloneNodes(offScreenNodes: SKNode[]): SKNode[] {
        return offScreenNodes.map((node) => Object.create(node))
    }

    /** Calculates the opacities of `offScreenNodes`. */
    private calculateOpacity(offScreenNodes: SKNode[], canvasGRF: Canvas): SKNode[] {
        const res = offScreenNodes
        if (this.opacityByDistanceEnabled) {
            for (const node of res) {
                // Reduce opacity such that the node is fully transparent when the node's distance is >= DISTANCE_DISTANT
                const opacityReduction = this.getNodeDistanceToCanvas(node, canvasGRF) / ProxyView.DISTANCE_DISTANT
                const minOpacity = 0.1
                node.opacity = Math.max(minOpacity, node.opacity - opacityReduction)
            }
        }

        if (this.opacityBySelected && SelectedElementsUtil.areNodesSelected()) {
            // Only change opacity if there are selected nodes
            for (const node of res) {
                if (isSelectedOrConnectedToSelected(node)) {
                    // If selected itself or connected to a selected node, this node should be opaque
                    node.opacity = 1
                } else {
                    // Node not relevant to current selection context, decrease opacity
                    // If opaque, the node should be 50% transparent
                    const opacityReduction = 0.5
                    node.opacity = Math.max(0, node.opacity * opacityReduction)
                }
            }
        }
        return res
    }

    /**
     * Orders `offScreenNodes` such that the contextually most relevant
     * nodes appear at the end - therefore being rendered on top.
     */
    private orderNodes(offScreenNodes: SKNode[], canvasGRF: Canvas): SKNode[] {
        const res = [...offScreenNodes]
        if (!this.clusteringEnabled) {
            // Makes no sense to order when clustering is enabled since proxies cannot be stacked

            /*
            Order these stacking order criteria such that each criterion is more important the previous one,
            i.e. the least important criterion is at the start and the most important one is at the end
            */
            if (this.stackingOrderByDistance) {
                // Distant nodes at start, close nodes at end
                res.sort(
                    (n1, n2) =>
                        this.getNodeDistanceToCanvas(n2, canvasGRF) - this.getNodeDistanceToCanvas(n1, canvasGRF)
                )
            }
            if (this.stackingOrderByOpacity) {
                // Most transparent nodes at start, least transparent ones at end
                res.sort((n1, n2) => n1.opacity - n2.opacity)
            }
            if (this.stackingOrderBySelected) {
                // Move selected nodes to end (and keep previous ordering, e.g. "grouping" by selected)
                res.sort((n1, n2) => (n1.selected === n2.selected ? 0 : n1.selected ? 1 : -1))
            }
        }
        return res
    }

    /** Returns the nodes updated to use the rendering specified by the synthesis. */
    private getSynthesisProxyRendering(
        offScreenNodes: SKNode[],
        ctx: SKGraphModelRenderer
    ): { node: SKNode; proxyBounds: Bounds }[] {
        const res = []
        for (const node of offScreenNodes) {
            // Fallback, if property undefined use universal proxy rendering for this node
            let proxyBounds = node.bounds

            if (
                this.useSynthesisProxyRendering &&
                node.properties &&
                node.properties[ProxyView.PROXY_RENDERING_PROPERTY]
            ) {
                const data = node.properties[ProxyView.PROXY_RENDERING_PROPERTY] as KGraphData[]
                const kRendering = getKRendering(data, ctx)

                if (kRendering && kRendering.properties['klighd.lsp.calculated.bounds']) {
                    // Proxy rendering available, update data
                    node.data = data
                    // Also update the bounds
                    proxyBounds = kRendering.properties['klighd.lsp.calculated.bounds'] as Bounds
                }
            }
            res.push({ node, proxyBounds })
        }
        return res
    }

    /** Applies clustering to all `offScreenNodes` until there's no more overlap. Cluster-proxies are returned as VNodes. */
    private applyClustering(
        offScreenNodes: { node: SKNode; transform: TransformAttributes }[],
        size: number,
        canvasCRF: Canvas
    ): { node: SKNode | VNode; transform: TransformAttributes }[] {
        if (!this.clusteringEnabled) {
            return offScreenNodes
        }

        // List containing groups of indices of overlapping proxies
        // Could use a set of sets here, not needed since the same group cannot appear twice
        let overlapIndexGroups: number[][] = [[]]
        let res: { node: SKNode | VNode; transform: TransformAttributes }[] = offScreenNodes

        // Make sure each cluster id is unique
        let clusterIDOffset = 0
        while (overlapIndexGroups.length > 0) {
            overlapIndexGroups = []

            if (this.clusteringSweepLine) {
                // Sort res primarily by leftmost x value, secondarily by uppermost y value, i.e.
                // res[0] has leftmost proxy (and of all leftmost proxies it's the uppermost one)
                res = res.sort(({ transform: t1 }, { transform: t2 }) => {
                    let result = t1.x - t2.x
                    if (result === 0) {
                        result = t1.y - t2.y
                    }
                    return result
                })

                for (let i = 0; i < res.length; i++) {
                    if (!this.clusteringCascading && anyContains(overlapIndexGroups, i)) {
                        // i already in an overlapIndexGroup, prevent redundant clustering
                        continue
                    }

                    // New list for current overlap group
                    const currOverlapIndexGroup = []

                    // Check proxies to the left of the current one's right border for overlap
                    const transform1 = res[i].transform
                    const right = transform1.x + transform1.width
                    const bottom = transform1.y + transform1.height
                    for (let j = 0; j < res.length; j++) {
                        if (i === j || anyContains(overlapIndexGroups, j)) {
                            // Every proxy overlaps with itself or
                            // j already in an overlapIndexGroup, prevent redundant clustering
                            continue
                        }

                        const transform2 = res[j].transform
                        if (transform2.x > right) {
                            // Too far right, no need to check
                            break
                        } else if (transform2.x === right && transform2.y > bottom) {
                            // Too far down, no need to check
                            break
                        } else if (checkOverlap(transform1, transform2)) {
                            // Proxies at i and j overlap
                            currOverlapIndexGroup.push(j)
                        }
                    }

                    if (currOverlapIndexGroup.length > 0) {
                        // This proxy overlaps
                        currOverlapIndexGroup.push(i)
                        overlapIndexGroups.push(currOverlapIndexGroup)
                    }
                }
            } else {
                for (let i = 0; i < res.length; i++) {
                    if (!this.clusteringCascading && anyContains(overlapIndexGroups, i)) {
                        // i already in an overlapIndexGroup, prevent redundant clustering
                        continue
                    }

                    // New list for current overlap group
                    const currOverlapIndexGroup = []

                    // Check next proxies for overlap
                    for (let j = i + 1; j < res.length; j++) {
                        if (checkOverlap(res[i].transform, res[j].transform)) {
                            // Proxies at i and j overlap
                            currOverlapIndexGroup.push(j)
                        }
                    }

                    if (currOverlapIndexGroup.length > 0) {
                        // This proxy overlaps
                        currOverlapIndexGroup.push(i)
                        overlapIndexGroups.push(currOverlapIndexGroup)
                    }
                }
            }

            if (overlapIndexGroups.length <= 0) {
                // No more overlap, clustering is done
                break
            }

            if (this.clusteringCascading) {
                // Join groups containing at least 1 same index
                overlapIndexGroups = joinTransitiveGroups(overlapIndexGroups)
            }

            // Add cluster proxies
            for (let i = 0; i < overlapIndexGroups.length; i++) {
                // Add a cluster for each group
                const group = overlapIndexGroups[i]
                // Get all nodes of the current group
                const currGroupNodes = res.filter((_, index) => group.includes(index))

                // Calculate position to put cluster proxy at, e.g. average of this group's positions
                let numProxiesInCluster = 0
                let x = 0
                let y = 0
                let opacity = 1
                for (const { node, transform } of currGroupNodes) {
                    // Weigh coordinates by the number of proxies in the current proxy (which might be a cluster)
                    const numProxiesInCurr = (transform as any).numProxies ?? 1

                    numProxiesInCluster += numProxiesInCurr
                    x += transform.x * numProxiesInCurr
                    y += transform.y * numProxiesInCurr
                    if (this.clusterTransparent) {
                        opacity += ((node as any).opacity ?? 1) * numProxiesInCurr
                    }
                }
                x /= numProxiesInCluster
                y /= numProxiesInCluster
                if (this.clusterTransparent) {
                    // +1 since it starts at 1
                    opacity /= numProxiesInCluster + 1
                }

                // Cap opacity in [0,1]
                opacity = capNumber(opacity, 0, 1)
                // Make sure the calculated positions don't leave the canvas bounds
                ;({ x, y } = Canvas.capToCanvas({ x, y, width: size, height: size }, canvasCRF))

                // Also make sure the calculated positions are still capped to the border (no floating proxies)
                let floating = false
                if (
                    y > canvasCRF.y &&
                    y < canvasCRF.y + canvasCRF.height - size &&
                    (x > canvasCRF.x || x < canvasCRF.x + canvasCRF.width - size)
                ) {
                    x = x > (canvasCRF.width - size) / 2 ? canvasCRF.x + canvasCRF.width - size : canvasCRF.x
                    floating = true
                } else if (
                    x > canvasCRF.x &&
                    x < canvasCRF.x + canvasCRF.width - size &&
                    (y > canvasCRF.y || y < canvasCRF.y + canvasCRF.height - size)
                ) {
                    y = y > (canvasCRF.height - size) / 2 ? canvasCRF.y + canvasCRF.height - size : canvasCRF.y
                    floating = true
                }
                if (floating) {
                    // Readjust if it was previously floating
                    ;({ x, y } = Canvas.capToCanvas({ x, y, width: size, height: size }, canvasCRF))
                }

                const clusterNode = getClusterRendering(
                    `cluster-${clusterIDOffset + i}-proxy`,
                    numProxiesInCluster,
                    size,
                    x,
                    y,
                    opacity
                )
                res.push({
                    node: clusterNode || { opacity },
                    transform: {
                        x,
                        y,
                        scale: 1,
                        width: size,
                        height: size,
                        // Store the number of proxies in this cluster in case the cluster is clustered later on
                        numProxies: numProxiesInCluster,
                    } as any as TransformAttributes,
                })
            }

            // Filter all overlapping nodes
            // eslint-disable-next-line no-loop-func
            res = res.filter((_, index) => !anyContains(overlapIndexGroups, index))
            clusterIDOffset += overlapIndexGroups.length
        }

        return res
    }

    /** Routes edges from `onScreenNodes` to the corresponding proxies of `nodes`. */
    private routeEdges(
        nodes: { node: SKNode | VNode; transform: TransformAttributes }[],
        onScreenNodes: SKNode[],
        canvasCRF: Canvas,
        onePercentOffsetGRF: number,
        ctx: SKGraphModelRenderer
    ): {
        proxyEdges: { edge: SKEdge; transform: TransformAttributes }[]
        overlayEdges: { edge: SKEdge; transform: TransformAttributes }[]
    } {
        if (!(this.straightEdgeRoutingEnabled || this.alongBorderRoutingEnabled)) {
            // Don't create edge proxies
            return { proxyEdges: [], overlayEdges: [] }
        }

        // Reset opacity before changing it
        this.resetEdgeOpacity(this.prevModifiedEdges)
        const modifiedEdges = new Map()
        const proxyEdges = []
        const overlayEdges = []

        for (const { node, transform } of nodes) {
            if (node instanceof SKNode) {
                // Incoming edges
                for (const edge of node.incomingEdges as SKEdge[]) {
                    if (edge.routingPoints.length > 1 && onScreenNodes.some((node2) => node2.id === edge.sourceId)) {
                        // Only reroute actual edges with end at on-screen node
                        // Proxy is target, node is source
                        const proxyConnector = edge.routingPoints[edge.routingPoints.length - 1]
                        const nodeConnector = edge.routingPoints[0]
                        const proxyEdge = this.rerouteEdge(
                            node,
                            transform,
                            edge,
                            modifiedEdges,
                            nodeConnector,
                            proxyConnector,
                            false,
                            canvasCRF,
                            onePercentOffsetGRF,
                            ctx
                        )
                        if (proxyEdge) {
                            // Can't use transform for proxyEdge since it's already translated
                            proxyEdges.push(proxyEdge)
                            // Overlay original edge
                            overlayEdges.push(this.getOverlayEdge(edge, canvasCRF, ctx))
                        }
                    }
                }
                // Outgoing edges
                for (const edge of node.outgoingEdges as SKEdge[]) {
                    if (edge.routingPoints.length > 1 && onScreenNodes.some((node2) => node2.id === edge.targetId)) {
                        // Only reroute actual edges with start at on-screen node
                        // Proxy is source, node is target
                        const proxyConnector = edge.routingPoints[0]
                        const nodeConnector = edge.routingPoints[edge.routingPoints.length - 1]
                        const proxyEdge = this.rerouteEdge(
                            node,
                            transform,
                            edge,
                            modifiedEdges,
                            nodeConnector,
                            proxyConnector,
                            true,
                            canvasCRF,
                            onePercentOffsetGRF,
                            ctx
                        )
                        if (proxyEdge) {
                            // Can't use transform for proxyEdge since it's already translated
                            proxyEdges.push(proxyEdge)
                            // Overlay original edge
                            overlayEdges.push(this.getOverlayEdge(edge, canvasCRF, ctx))
                        }
                    }
                }
            }
        }

        // New modified edges
        this.prevModifiedEdges = modifiedEdges

        return { proxyEdges, overlayEdges }
    }

    /**
     * Returns an edge rerouted to the proxy.
     * `nodeConnector` and `proxyConnector` are the endpoints of the original edge.
     * @param `outgoing` Whether the edge is outgoing from the proxy.
     */
    private rerouteEdge(
        node: SKNode,
        transform: TransformAttributes,
        edge: SKEdge,
        modifiedEdges: Map<string, [SKEdge, number]>,
        nodeConnector: Point,
        proxyConnector: Point,
        outgoing: boolean,
        canvasCRF: Canvas,
        onePercentOffsetGRF: number,
        ctx: SKGraphModelRenderer
    ): { edge: SKEdge; transform: TransformAttributes } | undefined {
        // TODO: on spline renderings, always bundle the bend points together in pairs/3s, such that the edge remains smooth.
        // Connected to node, just calculate absolute coordinates + basic translation
        const parentPos = this.getAbsolutePosition(node.parent as SKNode)

        const parentTranslated = Canvas.translateToCRF(this.getAbsolutePosition(edge.parent as SKNode), canvasCRF)

        if (!this.edgesToOffScreenPoint && !Bounds.includes(canvasCRF, nodeConnector)) {
            // Would be connected to an off-screen point, don't show the edge
            return undefined
        }

        // Connected to proxy, use ratio to calculate where to connect to the proxy
        const proxyPointRelative = node.parentToLocal(proxyConnector)
        const proxyRatioX = proxyPointRelative.x / node.bounds.width
        const proxyRatioY = proxyPointRelative.y / node.bounds.height
        const proxyTranslatedRelative = {
            x: transform.x + transform.width * proxyRatioX,
            y: transform.y + transform.height * proxyRatioY,
        }
        // The GRF point where the proxy edge is connected to the proxy.
        const proxyConnectorGRF = Point.subtract(Canvas.translateToGRF(proxyTranslatedRelative, canvasCRF), parentPos)
        // The GRF bounds of the proxy.
        let proxyGRFRelToParent = Canvas.translateToGRF(transform, canvasCRF)
        proxyGRFRelToParent = {
            x: proxyGRFRelToParent.x - parentPos.x,
            y: proxyGRFRelToParent.y - parentPos.y,
            width: proxyGRFRelToParent.width,
            height: proxyGRFRelToParent.height,
        }

        // Keep direction of edge
        const source = outgoing ? proxyConnectorGRF : nodeConnector
        const target = outgoing ? nodeConnector : proxyConnectorGRF

        // Calculate all routing points
        const routingPoints: Point[] = []
        if (this.straightEdgeRoutingEnabled) {
            // Straight edge from source to target
            routingPoints.push(source, target)
        } else if (this.alongBorderRoutingEnabled) {
            // Potentially need more points than just source and target
            const canvasGRFRelToParent = Canvas.offsetCanvas(Canvas.translateCanvasToGRF(canvasCRF), {
                left: -parentPos.x,
                right: parentPos.x,
                top: -parentPos.y,
                bottom: parentPos.y,
            })

            const leftOffset = onePercentOffsetGRF
            const rightOffset = onePercentOffsetGRF
            const topOffset = onePercentOffsetGRF
            const bottomOffset = onePercentOffsetGRF
            const offsetRect = { left: leftOffset, right: rightOffset, top: topOffset, bottom: bottomOffset }

            // Canvas dimensions with offset, so as to keep the edge on the canvas
            const canvasOffLeft = canvasGRFRelToParent.x + leftOffset
            const canvasOffRight = canvasGRFRelToParent.x + canvasGRFRelToParent.width - rightOffset
            const canvasOffTop = canvasGRFRelToParent.y + topOffset
            const canvasOffBottom = canvasGRFRelToParent.y + canvasGRFRelToParent.height - bottomOffset
            const canvasOffset = Canvas.offsetCanvas(canvasGRFRelToParent, offsetRect)

            // Appends the point to routingPoints
            const add = (p: Point) => routingPoints.push(p)
            // Caps the point to the canvas
            const cap = (p: Point) =>
                // TODO: a GRF-compatible cap function would be nice here.
                Canvas.translateToGRF(
                    Canvas.capToCanvas(Canvas.translateToCRF(p, canvasCRF), Canvas.translateCanvasToCRF(canvasOffset)),
                    canvasCRF
                )

            // Composition add o cap
            const addCap = (p: Point) => add(cap(p))

            // Returns true if the point is inside the proxy
            // Add a little padding (just one pixel) to the proxy bounds, so that rounding errors do not cause additional/flickering routing points.
            const proxyEdgePadding = 1
            const proxyGRFRelToParentWithPadding = {
                x: proxyGRFRelToParent.x - proxyEdgePadding,
                y: proxyGRFRelToParent.y - proxyEdgePadding,
                width: proxyGRFRelToParent.width + 2 * proxyEdgePadding,
                height: proxyGRFRelToParent.height + 2 * proxyEdgePadding,
            }
            const outsideProxy = (p: Point) => !Bounds.includes(proxyGRFRelToParentWithPadding, p)

            if (this.simpleAlongBorderRouting) {
                // Just cap each routing point to the canvas, can cause strange artifacts if an edge e.g. oscillates
                edge.routingPoints
                    // Cap to canvas
                    .map(cap)
                    // Don't add points that are inside the proxy
                    .filter(outsideProxy)
                    // Cap to canvas and add to routingPoints
                    .forEach(add)
            } else {
                /// / Calculate point where edge leaves canvas
                let prevPoint: Point = source
                let canvasEdgeIntersection: Point | undefined
                for (let i = 0; i < edge.routingPoints.length; i++) {
                    // Check if p is off-screen to find intersection between (prevPoint to p) and canvas
                    // Traverse routingPoints from the end for outgoing edges to match with prevPoint
                    const p = edge.routingPoints[i]

                    const intersection = getIntersection(prevPoint, p, canvasGRFRelToParent)
                    if (intersection) {
                        // Found an intersection
                        canvasEdgeIntersection = intersection
                        if (outsideProxy(canvasEdgeIntersection)) {
                            // Don't add a point inside of the proxy
                            addCap(canvasEdgeIntersection)
                        }
                    }

                    // Add p to keep routing points consistent
                    prevPoint = p
                    if (Bounds.includes(canvasGRFRelToParent, p) && outsideProxy(p)) {
                        // Don't add a point that is off-screen or inside the proxy
                        add(p)
                    }
                }

                if (!canvasEdgeIntersection) {
                    // Should never be the case since one node has to be off-screen for a proxy to be created
                    // Therefore the edge must intersect with the canvas
                    return undefined
                }

                /// / Calculate points on path to proxy near canvas
                const preferLeft = proxyConnectorGRF.x < (canvasOffLeft + canvasOffRight) / 2
                const preferTop = proxyConnectorGRF.y < (canvasOffTop + canvasOffBottom) / 2
                const borderPoints = Canvas.routeAlongBorder(
                    canvasEdgeIntersection,
                    canvasOffset,
                    transform,
                    canvasGRFRelToParent,
                    preferLeft,
                    preferTop
                )
                // Remove points inside of proxy and add remaining
                borderPoints.filter(outsideProxy).forEach(addCap)
            }

            /// / Finally, add source at its correct spot
            // Avoid duplicate source/target points.
            if (routingPoints[0] !== source) {
                routingPoints.unshift(source)
            }
            if (routingPoints[routingPoints.length - 1] !== target) {
                routingPoints.push(target)
            }
        } else {
            // Should never be the case, must be called with a routing strategy enabled
            return undefined
        }

        // Clone the edge so as to not change the real one
        const clone = Object.create(edge) as SKEdge
        // Set attributes
        clone.routingPoints = routingPoints
        clone.junctionPoints = []
        clone.id += '-rerouted'
        clone.data = this.placeDecorator(
            edge.data,
            ctx,
            routingPoints[routingPoints.length - 2],
            routingPoints[routingPoints.length - 1]
        )
        clone.opacity = node.opacity

        if (this.transparentEdges) {
            // Fade out the original edge and store its previous opacity
            const id = getProxyId(edge.id)
            modifiedEdges.set(id, [edge, edge.opacity])
            edge.opacity = 0
        }

        return { edge: clone, transform: { ...parentTranslated, scale: canvasCRF.zoom } }
    }

    /** Returns an edge that can be overlayed over the given `edge` to simulate a fade-out effect. */
    private getOverlayEdge(
        edge: SKEdge,
        canvas: Canvas,
        ctx: SKGraphModelRenderer
    ): { edge: SKEdge; transform: TransformAttributes } {
        // Color/opacity for fade out effect
        const color = { red: 255, green: 255, blue: 255 }
        const opacity = 0.8

        const parentTranslated = Canvas.translateToCRF(this.getAbsolutePosition(edge.parent as SKNode), canvas)
        const overlay = Object.create(edge) as SKEdge
        overlay.id += '-overlay'
        overlay.opacity = opacity
        overlay.data = this.changeColor(overlay.data, ctx, color)
        return { edge: overlay, transform: { ...parentTranslated, scale: canvas.zoom } }
    }

    /** Connects off-screen edges. */
    private connectEdgeSegments(
        root: SKNode,
        canvasGRF: Canvas,
        onePercentOffsetGRF: number,
        ctx: SKGraphModelRenderer
    ): {
        proxyEdges: { edge: SKEdge; transform: TransformAttributes }[]
        overlayEdges: { edge: SKEdge; transform: TransformAttributes }[]
    } {
        if (!this.segmentProxiesEnabled) {
            return { proxyEdges: [], overlayEdges: [] }
        }

        const offsetRect = {
            left: onePercentOffsetGRF,
            right: onePercentOffsetGRF,
            top: onePercentOffsetGRF,
            bottom: onePercentOffsetGRF,
        }
        const canvasOffset = Canvas.offsetCanvas(canvasGRF, offsetRect)
        const proxyEdges = []
        const overlayEdges = []
        // Get all edges that are partially off-screen
        const partiallyOffScreenEdges = this.getPartiallyOffScreenEdges(root, canvasOffset)
        // Connect intersections with canvas
        for (const edge of partiallyOffScreenEdges) {
            const parentPos = this.getAbsolutePosition(edge.parent as SKNode)

            // Find all intersections
            let prevPoint = Point.add(parentPos, edge.routingPoints[0])
            const canvasEdgeIntersections = []
            for (let i = 1; i < edge.routingPoints.length; i++) {
                const p = Point.add(parentPos, edge.routingPoints[i])
                const intersection = getIntersection(prevPoint, p, canvasOffset)
                if (intersection) {
                    // Found an intersection
                    canvasEdgeIntersections.push({
                        intersection,
                        fromOnScreen: Bounds.includes(canvasOffset, prevPoint),
                        index: i - 1,
                    })
                }
                prevPoint = p
            }

            if (canvasEdgeIntersections.length < 2) {
                // Not enoug intersections to form a connection
                continue
            }

            // Make sure to only connect on-screen to off-screen to on-screen (on-off-on) intersections, not off-on-off
            const routingPointIndices = []
            let {
                intersection: prevIntersection,
                fromOnScreen: prevFromOnScreen,
                index: prevIndex,
            } = canvasEdgeIntersections[0]
            for (let i = 1; i < canvasEdgeIntersections.length; i++) {
                const { intersection, fromOnScreen, index } = canvasEdgeIntersections[i]
                if (prevFromOnScreen) {
                    // Can safely be connected, therefore store routing point indices and path along border between intersections
                    const ps = Canvas.routeAlongBorder(prevIntersection, canvasOffset, intersection, canvasOffset)
                    ps.unshift(prevIntersection)
                    ps.push(intersection)
                    routingPointIndices.push({ to: prevIndex, from: index, ps })
                }
                prevIntersection = intersection
                prevFromOnScreen = fromOnScreen
                prevIndex = index
            }

            // Finally, reconstruct the original path with the connecting points
            if (routingPointIndices.length > 0) {
                const segmentConnector = Object.create(edge) as SKEdge
                segmentConnector.id += '-segmentConnector'
                const routingPoints = []

                let prevFrom = 0
                for (const { to, from, ps } of routingPointIndices) {
                    // Add points from previous intersection up to current one
                    routingPoints.push(...segmentConnector.routingPoints.slice(prevFrom, to + 1))

                    // Add intersection path, e.g. the segment connector
                    routingPoints.push(...ps.map((p) => Point.subtract(p, parentPos)))

                    prevFrom = from + 1
                }
                // Add last couple points
                routingPoints.push(
                    ...segmentConnector.routingPoints.slice(prevFrom, segmentConnector.routingPoints.length)
                )

                segmentConnector.routingPoints = routingPoints
                proxyEdges.push({
                    edge: segmentConnector,
                    transform: { ...Canvas.translateToCRF(parentPos, canvasGRF), scale: canvasGRF.zoom },
                })

                // Remember to fade out original edge
                overlayEdges.push(this.getOverlayEdge(edge, canvasGRF, ctx))
            }
        }

        return { proxyEdges, overlayEdges }
    }

    /** Returns all edges that are both on- & off-screen. */
    private getPartiallyOffScreenEdges(currRoot: SKNode, canvas: Canvas): SKEdge[] {
        // For each edge check if it's partially off-screen
        const partiallyOffScreenEdges = []
        const pos = this.getAbsolutePosition(currRoot)

        // Can just use this one loop since both edges and nodes are present in children
        for (const child of currRoot.children) {
            if (child instanceof SKEdge) {
                // Check if it's on- & off-screen
                let offScreen = false
                let onScreen = false
                for (let p of child.routingPoints) {
                    p = Point.add(pos, p)
                    if (Bounds.includes(canvas, p)) {
                        onScreen = true
                    } else {
                        offScreen = true
                    }

                    if (onScreen && offScreen) {
                        partiallyOffScreenEdges.push(child)
                        break
                    }
                }
            } else if (child instanceof SKNode) {
                // Recursively check its children
                partiallyOffScreenEdges.push(...this.getPartiallyOffScreenEdges(child, canvas))
            }
        }

        return partiallyOffScreenEdges
    }

    /** Returns the proxy rendering for an off-screen node. */
    private createProxy(
        node: SKNode | VNode,
        transform: TransformAttributes,
        canvasGRF: Canvas,
        ctx: SKGraphModelRenderer
    ): VNode | undefined {
        if (!(node instanceof SKNode)) {
            // VNode, this is a predefined rendering (e.g. cluster)
            updateTransform(node, transform)
            return node
        }
        if (node.opacity <= 0) {
            // Don't render invisible nodes
            return undefined
        }

        // Check if this node's proxy should be highlighted
        const highlight = node.selected || (this.highlightSelected && isSelectedOrConnectedToSelected(node))
        const { opacity } = node

        // Get VNode
        const id = getProxyId(node.id)
        let vnode = this.renderings.get(id)
        if (!vnode || vnode.selected !== highlight) {
            // Node hasn't been rendered yet (cache empty for this node) or the attributes don't match

            // Change its id to differ from the original node
            node.id = id
            // Clear children, proxies don't show nested nodes (but keep labels)
            node.children = node.children.filter((theNode) => theNode instanceof SKLabel)
            const scale = transform.scale ?? 1
            // Add the proxy's scale to the data
            node.data = this.getNodeData(node.data, scale)
            // Proxies should never appear to be selected (even if their on-screen counterpart is selected)
            // unless highlighting is enabled
            node.selected = highlight
            // Render this node as opaque to change opacity later on
            node.opacity = 1

            vnode = ctx.forceRenderElement(node)
            if (vnode) {
                // New rendering, set ProxyVNode attributes
                vnode.selected = highlight
                ;(vnode as ProxyVNode).proxy = true
                // Add usual mouse interaction
                this.addMouseInteraction(vnode, node)
            }
        }

        if (vnode) {
            // Store this node
            this.renderings.set(id, vnode)
            // Place proxy at the calculated position
            updateTransform(vnode, transform)
            // Update its opacity
            updateOpacity(vnode, opacity)
            // Update whether it should be click-through
            updateClickThrough(vnode, !this.interactiveProxiesEnabled || this.clickThrough)
        }

        return vnode
    }

    /** Let the mouseTool decorate this proxy rendering to activate all KLighD- and Proxy-specific mouse interactions. */
    addMouseInteraction(vnode: ProxyVNode, element: SKNode): VNode {
        if (isThunk(vnode)) {
            return vnode
        }
        return this.mouseTool.decorate(vnode, element)
    }

    /** Returns the proxy rendering for an edge. */
    private createEdgeProxy(
        edge: SKEdge,
        transform: TransformAttributes,
        ctx: SKGraphModelRenderer
    ): VNode | undefined {
        if (edge.opacity <= 0) {
            // Don't draw an invisible edge
            return undefined
        }

        // Change its id to differ from the original edge
        /*
        If ids aren't unique (e.g. by the same edge being drawn twice), errors like
        - "TypeError: Cannot read property 'removeChild' of null"
        - "DOMException: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
        - "TypeError: Cannot read property 'sel' of undefined"
        can occur
        */
        edge.id = getProxyId(edge.id)
        // Clear children to remove label decorators,
        // use assign() since children is readonly for SKEdges (but not for SKNodes)
        Object.assign(edge, { children: [] })

        const vnode = ctx.forceRenderElement(edge)

        if (vnode) {
            updateTransform(vnode, transform)
        }

        return vnode
    }

    /// ///// General helper methods ////////

    /** Returns whether the given `node` is valid for rendering. */
    private canRenderNode(node: SKNode): boolean {
        // Specified by rendering, otherwise all nodes should be rendered
        return (
            !this.useSynthesisProxyRendering ||
            ((node.properties[ProxyView.RENDER_NODE_AS_PROXY_PROPERTY] as boolean) ?? true)
        )
    }

    /**
     * Calculates the TransformAttributes for this node's proxy, e.g. the position to place the proxy at aswell as its scale and bounds.
     * Note that the position is pre-scaling. To get position post-scaling, divide `x` and `y` by `scale`.
     */
    private getTransform(node: SKNode, desiredSize: number, proxyBounds: Bounds, canvas: Canvas): TransformAttributes {
        // Calculate the scale and the resulting proxy dimensions
        // The scale is calculated such that width & height are capped to a max value
        const proxyWidthScale = desiredSize / proxyBounds.width
        const proxyHeightScale = desiredSize / proxyBounds.height
        let scale = this.originalNodeScale ? canvas.zoom : Math.min(proxyWidthScale, proxyHeightScale)
        scale = this.capScaleToOne ? Math.min(1, scale) : scale
        const proxyWidth = proxyBounds.width * scale
        const proxyHeight = proxyBounds.height * scale

        // Center at middle of node
        const translated = this.getTranslatedNodeBounds(node, canvas)
        const offsetX = 0.5 * (translated.width - proxyWidth)
        const offsetY = 0.5 * (translated.height - proxyHeight)
        let x = translated.x + offsetX
        let y = translated.y + offsetY

        // Cap proxy to canvas
        ;({ x, y } = Canvas.capToCanvas({ x, y, width: proxyWidth, height: proxyHeight }, canvas))

        if (this.capProxyToParent && node.parent && node.parent.id !== '$root') {
            const translatedParent = this.getTranslatedNodeBounds(node.parent as SKNode, canvas)
            x = capNumber(x, translatedParent.x, translatedParent.x + translatedParent.width - proxyWidth)
            y = capNumber(y, translatedParent.y, translatedParent.y + translatedParent.height - proxyHeight)
        }

        return { x, y, scale, width: proxyWidth, height: proxyHeight }
    }

    /**
     * Returns the translated bounds for the given `node`.
     * @see {@link Canvas.translateToCRF()}
     */
    private getTranslatedNodeBounds(node: SKNode, canvas: Canvas): Bounds {
        const absoluteBounds = this.getAbsoluteBounds(node)
        return Canvas.translateToCRF(absoluteBounds, canvas)
    }

    /** Returns the `node`'s bounds with the absolute position. Positions are stored in {@link positions}. */
    private getAbsoluteBounds(node: SKNode): Bounds {
        return { ...node.bounds, ...this.getAbsolutePosition(node) }
    }

    /** Recursively calculates the positions of this node and all of its predecessors and stores them in {@link positions}. */
    private getAbsolutePosition(node: SKNode | SKEdge | SKPort | SKLabel): Point {
        if (!node) {
            return { x: 0, y: 0 }
        }

        // This node might not be a proxy, make sure to store the right id
        const id = getProxyId(node.id)
        let point = this.positions.get(id)
        if (!point) {
            // Point hasn't been stored yet, get parent position
            point = this.getAbsolutePosition(node.parent as SKNode | SKEdge | SKPort | SKLabel)
            point = Point.add(point, node.bounds)

            // Also store this point
            this.positions.set(id, point)
        }
        return point
    }

    /**
     * Returns the distance between the node and the canvas and stores them in {@link distances}.
     * @see {@link getDistanceToCanvas()}
     */
    private getNodeDistanceToCanvas(node: SKNode, canvas: Canvas): number {
        const id = getProxyId(node.id)
        let dist = this.distances.get(id)
        if (dist) {
            // Cached
            return dist
        }

        // Calculate distance
        const b = this.getAbsoluteBounds(node)
        dist = Canvas.distance(b, canvas)
        this.distances.set(id, dist)

        return dist
    }

    /** Transforms the KGraphData[] to ProxyKGraphData[], e.g. adds the proxyScale attribute to each data. */
    private getNodeData(data: KGraphData[], scale: number): ProxyKGraphData[] {
        if (!data) {
            return data
        }

        const res = []
        for (const d of data) {
            // Add the proxyScale
            const dClone = { ...d, proxyScale: scale, useTitleScaling: this.titleScalingEnabled }
            if ('children' in dClone) {
                // Has children, keep going
                ;(dClone as any).children = this.getNodeData((dClone as any).children, scale)
            }
            res.push(dClone)
        }
        return res
    }

    // TODO: The edge start/end decorators should be shown, regardless of the rendering type. This needs to differentiate between head/tail decorators and other decorators such as bend points.
    // Plan: head decorators are those with relative position = 1, tail decorators are those with relative position = 0 and should be repositioned if necessary, all other relative positions between 0 and 1 should be kept as is.
    // To do this, this really should incorporate the decoration / placement data of the decorators, which is currently not sent to the client or handled here.
    // For now I'll leave this as this hacky solution, which just takes the first polygon rendering and places it at the end of the edge.
    // When we have micro layout on the client, this should be done properly.

    /** Returns a copy of `edgeData` with the decorators placed at `target`, angled from `prev` to `target`. */
    private placeDecorator(
        edgeData: KGraphData[],
        ctx: SKGraphModelRenderer,
        prev: Point,
        target: Point
    ): KGraphData[] {
        if (!edgeData || edgeData.length <= 0) {
            return edgeData
        }
        const data = getKRendering(edgeData, ctx)
        if (!data) {
            return edgeData
        }

        const res = []
        const clone = { ...data } as any
        const props = { ...clone.properties }
        clone.properties = props

        const id = props['klighd.lsp.rendering.id']
        const proxyId = getProxyId(id)
        if (ctx.decorationMap) {
            if (props['klighd.lsp.calculated.decoration']) {
                props['klighd.lsp.rendering.id'] = proxyId
                ctx.decorationMap[proxyId] = props['klighd.lsp.calculated.decoration']
            } else if (ctx.decorationMap[id]) {
                props['klighd.lsp.rendering.id'] = proxyId
                ctx.decorationMap[proxyId] = ctx.decorationMap[id]
            }
        }

        if (clone.type === K_POLYGON) {
            // Arrow head
            const angle = angleOfPoint(Point.subtract(target, prev))
            if (props['klighd.lsp.calculated.decoration']) {
                // Move arrow head if actually defined
                props['klighd.lsp.calculated.decoration'] = {
                    ...props['klighd.lsp.calculated.decoration'],
                    origin: target,
                    rotation: angle,
                }
            } else if (ctx.decorationMap && ctx.decorationMap[id]) {
                // Arrow head was in rendering refs
                props['klighd.lsp.calculated.decoration'] = {
                    ...(ctx.decorationMap[id] as any),
                    origin: target,
                    rotation: angle,
                }
            } else {
                // Better not to show arrow head as it would be floating around somewhere
                return []
            }
        }

        if ('children' in clone) {
            // Keep going recursively
            ;(clone as any).children = this.placeDecorator((clone as any).children, ctx, prev, target)
        }

        res.push(clone)
        return res
    }

    /** Returns a copy of `edgeData` with the colors changed to `color`. */
    private changeColor(
        edgeData: KGraphData[],
        ctx: SKGraphModelRenderer,
        color: { red: number; green: number; blue: number }
    ): KGraphData[] {
        if (!edgeData || edgeData.length <= 0) {
            return edgeData
        }
        const data = getKRendering(edgeData, ctx)
        if (!data) {
            return edgeData
        }

        const res = []
        const clone = { ...data } as any
        const props = { ...clone.properties }
        const styles = [...clone.styles]
        clone.properties = props
        clone.styles = styles

        const id = props['klighd.lsp.rendering.id']
        if (ctx.decorationMap && ctx.decorationMap[id]) {
            // Dereference calculated decoration
            props['klighd.lsp.rendering.id'] = getProxyId(id)
            props['klighd.lsp.calculated.decoration'] = ctx.decorationMap[id]
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const i in styles) {
            if ([K_FOREGROUND, K_BACKGROUND].includes(styles[i].type)) {
                // Change color
                styles[i] = { ...styles[i], color }
            }
        }
        styles.push({ color, type: K_FOREGROUND, selection: false })
        styles.push({ color, type: K_BACKGROUND, selection: false })
        styles.push({ color, type: K_FOREGROUND, selection: true })
        styles.push({ color, type: K_BACKGROUND, selection: true })

        if (isContainerRendering(clone)) {
            // Keep going recursively
            ;(clone as any).children = this.changeColor((clone as any).children, ctx, color)
        }

        if (isPolyline(clone) && clone.junctionPointRendering !== undefined) {
            // Keep going recursively
            // eslint-disable-next-line prefer-destructuring
            ;(clone as any).junctionPointRendering = this.changeColor(
                [(clone as any).junctionPointRendering],
                ctx,
                color
            )[0]
        }

        res.push(clone)
        return res
    }

    /**
     * Resets the opacity of the given edges.
     * @param modifiedEdges The map containing the edges to reset the opacity for.
     */
    private resetEdgeOpacity(modifiedEdges: Map<any, [SKEdge, number]>): void {
        for (const [edge, opacity] of Array.from(modifiedEdges.values())) {
            edge.opacity = opacity
        }
    }

    /// ///// Misc public methods ////////

    /** Called on mouse down, used for making proxies click-through. */
    setMouseDown(event: MouseEvent): void {
        // Check if the user started the click on a proxy, if not, make click-through
        this.clickThrough = !this.currProxies.some(({ transform }) => Bounds.includes(transform, event))
    }

    /** Called on mouse up, used for making proxies click-through. */
    setMouseUp(): void {
        // Upon release, proxies shouldn't be click-through
        this.clickThrough = false
        this.currProxies.forEach(({ proxy }) => updateClickThrough(proxy, !this.interactiveProxiesEnabled))
    }

    /** Updates the proxy-view options specified in the {@link RenderOptionsRegistry}. */
    updateOptions(renderOptionsRegistry: RenderOptionsRegistry): void {
        this.prevProxyViewEnabled = this.proxyViewEnabled
        this.proxyViewEnabled = renderOptionsRegistry.getValue(ProxyViewEnabled)

        const fromPercent = 0.01
        this.sizePercentage = renderOptionsRegistry.getValue(ProxyViewSize) * fromPercent

        switch (renderOptionsRegistry.getValue(ProxyViewDecreaseProxyClutter)) {
            case ProxyViewDecreaseProxyClutter.CHOICE_OFF:
                this.clusteringEnabled = false
                this.opacityByDistanceEnabled = false
                break
            case ProxyViewDecreaseProxyClutter.CHOICE_CLUSTERING:
                this.clusteringEnabled = true
                this.opacityByDistanceEnabled = false
                break
            case ProxyViewDecreaseProxyClutter.CHOICE_OPACITY:
                this.clusteringEnabled = false
                this.opacityByDistanceEnabled = true
                break
            default:
                console.error('unexpected case for ProxyViewDecreaseProxyClutter in proxy-view.')
        }

        switch (renderOptionsRegistry.getValue(ProxyViewEnableEdgeProxies)) {
            case ProxyViewEnableEdgeProxies.CHOICE_OFF:
                this.straightEdgeRoutingEnabled = false
                this.alongBorderRoutingEnabled = false
                break
            case ProxyViewEnableEdgeProxies.CHOICE_STRAIGHT_EDGE_ROUTING:
                this.straightEdgeRoutingEnabled = true
                this.alongBorderRoutingEnabled = false
                break
            case ProxyViewEnableEdgeProxies.CHOICE_ALONG_BORDER_ROUTING:
                this.straightEdgeRoutingEnabled = false
                this.alongBorderRoutingEnabled = true
                break
            default:
                console.error('unexpected case for ProxyViewEnableEdgeProxies in proxy-view.')
        }

        this.segmentProxiesEnabled = renderOptionsRegistry.getValue(ProxyViewEnableSegmentProxies)

        this.interactiveProxiesEnabled = renderOptionsRegistry.getValue(ProxyViewInteractiveProxies)

        this.titleScalingEnabled = renderOptionsRegistry.getValue(ProxyViewTitleScaling)

        // Debug
        this.highlightSelected = renderOptionsRegistry.getValue(ProxyViewHighlightSelected)
        this.opacityBySelected = renderOptionsRegistry.getValue(ProxyViewOpacityBySelected)

        const useSynthesisProxyRendering = renderOptionsRegistry.getValue(ProxyViewUseSynthesisProxyRendering)
        if (this.useSynthesisProxyRendering !== useSynthesisProxyRendering) {
            // Make sure not to use the wrong renderings if changed
            this.clearRenderings()
        }
        this.useSynthesisProxyRendering = useSynthesisProxyRendering

        this.simpleAlongBorderRouting = renderOptionsRegistry.getValue(ProxyViewSimpleAlongBorderRouting)

        this.capProxyToParent = renderOptionsRegistry.getValue(ProxyViewCapProxyToParent)
        this.showProxiesImmediately = renderOptionsRegistry.getValue(ProxyViewShowProxiesImmediately)
        this.showProxiesEarly = renderOptionsRegistry.getValue(ProxyViewShowProxiesEarly)
        this.showProxiesEarlyNumber = renderOptionsRegistry.getValue(ProxyViewShowProxiesEarlyNumber)

        this.stackingOrderByDistance = renderOptionsRegistry.getValue(ProxyViewStackingOrderByDistance)
        this.stackingOrderByOpacity = renderOptionsRegistry.getValue(ProxyViewStackingOrderByOpacity)
        this.stackingOrderBySelected = renderOptionsRegistry.getValue(ProxyViewStackingOrderBySelected)

        this.useDetailLevel = renderOptionsRegistry.getValue(ProxyViewUseDetailLevel)

        this.edgesAboveNodes = renderOptionsRegistry.getValue(ProxyViewDrawEdgesAboveNodes)
        this.edgesToOffScreenPoint = renderOptionsRegistry.getValue(ProxyViewEdgesToOffScreenPoint)
        this.transparentEdges = renderOptionsRegistry.getValue(ProxyViewTransparentEdges)
        if (!this.transparentEdges && this.prevModifiedEdges.size > 0) {
            // Reset opacity of all edges
            this.resetEdgeOpacity(this.prevModifiedEdges)
            this.prevModifiedEdges.clear()
        }

        this.originalNodeScale = renderOptionsRegistry.getValue(ProxyViewOriginalNodeScale)
        this.capScaleToOne = renderOptionsRegistry.getValue(ProxyViewCapScaleToOne)

        this.clusterTransparent = renderOptionsRegistry.getValue(ProxyViewClusterTransparent)
        this.clusteringCascading = renderOptionsRegistry.getValue(ProxyViewClusteringCascading)
        this.clusteringSweepLine = renderOptionsRegistry.getValue(ProxyViewClusteringSweepLine)
    }

    /**
     * Registers all given `filters` to be evaluated before showing a proxy.
     *
     * Try ordering the given filters by strongest filter criterion first,
     * secondary ordering by simplicity/cost of check. This ensures:
     * - proxies being filtered out early, therefore reducing the number of filters
     * that need to be evaluated
     * - less costly filters being applied first, potentially avoiding more expensive ones
     */
    registerFilters(...filters: ProxyFilterAndID[]): void {
        filters.forEach(({ id, filter }) => this.filters.set(id, filter))
    }

    /** Unregisters all given `filters`. */
    unregisterFilters(...filters: ProxyFilterAndID[]): boolean {
        return filters.every(({ id }) => this.filters.delete(id))
    }

    /** Resets the proxy-view, i.e. when the model is updated. */
    reset(): void {
        this.clearPositions()
        this.clearRenderings()
        this.clearDistances()
    }

    /** Clears the {@link renderings} map. */
    clearRenderings(): void {
        this.renderings.clear()
    }

    /** Clears the {@link positions} map. */
    clearPositions(): void {
        this.positions.clear()
    }

    /** Clears the {@link distances} map. */
    clearDistances(): void {
        this.distances.clear()
    }
}
