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
    static readonly DESCRIPTION: string = "Whether the Proxy-View is enabled.";
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
    static readonly DESCRIPTION: string = "Whether overlapping proxies should be clustered.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewClusteringEnabled.ID;
    readonly name: string = ProxyViewClusteringEnabled.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewClusteringEnabled.DEFAULT;
    readonly description: string = ProxyViewClusteringEnabled.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    currentValue = ProxyViewClusteringEnabled.DEFAULT;
}

/** Whether to cap proxies in their parent node. */
export class ProxyViewCapProxyToParent implements RenderOption {
    static readonly ID: string = 'proxy-view-cap-proxy-to-parent';
    static readonly NAME: string = 'Cap Proxy to Parent';
    static readonly DESCRIPTION: string = "Whether proxies should be capped inside their parent node.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewCapProxyToParent.ID;
    readonly name: string = ProxyViewCapProxyToParent.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewCapProxyToParent.DEFAULT;
    readonly description: string = ProxyViewCapProxyToParent.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    currentValue = ProxyViewCapProxyToParent.DEFAULT;
}

/** Whether proxies should be filtered by removing unconnected nodes. */
export class ProxyViewFilterUnconnected implements RenderOption {
    static readonly ID: string = 'proxy-view-filter-unconnected';
    static readonly NAME: string = 'Filter Unconnected Nodes';
    static readonly DESCRIPTION: string = "Whether proxies should be filtered by removing unconnected nodes.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewFilterUnconnected.ID;
    readonly name: string = ProxyViewFilterUnconnected.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewFilterUnconnected.DEFAULT;
    readonly description: string = ProxyViewFilterUnconnected.DESCRIPTION;
    readonly renderCategory: RenderOption = ProxyViewCategory.INSTANCE;
    currentValue = ProxyViewFilterUnconnected.DEFAULT;
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

/** Whether to use the synthesis specified proxy-rendering. */
export class ProxyViewUseSynthesisProxyRendering implements RenderOption {
    static readonly ID: string = 'proxy-view-use-synthesis-proxy-rendering';
    static readonly NAME: string = 'Use Synthesis Proxy-Rendering';
    static readonly DESCRIPTION: string = "Whether proxies should be rendered as specified by the synthesis (if specified).";
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

/** Whether cascading clustering should be used, i.e. take transitive overlap into consideration. */
export class ProxyViewClusteringCascading implements RenderOption {
    static readonly ID: string = 'proxy-view-clustering-cascading';
    static readonly NAME: string = 'Cascading Clustering';
    static readonly DESCRIPTION: string = "Whether clustering should be cascading.";
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
    static readonly DESCRIPTION: string = "Whether clustering should be done via sweep line algorithm.";
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
