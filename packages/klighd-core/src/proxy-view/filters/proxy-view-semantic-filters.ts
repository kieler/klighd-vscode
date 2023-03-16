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

import { inject, injectable, postConstruct } from "inversify";
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer, ICommand } from "sprotty";
import { Action, SetModelAction, UpdateModelAction } from "sprotty-protocol";
import { DISymbol } from "../../di.symbols";
import { Filter, getFilters } from "../../filtering/semantic-filtering-util";
import { RenderOption, TransformationOptionType } from "../../options/option-models";
import { RenderOptionsRegistry } from "../../options/render-options-registry";
import { getElementByID } from "../../skgraph-utils";
import { ProxyView } from "../proxy-view";
import { SendProxyViewAction } from "../proxy-view-actions";
import { ProxyViewFilterCategory } from "./proxy-view-filter-options";
import { ProxyFilterAndID, ProxyFilterArgs } from "./proxy-view-filters";

/**
 * Registers semantic {@link ProxyFilter}s at the {@link ProxyView} and holds the current
 * values of their respective options as specified by the sidebar.
 */
@injectable()
export class ProxySemanticFilterHandler implements IActionHandler, IActionHandlerInitializer {

    /** The registry containing the semantic filter options. */
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;

    @postConstruct()
    init(): void {
        // Register to receive updates on registry changes
        this.renderOptionsRegistry.onChange(() => this.updateFilterOptions(this.renderOptionsRegistry));
    }

    /** The previous semantic filters, only to be used for unregistering. */
    private prevSemanticFilters: ProxyFilterAndID[] = [];
    /** The current semantic filters. */
    private semanticFilters: ProxyFilterAndID[] = [];
    /** The proxy-view. */
    private proxyView: ProxyView;

    //// Sidebar filter options ////
    /** Each semantic filter's corresponding option. */
    private semanticFilterOptions: (typeof ProxyViewAbstractSemanticFilter)[] = [];
    /** Each semantic filter's corresponding option's value. */
    private semanticFilterOptionValues: boolean[] = [];

    //// Get the filters ////
    handle(action: Action): void | Action | ICommand {
        if (action.kind === SendProxyViewAction.KIND) {
            const proxyView = (action as SendProxyViewAction).proxyView;
            this.proxyView = proxyView;
        } else if ([SetModelAction.KIND, UpdateModelAction.KIND].includes(action.kind)) {
            // New root aka new semantic filters
            const { newRoot } = (action as SetModelAction | UpdateModelAction);

            if (newRoot) {
                // Sprotty's new root is usually not $root but the file root
                let actualRoot;
                if (newRoot.children) {
                    actualRoot = getElementByID(newRoot as any, "$root");
                }

                if (actualRoot) {
                    this.initSemanticFilters(getFilters(actualRoot));
                } else {
                    this.prevSemanticFilters = this.semanticFilters;
                    this.semanticFilters = [];
                }
            }
        }

        if (this.proxyView && this.semanticFilters.length > 0) {
            // Both actions need to have happened so filters can be registered
            this.proxyView.unregisterFilters(...this.prevSemanticFilters);
            this.proxyView.registerFilters(...this.semanticFilters);
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(SendProxyViewAction.KIND, this);
        registry.register(SetModelAction.KIND, this);
        registry.register(UpdateModelAction.KIND, this);
    }

    /** 
     * Initializes {@link prevSemanticFilters}, {@link semanticFilters}, {@link semanticFilterOptions}
     * and {@link semanticFilterOptionValues} using the given `filters`.
     */
    private initSemanticFilters(filters: Filter[]): void {
        // Start by unregistering previous semantic filters from registry
        this.renderOptionsRegistry.unregisterAll(ProxyViewSemanticFilterCategory, ...this.semanticFilterOptions);

        // Save previous semantic filters
        this.prevSemanticFilters = this.semanticFilters;
        // Map Filters to ProxyFilters + ids
        this.semanticFilters = filters.map((filter, i) => (
            ProxyFilterAndID.from(
                ProxySemanticFilterHandler,
                ({ node }: ProxyFilterArgs) => !this.semanticFilterOptionValues[i] || filter.filterFun(node),
                `${filter.name ?? "unknown"}-${i}`)
        ));
        // Also map to RenderOption
        this.semanticFilterOptions = filters.map((filter, i) => (
            class ProxyViewSemanticFilter extends ProxyViewAbstractSemanticFilter implements RenderOption {
                static readonly ID: string = `proxy-view-semantic-filter-${filter.name ?? "unknown"}-${i}`;
                static readonly NAME: string = filter.name ?? "Unknown Filter";
                static readonly DEFAULT: boolean = !!filter.defaultValue;
                readonly id: string = ProxyViewSemanticFilter.ID;
                readonly name: string = ProxyViewSemanticFilter.NAME;
                readonly type: TransformationOptionType = TransformationOptionType.CHECK;
                readonly initialValue: boolean = ProxyViewSemanticFilter.DEFAULT;
                readonly renderCategory: string = ProxyViewSemanticFilterCategory.ID;
                currentValue: boolean = ProxyViewSemanticFilter.DEFAULT;
            }
        ));
        // To ensure correct indexing, also initialize the values
        this.semanticFilterOptionValues = filters.map((filter) => !!filter.defaultValue);

        if (filters.length > 0) {
            // Finally, register semantic filters in registry. Make sure not to show the category if it would be empty
            this.renderOptionsRegistry.registerAll(ProxyViewSemanticFilterCategory, ...this.semanticFilterOptions);
        }
    }

    /** Updates the proxy-view semantic filter options specified in the {@link RenderOptionsRegistry}. */
    private updateFilterOptions(renderOptionsRegistry: RenderOptionsRegistry): void {
        for (const i in this.semanticFilterOptions) {
            this.semanticFilterOptionValues[i] = renderOptionsRegistry.getValue(this.semanticFilterOptions[i]);
        }
    }
}

/** The category containing semantic proxy-view filters. */
export class ProxyViewSemanticFilterCategory implements RenderOption {
    static readonly ID: string = "proxy-view-semantic-filter-category";
    static readonly NAME: string = "Semantic Filters";
    static readonly INSTANCE: ProxyViewSemanticFilterCategory = new ProxyViewSemanticFilterCategory;
    readonly id: string = ProxyViewSemanticFilterCategory.ID;
    readonly name: string = ProxyViewSemanticFilterCategory.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CATEGORY;
    readonly initialValue: any;
    readonly renderCategory: string = ProxyViewFilterCategory.ID;
    currentValue: any;
}

/**
 * Semi-abstract class for semantic proxy-view filters.
 * Needed to guarantee type safety of actual semantic filters.
 */
export class ProxyViewAbstractSemanticFilter implements RenderOption {
    static readonly ID: string = `proxy-view-abstract-semantic-filter`;
    static readonly NAME: string = "Abstract Semantic Filter";
    id: string = ProxyViewAbstractSemanticFilter.ID;
    name: string = ProxyViewAbstractSemanticFilter.NAME;
    type: TransformationOptionType;
    initialValue: any;
    currentValue: any;
    readonly debug: boolean = true;
}
