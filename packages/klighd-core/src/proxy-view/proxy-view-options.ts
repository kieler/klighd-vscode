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

/*
 * Final options should be:
 * 
 * Enable Proxy-View
 *   true/false
 * Size of Proxies?
 *   range
 * Decrease Proxy Clutter
 *   Off
 *   Clustering
 *   Stacking Order + Transparency by Distance
 * Enable Actions
 *   true/false
 * Cap Proxy to parent
 *   true/false
 * Filters (...)
 * 
 * Debug
 */

/** The category containing proxy-view options. */
export class ProxyViewCategory implements RenderOption {
    static readonly ID: string = 'proxy-view-category';
    static readonly NAME: string = 'Proxy-View Options';
    static readonly INSTANCE: ProxyViewCategory = new ProxyViewCategory;
    readonly id: string = ProxyViewCategory.ID;
    readonly name: string = ProxyViewCategory.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CATEGORY;
    readonly initialValue: any;
    currentValue: any;
}

/** Whether the proxy-view is enabled. */
export class ProxyViewEnabled implements RenderOption {
    static readonly ID: string = 'proxy-view-enabled';
    static readonly NAME: string = 'Enable Proxy-View';
    static readonly DESCRIPTION: string = 'Whether the Proxy-View is enabled.';
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewEnabled.ID;
    readonly name: string = ProxyViewEnabled.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewEnabled.DEFAULT;
    readonly description: string = ProxyViewEnabled.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    currentValue = ProxyViewEnabled.DEFAULT;
}

/** Part of calculating the proxies' size. */
export class ProxyViewSize implements RangeOption {
    static readonly ID: string = 'proxy-view-size';
    static readonly NAME: string = 'Size of Proxies in %';
    static readonly DESCRIPTION: string = "Percentage to which the proxies are scaled regarding the minimum of the canvas' height and width.";
    static readonly DEFAULT: number = 8;
    static readonly RANGE: Range = { first: 1, second: 25 };
    static readonly STEPSIZE: number = 1;
    readonly id: string = ProxyViewSize.ID;
    readonly name: string = ProxyViewSize.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.RANGE;
    readonly initialValue: number = ProxyViewSize.DEFAULT;
    readonly description: string = ProxyViewSize.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    readonly range: Range = ProxyViewSize.RANGE;
    readonly stepSize: number = ProxyViewSize.STEPSIZE;
    readonly values: any[] = [];
    currentValue = ProxyViewSize.DEFAULT;
}

/** Whether clustering is enabled. */
export class ProxyViewClusteringEnabled implements RenderOption {
    static readonly ID: string = 'proxy-view-clustering-enabled';
    static readonly NAME: string = 'Enable Clustering';
    static readonly DESCRIPTION: string = 'Whether overlapping proxies should be clustered.';
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewClusteringEnabled.ID;
    readonly name: string = ProxyViewClusteringEnabled.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewClusteringEnabled.DEFAULT;
    readonly description: string = ProxyViewClusteringEnabled.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    currentValue = ProxyViewClusteringEnabled.DEFAULT;
}

/** Whether proxies should be more transparent the further away they are. */
export class ProxyViewOpacityByDistance implements RenderOption {
    static readonly ID: string = 'proxy-view-opacity-by-distance';
    static readonly NAME: string = 'Transparent Distant Proxies';
    static readonly DESCRIPTION: string = 'Whether proxies should be more transparent the further away they are.';
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewOpacityByDistance.ID;
    readonly name: string = ProxyViewOpacityByDistance.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewOpacityByDistance.DEFAULT;
    readonly description: string = ProxyViewOpacityByDistance.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    currentValue = ProxyViewOpacityByDistance.DEFAULT;
}

/** Whether proxies should be interactable. */
export class ProxyViewActionsEnabled implements RenderOption {
    static readonly ID: string = 'proxy-view-actions-enabled';
    static readonly NAME: string = 'Enable Actions';
    static readonly DESCRIPTION: string = 'Whether proxies should be interactable.';
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewActionsEnabled.ID;
    readonly name: string = ProxyViewActionsEnabled.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewActionsEnabled.DEFAULT;
    readonly description: string = ProxyViewActionsEnabled.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    currentValue = ProxyViewActionsEnabled.DEFAULT;
}

/** Whether straight edges to proxies should be drawn. */
export class ProxyViewDrawStraightEdges implements RenderOption {
    static readonly ID: string = 'proxy-view-draw-edges';
    static readonly NAME: string = 'Draw Straight Edges to Proxies';
    static readonly DESCRIPTION: string = 'Whether straight edges to proxies should be drawn.';
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewDrawStraightEdges.ID;
    readonly name: string = ProxyViewDrawStraightEdges.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewDrawStraightEdges.DEFAULT;
    readonly description: string = ProxyViewDrawStraightEdges.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    currentValue = ProxyViewDrawStraightEdges.DEFAULT;
}

/** Whether to cap proxies in their parent node. */
export class ProxyViewCapProxyToParent implements RenderOption {
    static readonly ID: string = 'proxy-view-cap-proxy-to-parent';
    static readonly NAME: string = 'Cap Proxy to Parent';
    static readonly DESCRIPTION: string = 'Whether proxies should be capped inside their parent node.';
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewCapProxyToParent.ID;
    readonly name: string = ProxyViewCapProxyToParent.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewCapProxyToParent.DEFAULT;
    readonly description: string = ProxyViewCapProxyToParent.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    currentValue = ProxyViewCapProxyToParent.DEFAULT;
}

/** Whether proxies should be filtered by removing unconnected nodes regarding all on-screen nodes. */
export class ProxyViewFilterUnconnected implements RenderOption {
    static readonly ID: string = 'proxy-view-filter-unconnected';
    static readonly NAME: string = 'Filter Nodes Unconnected to On-Screen';
    static readonly DESCRIPTION: string = 'Whether proxies should be filtered by removing unconnected nodes regarding all on-screen nodes.';
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewFilterUnconnected.ID;
    readonly name: string = ProxyViewFilterUnconnected.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewFilterUnconnected.DEFAULT;
    readonly description: string = ProxyViewFilterUnconnected.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    currentValue = ProxyViewFilterUnconnected.DEFAULT;
}

/** Whether proxies should be filtered by removing unconnected nodes regarding the selected node. */
export class ProxyViewFilterUnconnectedToSelected implements RenderOption {
    static readonly ID: string = 'proxy-view-filter-unconnected-to-selected';
    static readonly NAME: string = 'Filter Nodes Unconnected to Selection';
    static readonly DESCRIPTION: string = 'Whether proxies should be filtered by removing unconnected nodes regarding the selected node.';
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewFilterUnconnectedToSelected.ID;
    readonly name: string = ProxyViewFilterUnconnectedToSelected.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewFilterUnconnectedToSelected.DEFAULT;
    readonly description: string = ProxyViewFilterUnconnectedToSelected.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    currentValue = ProxyViewFilterUnconnectedToSelected.DEFAULT;
}

/** Whether proxies should be filtered by removing distant nodes. */
export class ProxyViewFilterDistant implements RenderOption {
    static readonly ID: string = 'proxy-view-filter-distant';
    static readonly NAME: string = 'Filter Distant Nodes';
    static readonly DESCRIPTION: string = 'Whether proxies should be filtered by removing nodes that are far away from the center.';
    static readonly CHOICE_OFF: string = 'Off';
    static readonly CHOICE_CLOSE: string = 'Close';
    static readonly CHOICE_DISTANT: string = 'Distant';
    static readonly DEFAULT: string = ProxyViewFilterDistant.CHOICE_OFF;
    static readonly CHOICES: string[] = [ProxyViewFilterDistant.CHOICE_OFF, ProxyViewFilterDistant.CHOICE_CLOSE, ProxyViewFilterDistant.CHOICE_DISTANT];
    readonly id: string = ProxyViewFilterDistant.ID;
    readonly name: string = ProxyViewFilterDistant.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHOICE;
    readonly initialValue: string = ProxyViewFilterDistant.DEFAULT;
    readonly description: string = ProxyViewFilterDistant.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    readonly renderChoiceValues: string[] = ProxyViewFilterDistant.CHOICES;
    currentValue = ProxyViewFilterDistant.DEFAULT;
}

//////// DEBUG ////////

/** The category containing debug proxy-view options. */
export class ProxyViewDebugCategory implements RenderOption {
    static readonly ID: string = 'proxy-view-debug-category';
    static readonly NAME: string = 'Proxy-View Debug Options';
    static readonly INSTANCE: ProxyViewDebugCategory = new ProxyViewDebugCategory;
    readonly id: string = ProxyViewDebugCategory.ID;
    readonly name: string = ProxyViewDebugCategory.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CATEGORY;
    readonly initialValue: any;
    readonly debug: boolean = true;
    currentValue: any;
}

/** Whether to highlight proxies that are connected to the selected node. */
export class ProxyViewHighlightSelected implements RenderOption {
    static readonly ID: string = 'proxy-view-highlight-selected';
    static readonly NAME: string = 'Highlight Proxies by Selection';
    static readonly DESCRIPTION: string = 'Whether proxies that are connected to the selected node should be highlighted.';
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewHighlightSelected.ID;
    readonly name: string = ProxyViewHighlightSelected.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewHighlightSelected.DEFAULT;
    readonly description: string = ProxyViewHighlightSelected.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewDebugCategory.INSTANCE;
    readonly debug: boolean = true;
    currentValue = ProxyViewHighlightSelected.DEFAULT;
}

/** Whether to decrease opacity of proxies that are not connected to the selected node and increase otherwise. */
export class ProxyViewOpacityBySelected implements RenderOption {
    static readonly ID: string = 'proxy-view-opacity-by-selected';
    static readonly NAME: string = 'Transparent Proxies by Selection';
    static readonly DESCRIPTION: string = 'Whether proxies that are not connected to the selected node should be more transparent.';
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewOpacityBySelected.ID;
    readonly name: string = ProxyViewOpacityBySelected.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewOpacityBySelected.DEFAULT;
    readonly description: string = ProxyViewOpacityBySelected.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewDebugCategory.INSTANCE;
    readonly debug: boolean = true;
    currentValue = ProxyViewOpacityBySelected.DEFAULT;
}

/** Whether to use the synthesis specified proxy-rendering. */
export class ProxyViewUseSynthesisProxyRendering implements RenderOption {
    static readonly ID: string = 'proxy-view-use-synthesis-proxy-rendering';
    static readonly NAME: string = 'Use Synthesis Proxy-Rendering';
    static readonly DESCRIPTION: string = 'Whether proxies should be rendered as specified by the synthesis (if specified).';
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewUseSynthesisProxyRendering.ID;
    readonly name: string = ProxyViewUseSynthesisProxyRendering.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewUseSynthesisProxyRendering.DEFAULT;
    readonly description: string = ProxyViewUseSynthesisProxyRendering.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewDebugCategory.INSTANCE;
    readonly debug: boolean = true;
    currentValue = ProxyViewUseSynthesisProxyRendering.DEFAULT;
}

/** Whether to change stacking order such that close proxies are stacked above distant ones. */
export class ProxyViewStackingOrderByDistance implements RenderOption {
    static readonly ID: string = 'proxy-view-stacking-order-by-distance';
    static readonly NAME: string = 'Render Close Nodes At Top';
    static readonly DESCRIPTION: string = 'Whether close proxies should be stacked above distant proxies.';
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewStackingOrderByDistance.ID;
    readonly name: string = ProxyViewStackingOrderByDistance.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewStackingOrderByDistance.DEFAULT;
    readonly description: string = ProxyViewStackingOrderByDistance.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewDebugCategory.INSTANCE;
    readonly debug: boolean = true;
    currentValue = ProxyViewStackingOrderByDistance.DEFAULT;
}

/** Whether clusters should be transparent according to their contained proxies. */
export class ProxyViewClusterTransparent implements RenderOption {
    static readonly ID: string = 'proxy-view-cluster-transparent';
    static readonly NAME: string = 'Allow Transparent Cluster';
    static readonly DESCRIPTION: string = 'Whether clusters should be transparent according to their contained proxies.';
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewClusterTransparent.ID;
    readonly name: string = ProxyViewClusterTransparent.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewClusterTransparent.DEFAULT;
    readonly description: string = ProxyViewClusterTransparent.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewDebugCategory.INSTANCE;
    readonly debug: boolean = true;
    currentValue = ProxyViewClusterTransparent.DEFAULT;
}

/** Whether to cap scaling of proxies to 1. */
export class ProxyViewCapScaleToOne implements RenderOption {
    static readonly ID: string = 'proxy-view-cap-scale-to-one';
    static readonly NAME: string = 'Cap Scaling to 1';
    static readonly DESCRIPTION: string = 'Whether proxies should be upscaled more than their original size.';
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewCapScaleToOne.ID;
    readonly name: string = ProxyViewCapScaleToOne.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewCapScaleToOne.DEFAULT;
    readonly description: string = ProxyViewCapScaleToOne.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewDebugCategory.INSTANCE;
    readonly debug: boolean = true;
    currentValue = ProxyViewCapScaleToOne.DEFAULT;
}

/** Whether to use the positions cache. */
export class ProxyViewUsePositionsCache implements RenderOption {
    static readonly ID: string = 'proxy-view-use-positions-cache';
    static readonly NAME: string = 'Cache positions';
    static readonly DESCRIPTION: string = 'Whether the absolute positions of nodes should be cached by the proxy-view.';
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewUsePositionsCache.ID;
    readonly name: string = ProxyViewUsePositionsCache.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewUsePositionsCache.DEFAULT;
    readonly description: string = ProxyViewUsePositionsCache.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewDebugCategory.INSTANCE;
    readonly debug: boolean = true;
    currentValue = ProxyViewUsePositionsCache.DEFAULT;
}

/** Whether cascading clustering should be used, i.e. take transitive overlap into consideration. */
export class ProxyViewClusteringCascading implements RenderOption {
    static readonly ID: string = 'proxy-view-clustering-cascading';
    static readonly NAME: string = 'Cascading Clustering';
    static readonly DESCRIPTION: string = 'Whether clustering should be cascading.';
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewClusteringCascading.ID;
    readonly name: string = ProxyViewClusteringCascading.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewClusteringCascading.DEFAULT;
    readonly description: string = ProxyViewClusteringCascading.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewDebugCategory.INSTANCE;
    readonly debug: boolean = true;
    currentValue = ProxyViewClusteringCascading.DEFAULT;
}

/** Whether the sweep line algorithm should be used for clustering. */
export class ProxyViewClusteringSweepLine implements RenderOption {
    static readonly ID: string = 'proxy-view-clustering-sweep-line';
    static readonly NAME: string = 'Sweep Line Clustering';
    static readonly DESCRIPTION: string = 'Whether clustering should be done via sweep line algorithm.';
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewClusteringSweepLine.ID;
    readonly name: string = ProxyViewClusteringSweepLine.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewClusteringSweepLine.DEFAULT;
    readonly description: string = ProxyViewClusteringSweepLine.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewDebugCategory.INSTANCE;
    readonly debug: boolean = true;
    currentValue = ProxyViewClusteringSweepLine.DEFAULT;
}
