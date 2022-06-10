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
import { Action } from "sprotty-protocol";
import { DISymbol } from "../../di.symbols";
import { RenderOptionsRegistry } from "../../options/render-options-registry";
import { SKNode } from "../../skgraph-models";
import { ProxyView } from "../proxy-view";
import { SendProxyViewAction } from "../proxy-view-actions";
import { CanvasAttributes, isConnectedToAny, isSelectedOrConnectedToSelected } from "../proxy-view-util";
import { ProxyViewFilterDistant, ProxyViewFilterUnconnectedToOnScreen, ProxyViewFilterUnconnectedToSelected } from "./proxy-view-filter-options";

//////// Types ////////

/** The arguments that can be used by {@link ProxyView} filters. */
export interface ProxyFilterArgs {
    /** The node to show a proxy for. */
    node: SKNode;
    /** List of all off-screen nodes. */
    offScreenNodes: SKNode[];
    /** List of all on-screen nodes. */
    onScreenNodes: SKNode[];
    /** The canvas' attributes. */
    canvas: CanvasAttributes;
    /** The distance to the canvas. */
    distance: number;
}

/**
 * A filter to be used by the {@link ProxyView}. Decides whether a node's proxy should be shown.
 * @param args The arguments that can be used by the filter.
 * @returns `true` if the proxy should be shown.
 */
export type ProxyFilter = (args: ProxyFilterArgs) => boolean;

/** FIXME: */
@injectable()
export class ProxyViewFilter implements IActionHandler, IActionHandlerInitializer {
    /** The registry containing the filter options. */
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;

    handle(action: Action): void | Action | ICommand {
        if (action.kind === SendProxyViewAction.KIND) {
            // Save the proxy-view instance
            const sPVAction = action as SendProxyViewAction;
            //// Register the filters
            // TODO: filters for node type?, mega nodes (num children, size, ...?)
            // Order by strongest filter criterion first, secondary ordering by simplicity/cost of check
            sPVAction.proxyView.registerFilters(
                this.filterUnconnectedToSelected,
                this.filterUnconnectedToOnScreen,
                this.filterDistant
            );
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(SendProxyViewAction.KIND, this);
    }

    //// Sidebar filter options ////
    /** @see {@link ProxyViewFilterUnconnectedToOnScreen} */
    private filterUnconnectedToOnScreenOption: boolean;
    /** @see {@link ProxyViewFilterUnconnectedToSelected} */
    private filterUnconnectedToSelectedOption: boolean;
    /** @see {@link ProxyViewFilterDistant} */
    private filterDistantOption: string;

    //////// Registering filters ////////

    @postConstruct()
    init(): void {
        //// Register to receive updates on registry changes
        this.renderOptionsRegistry.onChange(() => this.updateFilterOptions(this.renderOptionsRegistry));
    }

    /** Updates the proxy-view filter options specified in the {@link RenderOptionsRegistry}. */
    updateFilterOptions(renderOptionsRegistry: RenderOptionsRegistry): void {
        // Filters
        this.filterUnconnectedToOnScreenOption = renderOptionsRegistry.getValue(ProxyViewFilterUnconnectedToOnScreen);
        this.filterUnconnectedToSelectedOption = renderOptionsRegistry.getValue(ProxyViewFilterUnconnectedToSelected);
        this.filterDistantOption = renderOptionsRegistry.getValue(ProxyViewFilterDistant);
    }

    //////// Filters ////////

    /** @see {@link ProxyViewFilterUnconnectedToOnScreen} */
    filterUnconnectedToOnScreen({ node, onScreenNodes }: ProxyFilterArgs): boolean {
        return !this.filterUnconnectedToOnScreenOption || isConnectedToAny(node, onScreenNodes);
    }

    /** @see {@link ProxyViewFilterUnconnectedToSelected} */
    filterUnconnectedToSelected({ node }: ProxyFilterArgs): boolean {
        return !this.filterUnconnectedToSelectedOption || isSelectedOrConnectedToSelected(node);
    }

    /** @see {@link ProxyViewFilterUnconnectedToSelected} */
    filterDistant({ distance }: ProxyFilterArgs): boolean {
        let range = -1;
        switch (this.filterDistantOption) {
            case ProxyViewFilterDistant.CHOICE_CLOSE:
                range = ProxyView.DISTANCE_CLOSE;
                break;
            case ProxyViewFilterDistant.CHOICE_DISTANT:
                range = ProxyView.DISTANCE_DISTANT;
                break;
        }
        return range <= 0 || distance <= range;
    }
}
