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

import { RenderOption, TransformationOptionType } from "../../options/option-models";
import { ProxyViewCategory } from "../proxy-view-options";

/**
 * Whether proxy-view debug filter should be hidden from the sidebar.
 * `true` hides all debug filter, `false` shows all debug filter.
 */
const hideProxyViewDebugFilter = true;

/** The category containing proxy-view filters. */
export class ProxyViewFilterCategory implements RenderOption {
    static readonly ID: string = "proxy-view-filter-category";
    static readonly NAME: string = "Filters";
    static readonly INSTANCE: ProxyViewFilterCategory = new ProxyViewFilterCategory;
    readonly id: string = ProxyViewFilterCategory.ID;
    readonly name: string = ProxyViewFilterCategory.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CATEGORY;
    readonly initialValue: any;
    readonly renderCategory: string = ProxyViewCategory.ID;
    currentValue: any;
}

/** Whether proxies should be filtered by removing unconnected nodes regarding all on-screen nodes. */
export class ProxyViewFilterUnconnectedToOnScreen implements RenderOption {
    static readonly ID: string = "proxy-view-filter-unconnected";
    static readonly NAME: string = "Filter Nodes Unconnected to On-Screen";
    static readonly DESCRIPTION: string = "Whether proxies should be filtered by removing unconnected nodes regarding all on-screen nodes.";
    static readonly DEFAULT: boolean = true;
    readonly id: string = ProxyViewFilterUnconnectedToOnScreen.ID;
    readonly name: string = ProxyViewFilterUnconnectedToOnScreen.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewFilterUnconnectedToOnScreen.DEFAULT;
    readonly description: string = ProxyViewFilterUnconnectedToOnScreen.DESCRIPTION;
    readonly renderCategory: string = ProxyViewFilterCategory.ID;
    currentValue = ProxyViewFilterUnconnectedToOnScreen.DEFAULT;
}

/** Whether proxies should be filtered by removing unconnected nodes regarding the selected node. */
export class ProxyViewFilterUnconnectedToSelected implements RenderOption {
    static readonly ID: string = "proxy-view-filter-unconnected-to-selected";
    static readonly NAME: string = "Filter Nodes Unconnected to Selection";
    static readonly DESCRIPTION: string = "Whether proxies should be filtered by removing unconnected nodes regarding the selected node.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewFilterUnconnectedToSelected.ID;
    readonly name: string = ProxyViewFilterUnconnectedToSelected.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewFilterUnconnectedToSelected.DEFAULT;
    readonly description: string = ProxyViewFilterUnconnectedToSelected.DESCRIPTION;
    readonly renderCategory: string = ProxyViewFilterCategory.ID;
    currentValue = ProxyViewFilterUnconnectedToSelected.DEFAULT;
}

/** Whether proxies of unselected nodes should be filtered. */
export class ProxyViewFilterUnselected implements RenderOption {
    static readonly ID: string = "proxy-view-filter-unselected";
    static readonly NAME: string = "Filter Unselected Nodes";
    static readonly DESCRIPTION: string = "Whether proxies of unselected nodes should be filtered.";
    static readonly DEFAULT: boolean = false;
    readonly id: string = ProxyViewFilterUnselected.ID;
    readonly name: string = ProxyViewFilterUnselected.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHECK;
    readonly initialValue: boolean = ProxyViewFilterUnselected.DEFAULT;
    readonly description: string = ProxyViewFilterUnselected.DESCRIPTION;
    readonly renderCategory: string = ProxyViewFilterCategory.ID;
    invisible = hideProxyViewDebugFilter;
    currentValue = ProxyViewFilterUnselected.DEFAULT;
}

/** Whether proxies should be filtered by removing distant nodes. */
export class ProxyViewFilterDistant implements RenderOption {
    static readonly ID: string = "proxy-view-filter-distant";
    static readonly NAME: string = "Filter Distant Nodes";
    static readonly DESCRIPTION: string = "Whether proxies should be filtered by removing nodes that are far away from the center.";
    static readonly CHOICE_OFF: string = "Off";
    static readonly CHOICE_CLOSE: string = "Close";
    static readonly CHOICE_DISTANT: string = "Distant";
    static readonly DEFAULT: string = ProxyViewFilterDistant.CHOICE_OFF;
    static readonly CHOICES: string[] = [
        ProxyViewFilterDistant.CHOICE_OFF,
        ProxyViewFilterDistant.CHOICE_CLOSE,
        ProxyViewFilterDistant.CHOICE_DISTANT
    ];
    readonly id: string = ProxyViewFilterDistant.ID;
    readonly name: string = ProxyViewFilterDistant.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CHOICE;
    readonly initialValue: string = ProxyViewFilterDistant.DEFAULT;
    readonly description: string = ProxyViewFilterDistant.DESCRIPTION;
    readonly renderCategory: string = ProxyViewFilterCategory.ID;
    readonly values: string[] = ProxyViewFilterDistant.CHOICES;
    invisible = hideProxyViewDebugFilter;
    currentValue = ProxyViewFilterDistant.DEFAULT;
}
