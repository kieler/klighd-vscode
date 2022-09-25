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

import { Range, RangeOption, RenderOption, TransformationOptionType } from "../options/option-models";

/**
 * Final options should be:
 * 
 * Enable Proxy-View
 *   true/false
 * Size of Proxies in %
 *   range
 * Decrease Proxy Clutter
 *   Off
 *   Clustering
 *   Opacity + Stacking Order (Transparency by Distance)
 * Enable Edge-Proxies
 *   Off
 *   Straight-Edge-Routing
 *   Along-Border-Routing
 * Enable Segment Proxies
 *   true/false
 * Interactive Proxies ({@link ProxyViewInteractiveProxies})
 *   true/false
 * Scale Proxy Titles
 *   true/false
 * 
 * Filters (...)
 * 
 * Debug
 */

/** The category containing proxy-view options. */
export class ProxyViewCategory implements RenderOption {
    static readonly ID: string = "proxy-view-category";
    static readonly NAME: string = "Proxy-View Options";
    static readonly INSTANCE: ProxyViewCategory = new ProxyViewCategory;
    readonly id: string = ProxyViewCategory.ID;
    readonly name: string = ProxyViewCategory.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CATEGORY;
    readonly initialValue: any;
    currentValue: any;
}

/** Whether the proxy-view is enabled. */
export class ProxyViewEnabled implements RenderOption {
    static readonly ID: string = "proxy-view-enabled";
    static readonly NAME: string = "Enable Proxy-View";
    static readonly DESCRIPTION: string = "Whether the Proxy-View is enabled.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewEnabled.ID;
    readonly name: string = ProxyViewEnabled.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewEnabled.DEFAULT;
    readonly description: string = ProxyViewEnabled.DESCRIPTION;
    readonly renderCategory: string = ProxyViewCategory.ID;
    currentValue = ProxyViewEnabled.DEFAULT;
}

/** Part of calculating the proxies' size. */
export class ProxyViewSize implements RangeOption {
    static readonly ID: string = "proxy-view-size";
    static readonly NAME: string = "Size of Proxies in %";
    static readonly DESCRIPTION: string = "Percentage to which the proxies are scaled regarding the minimum of the canvas' height and width.";
    static readonly DEFAULT: number = 8;
    static readonly RANGE: Range = { first: 1, second: 25 };
    static readonly STEPSIZE: number = 1;
    readonly id: string = ProxyViewSize.ID;
    readonly name: string = ProxyViewSize.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.RANGE;
    readonly initialValue: number = ProxyViewSize.DEFAULT;
    readonly description: string = ProxyViewSize.DESCRIPTION;
    readonly renderCategory: string = ProxyViewCategory.ID;
    readonly range: Range = ProxyViewSize.RANGE;
    readonly stepSize: number = ProxyViewSize.STEPSIZE;
    readonly values: any[] = [];
    currentValue = ProxyViewSize.DEFAULT;
}

/**
 * What strategy to use to decrease proxy clutter.
 * Clustering clusters overlapping proxies into a single cluster.
 * Opacity by Distance increases transparency for distant proxies.
 */
export class ProxyViewDecreaseProxyClutter implements RenderOption {
    static readonly ID: string = "proxy-view-decrease-proxy-clutter";
    static readonly NAME: string = "Decrease Proxy Clutter";
    static readonly DESCRIPTION: string =
        "What strategy to use to decrease proxy clutter. " +
        "Clustering clusters overlapping proxies into a single cluster. " +
        "Opacity by Distance increases transparency for distant proxies.";
    static readonly CHOICE_OFF: string = "Off";
    static readonly CHOICE_CLUSTERING: string = "Clustering";
    static readonly CHOICE_OPACITY: string = "Opacity by Distance";
    static readonly DEFAULT: string = ProxyViewDecreaseProxyClutter.CHOICE_OPACITY;
    static readonly CHOICES: string[] = [
        ProxyViewDecreaseProxyClutter.CHOICE_OFF,
        ProxyViewDecreaseProxyClutter.CHOICE_CLUSTERING,
        ProxyViewDecreaseProxyClutter.CHOICE_OPACITY
    ];
    readonly id: string = ProxyViewDecreaseProxyClutter.ID;
    readonly name: string = ProxyViewDecreaseProxyClutter.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHOICE;
    readonly initialValue: string = ProxyViewDecreaseProxyClutter.DEFAULT;
    readonly description: string = ProxyViewDecreaseProxyClutter.DESCRIPTION;
    readonly renderCategory: string = ProxyViewCategory.ID;
    readonly values: string[] = ProxyViewDecreaseProxyClutter.CHOICES;
    currentValue = ProxyViewDecreaseProxyClutter.DEFAULT;
}

/**
 * What strategy to use for routing edge proxies, if enabled.
 * Edge proxies connect on-screen nodes with proxies instead of their off-screen counterparts.
 * Straight-Edge-Routing draws a straight line between node and proxy.
 * Along-Border-Routing reuses most of the original edge's path and routes the remaining path to the proxy along the border.
 */
export class ProxyViewEnableEdgeProxies implements RenderOption {
    static readonly ID: string = "proxy-view-enable-edge-proxies";
    static readonly NAME: string = "Enable Edge Proxies";
    static readonly DESCRIPTION: string =
        "What strategy to use for routing edge proxies, if enabled. " +
        "Edge proxies connect on-screen nodes with proxies instead of their off-screen counterparts. " +
        "Straight-Edge-Routing draws a straight line between node and proxy. " +
        "Along-Border-Routing reuses most of the original edge's path and routes the remaining path to the proxy along the border.";
    static readonly CHOICE_OFF: string = "Off";
    static readonly CHOICE_STRAIGHT_EDGE_ROUTING: string = "Straight-Edge-Routing";
    static readonly CHOICE_ALONG_BORDER_ROUTING: string = "Along-Border-Routing";
    static readonly DEFAULT: string = ProxyViewEnableEdgeProxies.CHOICE_OFF;
    static readonly CHOICES: string[] = [
        ProxyViewEnableEdgeProxies.CHOICE_OFF,
        ProxyViewEnableEdgeProxies.CHOICE_STRAIGHT_EDGE_ROUTING,
        ProxyViewEnableEdgeProxies.CHOICE_ALONG_BORDER_ROUTING
    ];
    readonly id: string = ProxyViewEnableEdgeProxies.ID;
    readonly name: string = ProxyViewEnableEdgeProxies.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHOICE;
    readonly initialValue: string = ProxyViewEnableEdgeProxies.DEFAULT;
    readonly description: string = ProxyViewEnableEdgeProxies.DESCRIPTION;
    readonly renderCategory: string = ProxyViewCategory.ID;
    readonly values: string[] = ProxyViewEnableEdgeProxies.CHOICES;
    currentValue = ProxyViewEnableEdgeProxies.DEFAULT;
}

/**
 * Whether segment proxies should be created.
 * Segment proxies connect off-screen segments of an edge.
 */
export class ProxyViewEnableSegmentProxies implements RenderOption {
    static readonly ID: string = "proxy-view-enable-segment-proxies";
    static readonly NAME: string = "Enable Segment Proxies";
    static readonly DESCRIPTION: string =
        "Whether segment proxies should be created. " +
        "Segment proxies connect off-screen segments of an edge.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewEnableSegmentProxies.ID;
    readonly name: string = ProxyViewEnableSegmentProxies.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewEnableSegmentProxies.DEFAULT;
    readonly description: string = ProxyViewEnableSegmentProxies.DESCRIPTION;
    readonly renderCategory: string = ProxyViewCategory.ID;
    currentValue = ProxyViewEnableSegmentProxies.DEFAULT;
}

/** Whether proxies should be interactable. */
export class ProxyViewInteractiveProxies implements RenderOption {
    static readonly ID: string = "proxy-view-interactive-proxies";
    static readonly NAME: string = "Interactive Proxies";
    static readonly DESCRIPTION: string = "Whether proxies should be interactable. Clicking on a proxy hops to its off-screen counterpart.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewInteractiveProxies.ID;
    readonly name: string = ProxyViewInteractiveProxies.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewInteractiveProxies.DEFAULT;
    readonly description: string = ProxyViewInteractiveProxies.DESCRIPTION;
    readonly renderCategory: string = ProxyViewCategory.ID;
    currentValue = ProxyViewInteractiveProxies.DEFAULT;
}

/** Whether to use title scaling if smart zoom is enabled. */
export class ProxyViewTitleScaling implements RenderOption {
    static readonly ID: string = "proxy-view-title-scaling";
    static readonly NAME: string = "Scale Proxy Titles";
    static readonly DESCRIPTION: string = "Whether a proxy's title should be scaled if smart zoom is enabled.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewTitleScaling.ID;
    readonly name: string = ProxyViewTitleScaling.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewTitleScaling.DEFAULT;
    readonly description: string = ProxyViewTitleScaling.DESCRIPTION;
    readonly renderCategory: string = ProxyViewCategory.ID;
    currentValue = ProxyViewTitleScaling.DEFAULT;
}

//////// DEBUG ////////

/**
 * Whether proxy-view debug options should be hidden from the sidebar.
 * `true` hides all debug options, `false` shows all debug options.
 */
const hideProxyViewDebugOptions = true;

/** The category containing debug proxy-view options. */
export class ProxyViewDebugCategory implements RenderOption {
    static readonly ID: string = "proxy-view-debug-category";
    static readonly NAME: string = "Proxy-View Debug Options";
    static readonly INSTANCE: ProxyViewDebugCategory = new ProxyViewDebugCategory;
    readonly id: string = ProxyViewDebugCategory.ID;
    readonly name: string = ProxyViewDebugCategory.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CATEGORY;
    readonly initialValue: any;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue: any;
}

/** Whether to highlight proxies that are connected to the selected node. */
export class ProxyViewHighlightSelected implements RenderOption {
    static readonly ID: string = "proxy-view-highlight-selected";
    static readonly NAME: string = "Highlight Proxies by Selection";
    static readonly DESCRIPTION: string = "Whether proxies that are connected to the selected node should be highlighted.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewHighlightSelected.ID;
    readonly name: string = ProxyViewHighlightSelected.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewHighlightSelected.DEFAULT;
    readonly description: string = ProxyViewHighlightSelected.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewHighlightSelected.DEFAULT;
}

/** Whether to decrease opacity of proxies that are not connected to the selected node and increase otherwise. */
export class ProxyViewOpacityBySelected implements RenderOption {
    static readonly ID: string = "proxy-view-opacity-by-selected";
    static readonly NAME: string = "Transparent Proxies by Selection";
    static readonly DESCRIPTION: string = "Whether proxies that are not connected to the selected node should be more transparent.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewOpacityBySelected.ID;
    readonly name: string = ProxyViewOpacityBySelected.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewOpacityBySelected.DEFAULT;
    readonly description: string = ProxyViewOpacityBySelected.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewOpacityBySelected.DEFAULT;
}

/** Whether to use the synthesis specified proxy-rendering. */
export class ProxyViewUseSynthesisProxyRendering implements RenderOption {
    static readonly ID: string = "proxy-view-use-synthesis-proxy-rendering";
    static readonly NAME: string = "Use Synthesis Proxy-Rendering";
    static readonly DESCRIPTION: string = "Whether proxies should be rendered as specified by the synthesis (if specified).";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewUseSynthesisProxyRendering.ID;
    readonly name: string = ProxyViewUseSynthesisProxyRendering.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewUseSynthesisProxyRendering.DEFAULT;
    readonly description: string = ProxyViewUseSynthesisProxyRendering.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewUseSynthesisProxyRendering.DEFAULT;
}

/** Whether to use a simple version of Along-Border-Routing. Can cause strange artifacts if an edge e.g. oscillates. */
export class ProxyViewSimpleAlongBorderRouting implements RenderOption {
    static readonly ID: string = "proxy-view-simple-along-border-routing";
    static readonly NAME: string = "Use Simple Along-Border-Routing";
    static readonly DESCRIPTION: string = "Whether to use a simple version of Along-Border-Routing. Can cause strange artifacts if an edge e.g. oscillates.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewSimpleAlongBorderRouting.ID;
    readonly name: string = ProxyViewSimpleAlongBorderRouting.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewSimpleAlongBorderRouting.DEFAULT;
    readonly description: string = ProxyViewSimpleAlongBorderRouting.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewSimpleAlongBorderRouting.DEFAULT;
}

/** Whether to cap proxies in their parent node. */
export class ProxyViewCapProxyToParent implements RenderOption {
    static readonly ID: string = "proxy-view-cap-proxy-to-parent";
    static readonly NAME: string = "Cap Proxy to Parent";
    static readonly DESCRIPTION: string = "Whether proxies should be capped inside their parent node.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewCapProxyToParent.ID;
    readonly name: string = ProxyViewCapProxyToParent.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewCapProxyToParent.DEFAULT;
    readonly description: string = ProxyViewCapProxyToParent.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewCapProxyToParent.DEFAULT;
}

/** Whether to show proxies immediately, e.g. whether proxies should be created once a node is partially off-screen. */
export class ProxyViewShowProxiesImmediately implements RenderOption {
    static readonly ID: string = "proxy-view-show-proxies-immediately";
    static readonly NAME: string = "Show Proxies Immediately";
    static readonly DESCRIPTION: string = "Whether proxies should be created once a node is partially off-screen.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewShowProxiesImmediately.ID;
    readonly name: string = ProxyViewShowProxiesImmediately.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewShowProxiesImmediately.DEFAULT;
    readonly description: string = ProxyViewShowProxiesImmediately.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewShowProxiesImmediately.DEFAULT;
}

/** Whether to show proxies early, e.g. whether proxies should be created before a node is fully off-screen. */
export class ProxyViewShowProxiesEarly implements RenderOption {
    static readonly ID: string = "proxy-view-show-proxies-early";
    static readonly NAME: string = "Show Proxies Early";
    static readonly DESCRIPTION: string = "Whether proxies should be created before a node is fully off-screen.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewShowProxiesEarly.ID;
    readonly name: string = ProxyViewShowProxiesEarly.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewShowProxiesEarly.DEFAULT;
    readonly description: string = ProxyViewShowProxiesEarly.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewShowProxiesEarly.DEFAULT;
}

/** The amount by which to show proxies early if enabled. The number indicates a percentage of the minimum of the canvas' dimensions. */
export class ProxyViewShowProxiesEarlyNumber implements RangeOption {
    static readonly ID: string = "proxy-view-decrease-canvas-size-number";
    static readonly NAME: string = "Show Proxies Early Number";
    static readonly DESCRIPTION: string = "The amount by which to show proxies early if enabled. The number indicates a percentage of the minimum of the canvas' dimensions.";
    static readonly DEFAULT: number = 5;
    static readonly RANGE: Range = { first: 1, second: 15 };
    static readonly STEPSIZE: number = 1;
    readonly id: string = ProxyViewShowProxiesEarlyNumber.ID;
    readonly name: string = ProxyViewShowProxiesEarlyNumber.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.RANGE;
    readonly initialValue: number = ProxyViewShowProxiesEarlyNumber.DEFAULT;
    readonly description: string = ProxyViewShowProxiesEarlyNumber.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly range: Range = ProxyViewShowProxiesEarlyNumber.RANGE;
    readonly stepSize: number = ProxyViewShowProxiesEarlyNumber.STEPSIZE;
    readonly values: any[] = [];
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewShowProxiesEarlyNumber.DEFAULT;
}

/** Whether to change stacking order such that close proxies are stacked above distant ones. */
export class ProxyViewStackingOrderByDistance implements RenderOption {
    static readonly ID: string = "proxy-view-stacking-order-by-distance";
    static readonly NAME: string = "Render Close Nodes At Top";
    static readonly DESCRIPTION: string = "Whether close proxies should be stacked above distant proxies.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewStackingOrderByDistance.ID;
    readonly name: string = ProxyViewStackingOrderByDistance.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewStackingOrderByDistance.DEFAULT;
    readonly description: string = ProxyViewStackingOrderByDistance.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewStackingOrderByDistance.DEFAULT;
}

/** Whether to change stacking order such that fully opaque proxies are stacked above transparent ones. */
export class ProxyViewStackingOrderByOpacity implements RenderOption {
    static readonly ID: string = "proxy-view-stacking-order-by-opacity";
    static readonly NAME: string = "Render Opaque Nodes At Top";
    static readonly DESCRIPTION: string = "Whether fully opaque proxies should be stacked above transparent proxies.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewStackingOrderByOpacity.ID;
    readonly name: string = ProxyViewStackingOrderByOpacity.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewStackingOrderByOpacity.DEFAULT;
    readonly description: string = ProxyViewStackingOrderByOpacity.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewStackingOrderByOpacity.DEFAULT;
}

/** Whether to change stacking order such that selected proxies are stacked above others. */
export class ProxyViewStackingOrderBySelected implements RenderOption {
    static readonly ID: string = "proxy-view-stacking-order-by-selected";
    static readonly NAME: string = "Render Selected Nodes At Top";
    static readonly DESCRIPTION: string = "Whether selected proxies should be stacked above other proxies.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewStackingOrderBySelected.ID;
    readonly name: string = ProxyViewStackingOrderBySelected.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewStackingOrderBySelected.DEFAULT;
    readonly description: string = ProxyViewStackingOrderBySelected.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewStackingOrderBySelected.DEFAULT;
}

/** Whether proxies should be shown for nodes that aren't rendered because of the parent's detail level. */
export class ProxyViewUseDetailLevel implements RenderOption {
    static readonly ID: string = "proxy-view-use-detail-level";
    static readonly NAME: string = "Use Detail Level";
    static readonly DESCRIPTION: string = "Whether proxies should be shown for nodes that aren't rendered because of the parent's detail level.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewUseDetailLevel.ID;
    readonly name: string = ProxyViewUseDetailLevel.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewUseDetailLevel.DEFAULT;
    readonly description: string = ProxyViewUseDetailLevel.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewUseDetailLevel.DEFAULT;
}

/** Whether edge proxies should be drawn above node proxies. */
export class ProxyViewDrawEdgesAboveNodes implements RenderOption {
    static readonly ID: string = "proxy-view-draw-edges-above-nodes";
    static readonly NAME: string = "Draw Edges Over Nodes";
    static readonly DESCRIPTION: string = "Whether edge proxies should be drawn above node proxies.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewDrawEdgesAboveNodes.ID;
    readonly name: string = ProxyViewDrawEdgesAboveNodes.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewDrawEdgesAboveNodes.DEFAULT;
    readonly description: string = ProxyViewDrawEdgesAboveNodes.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewDrawEdgesAboveNodes.DEFAULT;
}

/** Whether edge proxies should be drawn when the source or target point is off-screen. */
export class ProxyViewEdgesToOffScreenPoint implements RenderOption {
    static readonly ID: string = "proxy-view-draw-edges-to-off-screen-point";
    static readonly NAME: string = "Draw Edges to Off-Screen Point";
    static readonly DESCRIPTION: string = "Whether edge proxies should be drawn when the source or target point is off-screen.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewEdgesToOffScreenPoint.ID;
    readonly name: string = ProxyViewEdgesToOffScreenPoint.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewEdgesToOffScreenPoint.DEFAULT;
    readonly description: string = ProxyViewEdgesToOffScreenPoint.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewEdgesToOffScreenPoint.DEFAULT;
}

/** Whether edges should become transparent when the corresponding edge proxies are on-screen. This actually modifies the diagram. */
export class ProxyViewTransparentEdges implements RenderOption {
    static readonly ID: string = "proxy-view-transparent-edges";
    static readonly NAME: string = "Fade Out Edges";
    static readonly DESCRIPTION: string = "Whether edges should become transparent when the corresponding edge proxies are on-screen. This actually modifies the diagram.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewTransparentEdges.ID;
    readonly name: string = ProxyViewTransparentEdges.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewTransparentEdges.DEFAULT;
    readonly description: string = ProxyViewTransparentEdges.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewTransparentEdges.DEFAULT;
}

/** Whether proxies should be as big as their corresponding node. */
export class ProxyViewOriginalNodeScale implements RenderOption {
    static readonly ID: string = "proxy-view-original-node-scale";
    static readonly NAME: string = "Original Node Scale";
    static readonly DESCRIPTION: string = "Whether proxies should be as big as their corresponding node.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewOriginalNodeScale.ID;
    readonly name: string = ProxyViewOriginalNodeScale.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewOriginalNodeScale.DEFAULT;
    readonly description: string = ProxyViewOriginalNodeScale.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewOriginalNodeScale.DEFAULT;
}

/** Whether to cap scaling of proxies to 1. */
export class ProxyViewCapScaleToOne implements RenderOption {
    static readonly ID: string = "proxy-view-cap-scale-to-one";
    static readonly NAME: string = "Cap Scaling to 1";
    static readonly DESCRIPTION: string = "Whether proxies should be upscaled more than their original size.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewCapScaleToOne.ID;
    readonly name: string = ProxyViewCapScaleToOne.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewCapScaleToOne.DEFAULT;
    readonly description: string = ProxyViewCapScaleToOne.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewCapScaleToOne.DEFAULT;
}

/** Whether clusters should be transparent according to the average of their contained proxies' opacities. */
export class ProxyViewClusterTransparent implements RenderOption {
    static readonly ID: string = "proxy-view-cluster-transparent";
    static readonly NAME: string = "Allow Transparent Cluster";
    static readonly DESCRIPTION: string = "Whether clusters should be transparent according to the average of their contained proxies' opacities.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewClusterTransparent.ID;
    readonly name: string = ProxyViewClusterTransparent.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewClusterTransparent.DEFAULT;
    readonly description: string = ProxyViewClusterTransparent.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewClusterTransparent.DEFAULT;
}

/** Whether cascading clustering should be used, i.e. take transitive overlap into consideration. */
export class ProxyViewClusteringCascading implements RenderOption {
    static readonly ID: string = "proxy-view-clustering-cascading";
    static readonly NAME: string = "Cascading Clustering";
    static readonly DESCRIPTION: string = "Whether clustering should be cascading.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewClusteringCascading.ID;
    readonly name: string = ProxyViewClusteringCascading.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewClusteringCascading.DEFAULT;
    readonly description: string = ProxyViewClusteringCascading.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewClusteringCascading.DEFAULT;
}

/** Whether the sweep line algorithm should be used for clustering. Defaults to false since evaluated to be slower in the current implementation as-is. */
export class ProxyViewClusteringSweepLine implements RenderOption {
    static readonly ID: string = "proxy-view-clustering-sweep-line";
    static readonly NAME: string = "Sweep Line Clustering";
    static readonly DESCRIPTION: string = "Whether clustering should be done via sweep line algorithm.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewClusteringSweepLine.ID;
    readonly name: string = ProxyViewClusteringSweepLine.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewClusteringSweepLine.DEFAULT;
    readonly description: string = ProxyViewClusteringSweepLine.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewClusteringSweepLine.DEFAULT;
}

/** Whether caches for positions, renderings and distances should be enabled. */
export class ProxyViewCachesEnabled implements RenderOption {
    static readonly ID: string = "proxy-view-caches-enabled";
    static readonly NAME: string = "Enable Caches";
    static readonly DESCRIPTION: string = "Whether caches for positions, renderings and distances should be enabled.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewCachesEnabled.ID;
    readonly name: string = ProxyViewCachesEnabled.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewCachesEnabled.DEFAULT;
    readonly description: string = ProxyViewCachesEnabled.DESCRIPTION;
    readonly renderCategory: string = ProxyViewDebugCategory.ID;
    readonly invisible: boolean = hideProxyViewDebugOptions;
    currentValue = ProxyViewCachesEnabled.DEFAULT;
}
