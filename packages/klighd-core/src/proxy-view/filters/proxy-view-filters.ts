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

// We follow Sprotty's way of redeclaring the interface and its create function, so disable this lint check for this file.
/* eslint-disable no-redeclare */
import { inject, injectable, postConstruct } from 'inversify'
import { ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer, ICommand } from 'sprotty'
import { Action } from 'sprotty-protocol'
import { DISymbol } from '../../di.symbols'
import { RenderOptionsRegistry } from '../../options/render-options-registry'
import { SKNode } from '../../skgraph-models'
import { ProxyView } from '../proxy-view'
import { SendProxyViewAction } from '../proxy-view-actions'
import { Canvas, isConnectedToAny, isSelectedOrConnectedToSelected } from '../proxy-view-util'
import {
    ProxyViewFilterCategory,
    ProxyViewFilterDistant,
    ProxyViewFilterUnconnectedToOnScreen,
    ProxyViewFilterUnconnectedToSelected,
    ProxyViewFilterUnselected,
} from './proxy-view-filter-options'

/// ///// Types ////////

/** The arguments that can be used by {@link ProxyFilter}s. */
export interface ProxyFilterArgs {
    /** The node to show a proxy for - which the filter is applied to. */
    node: SKNode

    /** List of all off-screen nodes. */
    offScreenNodes: SKNode[]
    /** List of all on-screen nodes. */
    onScreenNodes: SKNode[]
    /** The canvas in CRF. */
    canvasCRF: Canvas
    /** The canvas in GRF. */
    canvasGRF: Canvas
    /** The distance to the canvas as specified by {@link ../proxy-view-util#getDistanceToCanvas()}. */
    distance: number
}

/**
 * A filter to be used by the {@link ProxyView}. Decides whether a node's proxy should be shown.
 * The filter may be registered using the {@link ProxyView.registerFilters()} method.
 * @param args The arguments that can be used by the filter.
 * @returns `true` if the proxy should be shown.
 */
export type ProxyFilter = (args: ProxyFilterArgs) => boolean

/** Convenience type, needed for registering {@link ProxyFilter}s. */
export type ProxyFilterAndID = { id: string; filter: ProxyFilter }

export namespace ProxyFilterAndID {
    /**
     * Returns the corresponding {@link ProxyFilterAndID}.
     * The ID is generated using the name of `registeringClass` and the filter name.
     * @param registeringClass The class registering the filter.
     * @param filter The filter.
     * @param filterName Optionally, a filter name can be self defined.
     */
    export function from(
        registeringClass: new () => unknown,
        filter: ProxyFilter,
        filterName = filter.name
    ): ProxyFilterAndID {
        return { id: `${registeringClass.name}-${filterName}`, filter }
    }
}

/// ///// Filters ////////

/** @see {@link ProxyViewFilterUnconnectedToOnScreen} */
export function filterUnconnectedToOnScreen({ node, onScreenNodes }: ProxyFilterArgs): boolean {
    return !ProxyFilterHandler.filterUnconnectedToOnScreen || isConnectedToAny(node, onScreenNodes)
}

/** @see {@link ProxyViewFilterUnconnectedToSelected} */
export function filterUnconnectedToSelected({ node }: ProxyFilterArgs): boolean {
    return !ProxyFilterHandler.filterUnconnectedToSelected || isSelectedOrConnectedToSelected(node)
}

/** @see {@link ProxyViewFilterUnselected} */
export function filterUnselected({ node }: ProxyFilterArgs): boolean {
    return !ProxyFilterHandler.filterUnselected || node.selected
}

/** @see {@link ProxyViewFilterDistant} */
export function filterDistant({ distance }: ProxyFilterArgs): boolean {
    let range = -1
    switch (ProxyFilterHandler.filterDistant) {
        case ProxyViewFilterDistant.CHOICE_CLOSE:
            range = ProxyView.DISTANCE_CLOSE
            break
        case ProxyViewFilterDistant.CHOICE_DISTANT:
            range = ProxyView.DISTANCE_DISTANT
            break
        case ProxyViewFilterDistant.CHOICE_OFF:
            // Do nothing.
            break
        default:
            console.error('unexpected case in switch for ProxyViewFilterDistant in proxy-view-filters.')
    }
    return range <= 0 || distance <= range
}

/// ///// Registering filters ////////

/**
 * Registers {@link ProxyFilter}s at the {@link ProxyView} and holds the current
 * values of their respective options as specified by the sidebar.
 */
@injectable()
export class ProxyFilterHandler implements IActionHandler, IActionHandlerInitializer {
    /// / Sidebar filter options ////
    /** @see {@link ProxyViewFilterUnconnectedToOnScreen} */
    static filterUnconnectedToOnScreen: boolean

    /** @see {@link ProxyViewFilterUnconnectedToSelected} */
    static filterUnconnectedToSelected: boolean

    /** @see {@link ProxyViewFilterUnselected} */
    static filterUnselected: boolean

    /** @see {@link ProxyViewFilterDistant} */
    static filterDistant: string

    /// / Get filter option values ////
    /** Updates the proxy-view filter options specified in the {@link RenderOptionsRegistry}. */
    // the values are inverted so that the user enable showing the elements described by the filter explicitly
    private updateFilterOptions(renderOptionsRegistry: RenderOptionsRegistry): void {
        ProxyFilterHandler.filterUnconnectedToOnScreen = !renderOptionsRegistry.getValue(
            ProxyViewFilterUnconnectedToOnScreen
        )
        ProxyFilterHandler.filterUnconnectedToSelected = !renderOptionsRegistry.getValue(
            ProxyViewFilterUnconnectedToSelected
        )
        ProxyFilterHandler.filterUnselected = renderOptionsRegistry.getValue(ProxyViewFilterUnselected)
        ProxyFilterHandler.filterDistant = renderOptionsRegistry.getValue(ProxyViewFilterDistant)
    }

    /// / Register the filters ////
    handle(action: Action): void | Action | ICommand {
        /** Filters can be registered here, keep the documentation of {@link ProxyView.registerFilters()} in mind */
        const filters: ProxyFilter[] = [
            filterUnselected,
            filterUnconnectedToSelected,
            filterUnconnectedToOnScreen,
            filterDistant,
        ]

        if (action.kind === SendProxyViewAction.KIND) {
            const { proxyView } = action as SendProxyViewAction
            proxyView.registerFilters(
                // Ensure unique ids
                ...filters.map((filter) => ProxyFilterAndID.from(ProxyFilterHandler, filter))
            )
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        // Register to receive SendProxyViewActions
        registry.register(SendProxyViewAction.KIND, this)
    }

    /** The registry containing the filter options. */
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry

    @postConstruct()
    init(): void {
        // Register proxy-view filters in registry
        this.renderOptionsRegistry.registerAll(
            ProxyViewFilterCategory,
            ProxyViewFilterUnconnectedToOnScreen,
            ProxyViewFilterUnconnectedToSelected,
            ProxyViewFilterUnselected,
            ProxyViewFilterDistant
        )
        // Register to receive updates on registry changes
        this.renderOptionsRegistry.onChange(() => this.updateFilterOptions(this.renderOptionsRegistry))
    }
}
