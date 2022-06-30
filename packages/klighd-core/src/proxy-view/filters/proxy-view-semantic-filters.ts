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
import { Action, SetModelAction } from "sprotty-protocol";
import { DISymbol } from "../../di.symbols";
import { Filter, getFilters } from "../../filtering/semantic-filtering-util";
import { RenderOption, TransformationOptionType } from "../../options/option-models";
import { RenderOptionsRegistry } from "../../options/render-options-registry";
import { getElementByID } from "../../skgraph-utils";
import { ProxyView } from "../proxy-view";
import { SendProxyViewAction } from "../proxy-view-actions";
import { ProxyViewFilterCategory } from "./proxy-view-filter-options";
import { ProxyFilter, ProxyFilterArgs } from "./proxy-view-filters";

/**
 * Registers semantic {@link ProxyFilter}s at the {@link ProxyView} and holds the current
 * values of their respective options as specified by the sidebar.
 */
@injectable()
export class ProxySemanticFilterHandler implements IActionHandler, IActionHandlerInitializer {
    /** The current semantic filters. */
    private semanticFilters: ProxyFilter[] = [];
    /** The proxy-view. */
    private proxyView: ProxyView;

    //// Get the filters ////
    handle(action: Action): void | Action | ICommand {
        if (action.kind === SendProxyViewAction.KIND) {
            const proxyView = (action as SendProxyViewAction).proxyView;
            this.proxyView = proxyView;

            if (this.semanticFilters.length > 0) {
                // SetModelAction came in first, register filters
                proxyView.registerFilters(...this.semanticFilters);
            }
        } else if (action.kind === SetModelAction.KIND) {
            // New root aka new semantic filters
            const { newRoot } = (action as SetModelAction);
            let actualRoot;
            if (newRoot.children) {
                actualRoot = getElementByID(newRoot as any, "$root");
            }
            if (actualRoot) {
                this.initSemanticFilters(getFilters(actualRoot));
            } else {
                this.semanticFilters = [];
            }

            if (this.proxyView) {
                // SendProxyViewAction came in first, register filters
                this.proxyView.registerFilters(...this.semanticFilters);
            }
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(SendProxyViewAction.KIND, this);
        registry.register(SetModelAction.KIND, this);
    }

    /** 
     * Initializes {@link semanticFilters}, {@link semanticFilterOptions} and {@link semanticFilterOptionValues}
     * using the given `filters`.
     */
    private initSemanticFilters(filters: Filter[]): void {
        // Map Filters to ProxyFilters
        this.semanticFilters = filters.map((filter, i) => (
            ({ node }: ProxyFilterArgs) => !this.semanticFilterOptionValues[i] || filter.filterFun(node)
        ));
        // Also map to RenderOption
        this.semanticFilterOptions = filters.map((filter, i) => (
            class ProxyViewSemanticFilter extends ProxyViewAbstractSemanticFilter implements RenderOption {
                static readonly ID: string = `proxy-view-semantic-filter-${i}`;
                static readonly NAME: string = filter.name ?? "Unknown Filter";
                static readonly DEFAULT: boolean = false;
                readonly id: string = ProxyViewSemanticFilter.ID;
                readonly name: string = ProxyViewSemanticFilter.NAME;
                readonly type: TransformationOptionType = TransformationOptionType.CHECK;
                readonly initialValue: boolean = ProxyViewSemanticFilter.DEFAULT;
                readonly renderCategory: RenderOption = ProxyViewSemanticFilterCategory.INSTANCE;
                currentValue = ProxyViewSemanticFilter.DEFAULT;
                debug = false;
            }
        ));
        // To ensure correct indexing, also initialize the values
        this.semanticFilterOptionValues = filters.map(() => false);

        // Finally, register semantic filters in registry
        this.renderOptionsRegistry.registerAll(ProxyViewSemanticFilterCategory, ...this.semanticFilterOptions);
    }

    //// Sidebar filter options ////
    /** Each semantic filter's corresponding option. */
    private semanticFilterOptions: (typeof ProxyViewAbstractSemanticFilter)[] = [];
    /** Each semantic filter's corresponding option's value. */
    private semanticFilterOptionValues: boolean[] = [];

    /** Updates the proxy-view semantic filter options specified in the {@link RenderOptionsRegistry}. */
    private updateFilterOptions(renderOptionsRegistry: RenderOptionsRegistry): void {
        for (const i in this.semanticFilterOptions) {
            this.semanticFilterOptionValues[i] = renderOptionsRegistry.getValue(this.semanticFilterOptions[i]);
        }
    }

    /** The registry containing the semantic filter options. */
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;

    @postConstruct()
    init(): void {
        // Register to receive updates on registry changes
        this.renderOptionsRegistry.onChange(() => this.updateFilterOptions(this.renderOptionsRegistry));
    }
}

/** The category containing semantic proxy-view filters. */
export class ProxyViewSemanticFilterCategory implements RenderOption {
    static readonly ID: string = "proxy-view-semantic-filter-category";
    static readonly NAME: string = "Proxy-View Semantic Filters";
    static readonly INSTANCE: ProxyViewSemanticFilterCategory = new ProxyViewSemanticFilterCategory;
    readonly id: string = ProxyViewSemanticFilterCategory.ID;
    readonly name: string = ProxyViewSemanticFilterCategory.NAME;
    readonly type: TransformationOptionType = TransformationOptionType.CATEGORY;
    readonly initialValue: any;
    readonly renderCategory: RenderOption = ProxyViewFilterCategory.INSTANCE;
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
    debug = true;
}
