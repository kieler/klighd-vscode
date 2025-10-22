/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2025 by
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

import { inject, injectable } from 'inversify'
import {
    ActionHandlerRegistry,
    IActionDispatcher,
    IActionHandler,
    SetUIExtensionVisibilityAction,
    TYPES,
} from 'sprotty'
import { Action, CenterAction, SetModelAction, SModelRoot, UpdateModelAction } from 'sprotty-protocol'
import { KGraphData, SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes'
import { createSemanticFilter } from '../filtering/util'
import { SearchBar } from './searchbar'
import { SearchBarPanel } from './searchbar-panel'
import {
    isContainerRendering,
    isKText,
    isRendering,
    isSKGraphElement,
    isSKLabel,
    KRectangle,
    KRendering,
    KText,
    SKLabel,
} from '../skgraph-models'
import { getReservedStructuralTags } from '../filtering/reserved-structural-tags'
import { SearchResult } from './search-results'

export type ShowSearchBarAction = SetUIExtensionVisibilityAction

/** add UI container */
// eslint-disable-next-line no-redeclare
export namespace ShowSearchBarAction {
    export function create(): ShowSearchBarAction {
        return SetUIExtensionVisibilityAction.create({
            extensionId: SearchBar.ID,
            visible: true,
        })
    }
}

/** hide/unhide the search bar panel */
export interface ToggleSearchBarAction extends Action {
    kind: typeof ToggleSearchBarAction.KIND
    state?: 'show' | 'hide'
    panel: SearchBarPanel
}

// eslint-disable-next-line no-redeclare
export namespace ToggleSearchBarAction {
    export const KIND = 'toggleSearchBar'

    export function create(panel: SearchBarPanel, state?: 'show' | 'hide'): ToggleSearchBarAction {
        return {
            kind: KIND,
            state,
            panel,
        }
    }

    export function isThisAction(action: Action): action is ToggleSearchBarAction {
        return action.kind === KIND
    }
}

export interface UpdateHighlightsAction extends Action {
    kind: typeof UpdateHighlightsAction.KIND
    selectedIndex: number
    previousIndex: number | undefined
    results: SearchResult[]
}

// eslint-disable-next-line no-redeclare
export namespace UpdateHighlightsAction {
    export const KIND = 'updateHighlights'

    export function create(
        currentIndex: number,
        prevIndex: number | undefined,
        results: SearchResult[]
    ): UpdateHighlightsAction {
        return {
            kind: KIND,
            selectedIndex: currentIndex,
            previousIndex: prevIndex,
            results,
        }
    }

    export function isThisAction(action: Action): action is UpdateHighlightsAction {
        return action.kind === KIND
    }
}

export interface ClearHighlightsAction extends Action {
    kind: typeof ClearHighlightsAction.KIND
}

// eslint-disable-next-line no-redeclare
export namespace ClearHighlightsAction {
    export const KIND = 'clearHighlights'

    export function create(): ClearHighlightsAction {
        return {
            kind: KIND,
        }
    }

    export function isThisAction(action: Action): action is ClearHighlightsAction {
        return action.kind === KIND
    }
}

// TODO: extract this KRectangle creation to a dedicated JS KGraph creation library
function createHighlightRectangle(
    elem: SKGraphElement,
    xPos: number,
    yPos: number,
    width: number,
    height: number,
    highlight: number
): KRectangle {
    return {
        type: 'KRectangleImpl',
        id: `highlightRect-${elem.id}`,
        children: [],
        properties: {
            x: xPos,
            y: yPos,
            width,
            height,
            'klighd.rendering.highlight': highlight,
        },
        actions: [],
        styles: [],
    }
}

export interface RetrieveTagsActions extends Action {
    kind: typeof RetrieveTagsAction.KIND
}

export namespace RetrieveTagsAction {
    export const KIND = 'retrieveTags'

    export function create(): RetrieveTagsActions {
        return {
            kind: KIND,
        }
    }

    export function isThisAction(action: Action): action is RetrieveTagsActions {
        return action.kind === KIND
    }
}

export interface SearchAction extends Action {
    kind: typeof SearchAction.KIND
    id: string
    textInput: string
    tagInput: string
}

// eslint-disable-next-line no-redeclare
export namespace SearchAction {
    export const KIND = 'handleSearch'

    export function create(id: string, textInput: string, tagInput: string): SearchAction {
        return {
            kind: KIND,
            id,
            textInput,
            tagInput,
        }
    }

    export function isThisAction(action: Action): action is SearchAction {
        return action.kind === KIND
    }
}

interface HighlightBounds {
    x: number
    y: number
    width: number
    height: number
}

@injectable()
export class SearchBarActionHandler implements IActionHandler {
    private static currentModel?: SKGraphElement

    private OPACITY_INCREMENT: number = 2

    private HIGHLIGHT_MATCH: number = 2

    private HIGHLIGHT_MAIN_MATCH: number = 1

    private panel: SearchBarPanel

    // TODO: ktexts can't have a border, so instead of setting highlight directly on the ktext, a rectangle with the correct
    //       size should be added behind it instead (this does pose an additional issue with the foreground then not being
    //       applied to the text itself, so it's a choice, support border or support foreground highlight)

    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(SetModelAction.KIND, this)
        registry.register(UpdateModelAction.KIND, this)
        registry.register(ToggleSearchBarAction.KIND, this)
        registry.register(SearchAction.KIND, this)
        registry.register(ClearHighlightsAction.KIND, this)
        registry.register(UpdateHighlightsAction.KIND, this)
        registry.register(RetrieveTagsAction.KIND, this)
    }

    handle(action: Action): void {
        /* Intercept model during SetModelAction / UpdateModelAction */
        if (action.kind === SetModelAction.KIND || action.kind === UpdateModelAction.KIND) {
            const root: SModelRoot = (action as SetModelAction).newRoot
            if (root.type !== 'graph') {
                return
            }
            SearchBarActionHandler.currentModel = root as unknown as SKGraphElement
            if (this.panel.isVisible) {
                this.actionDispatcher.dispatch(
                    SearchAction.create(SearchBar.ID, this.panel.textInput ?? '', this.panel.tagSearch ?? '')
                )
            }
            return
        }

        if (!SearchBarActionHandler.currentModel) return

        const modelId = SearchBarActionHandler.currentModel?.id

        if (ToggleSearchBarAction.isThisAction(action)) {
            if (!this.panel) {
                this.panel = action.panel
            }

            const newVisible = action.state === 'show'

            if (this.panel.isVisible !== newVisible) {
                this.panel.changeVisibility(newVisible)
                this.panel.update()
            }
        } else if (ClearHighlightsAction.isThisAction(action)) {
            /* Handle ClearHighlightsActions */
            this.removeHighlights(this.panel)
            // make changes visible
            if (modelId && this.actionDispatcher) {
                this.actionDispatcher.dispatch(CenterAction.create([modelId]))
            }
        } else if (UpdateHighlightsAction.isThisAction(action)) {
            /* Update highlights to show current result orange  */
            if (action.selectedIndex === undefined || !action.results || !this.panel) return
            this.updateHighlights(action.selectedIndex, action.previousIndex, action.results)
            if (modelId && this.actionDispatcher) {
                this.actionDispatcher.dispatch(CenterAction.create([modelId]))
            }
        } else if (RetrieveTagsAction.isThisAction(action)) {
            /* searches for all tags on the model */
            if (!this.panel) return
            this.retrieveTags(SearchBarActionHandler.currentModel)
        } else if (SearchAction.isThisAction(action)) {
            /* Handle search itself */
            const query = action.textInput.trim().toLowerCase()
            const tagQuery = action.tagInput

            const results: SearchResult[] = this.searchModel(SearchBarActionHandler.currentModel, query, tagQuery)

            this.highlightSearchResults(results)
            this.updateHighlights(this.panel.getLastActiveIndex, undefined, results)
            if (modelId && this.actionDispatcher) {
                this.actionDispatcher.dispatch(CenterAction.create([modelId]))
            }

            this.panel.setResults(results)
            this.panel.update()
        }
    }

    /**
     * Looks for all tags on the current graph to display them on the panel.
     * @param root the model
     * @param panel the search bar panel
     */
    private retrieveTags(root: SKGraphElement): void {
        const results = this.searchModel(root, '', 'true').map((result) => result.element)
        if (!results) return

        const seenTags = new Set<string>()
        const tags: { tag: string; num?: number }[] = getReservedStructuralTags().map((tag) => ({ tag }))

        const collectFrom = (obj: SKGraphElement | KRendering) => {
            const tagProp = obj?.properties?.['de.cau.cs.kieler.klighd.semanticFilter.tags']
            if (Array.isArray(tagProp)) {
                for (const item of tagProp) {
                    if (typeof item.tag === 'string') {
                        const { tag } = item
                        if (!seenTags.has(tag)) {
                            seenTags.add(tag)
                            tags.push({ tag, num: item.num })
                        }
                    }
                }
            }
        }

        while (results.length > 0) {
            const currentElem = results.shift()!

            collectFrom(currentElem)

            if (Array.isArray(currentElem.data)) {
                for (const child of currentElem.data) {
                    if (isRendering(child)) {
                        collectFrom(child)
                    }
                }
            }
        }

        tags.sort((a, b) => a.tag.localeCompare(b.tag))
        this.panel.setTags(tags)
    }

    /**
     * Remove all highlights
     * @param results the highlighted results
     */
    private removeHighlights(panel: SearchBarPanel): void {
        for (const result of panel.getResults) {
            this.removeSpecificHighlight(result)
        }
    }

    /**
     * Remove a specific highlight
     * @param searchResult the search result for which to remove the highlight
     */
    private removeSpecificHighlight(searchResult: SearchResult) {
        const elemID = searchResult.element.id

        const { element, kText } = searchResult

        if (kText) {
            kText.properties['klighd.rendering.highlight'] = 0
        }

        if (isContainerRendering(element)) {
            element.removeAll((child) => !child.id?.includes(`highlightRect-${elemID}`))
        }

        const { data } = element
        for (const item of data) {
            // TODO: special case toplevel no container rendering
            if (isContainerRendering(item)) {
                item.children = item.children.filter(
                    (child: { id: string }) => !child.id?.includes(`highlightRect-${elemID}`)
                )
            }
        }
    }

    /**
     * Adds highlighting to labels or nodes
     * @param searchResult the the search result that shall be highlighted
     * @param bounds the position and size of the highlight
     */
    private addHighlightToElement(searchResult: SearchResult, bounds: HighlightBounds, highlight: number): void {
        const { data } = searchResult.element
        if (data !== undefined) {
            for (const item of data) {
                if (isContainerRendering(item)) {
                    const alreadyHasHighlight = item.children?.some((child) => child.id?.startsWith('highlightRect-'))
                    if (!alreadyHasHighlight) {
                        const highlightRect = createHighlightRectangle(
                            searchResult.element,
                            bounds.x,
                            bounds.y,
                            bounds.width,
                            bounds.height,
                            highlight + this.OPACITY_INCREMENT
                        )
                        item.children = [...(item.children ?? []), highlightRect]
                    }
                } else if (isKText(item)) {
                    searchResult.kText!.properties['klighd.rendering.highlight'] = highlight
                }
            }
        }
    }

    /**
     * Highlights the selectedIndex-th result orange and keeps the other indices yellow
     * @param selectedIndex the results the user is currenlty panned to.
     * @param lastIndex the previous selectedIndex (currently orange -> needs to be yellow)
     * @param results the search results
     */
    private updateHighlights(selectedIndex: number, lastIndex: number | undefined, results: SearchResult[]): void {
        if (selectedIndex >= results.length) return

        this.removeSpecificHighlight(results[selectedIndex])

        const lastElem = lastIndex !== undefined ? results[lastIndex] : undefined
        if (lastElem) this.removeSpecificHighlight(lastElem)

        if (this.panel.textInput === '') {
            if (lastElem)
                this.addHighlightToElement(lastElem, this.extractBounds(lastElem.element), this.HIGHLIGHT_MATCH)
            this.addHighlightToElement(
                results[selectedIndex],
                this.extractBounds(results[selectedIndex].element),
                this.HIGHLIGHT_MAIN_MATCH
            )
        } else {
            if (results[selectedIndex].kText) {
                results[selectedIndex].kText!.properties['klighd.rendering.highlight'] = this.HIGHLIGHT_MAIN_MATCH
            } else {
                const bounds = this.extractBounds(results[selectedIndex].element)
                this.addHighlightToElement(results[selectedIndex], bounds, this.HIGHLIGHT_MAIN_MATCH)
            }
            if (lastElem) {
                if (lastElem.kText) {
                    lastElem.kText.properties['klighd.rendering.highlight'] = this.HIGHLIGHT_MATCH
                } else {
                    const bounds = this.extractBounds(lastElem.element)
                    this.addHighlightToElement(lastElem, bounds, this.HIGHLIGHT_MATCH)
                }
            }
        }
    }

    /**
     * Highlights all search results
     * @param results the search results to highlight
     */
    private highlightSearchResults(results: SearchResult[]) {
        for (const result of results) {
            if (result.kText) {
                result.kText.properties['klighd.rendering.highlight'] = this.HIGHLIGHT_MATCH
            } else {
                const bounds = this.extractBounds(result.element)
                this.addHighlightToElement(result, bounds, this.HIGHLIGHT_MATCH)
            }
        }
    }

    /**
     * Checks if text matches query and possibly adds the element to results with highlighting
     * @param parent the graph element containing the text
     * @param element the rendering containing the text or the label itself
     * @param query the user input
     * @param bounds the position and size of the possible highlight
     * @param results the array containing all results
     * @param textRes the array containing all {@param text} matches
     */
    private processTextMatch(
        parent: SKGraphElement,
        element: KText | SKLabel,
        query: string,
        filter: (el: SKGraphElement) => boolean,
        results: SearchResult[],
        regex: RegExp | undefined
    ): void {
        const { text } = element as unknown as KText
        const matches = regex ? regex.test(text) : text.toLowerCase().includes(query)

        if (matches && filter(parent)) {
            const result = new SearchResult(parent, undefined, text)
            if (isKText(element)) {
                result.kText = element
            }
            results.push(result)
        }
    }

    /**
     * Add an element to the results and highlight it.
     * @param element the graph element
     * @param results the array containing all results
     * @param textRes the array containing all text matches
     */
    private processElement(element: SKGraphElement, results: SearchResult[]) {
        const name = this.extractDisplayName(element)
        const result = new SearchResult(element, undefined, name)
        results.push(result)
    }

    /**
     * Extracts bounds from an element
     * @param element the element, whose bounds need to be extracted
     */
    private extractBounds(element: SKGraphElement): HighlightBounds {
        const bounds = element?.properties?.['klighd.lsp.calculated.bounds']

        if (!bounds) {
            return { x: -1, y: -1, width: -1, height: -1 }
        }

        return bounds as HighlightBounds
    }

    /**
     * Helper function for regular expressions
     * @param query the user input
     * @returns a parsed regular expression or an error
     */
    private compileRegex(query: string): RegExp | undefined {
        try {
            return new RegExp(query, 'i')
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e)
            this.panel.setError(errorMessage)
            return undefined
        }
    }

    /**
     * Perform a breadth-first search on {@param root} to find {@param query}
     * @param root the model
     * @param query the user input
     * @returns array of results
     */
    private searchModel(root: SKGraphElement, query: string, tagQuery: string): SearchResult[] {
        const results: SearchResult[] = []
        const regex = this.panel.isRegex ? this.compileRegex(query) : undefined
        const lowerQuery = query.toLowerCase()
        const queue: (SKGraphElement | KRendering)[] = [root as SKGraphElement]

        if (query === '' && tagQuery === '') {
            return results
        }

        let filter: (el: SKGraphElement) => boolean = () => true
        if (tagQuery !== '') {
            try {
                filter = createSemanticFilter(tagQuery)
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e)
                this.panel.setError(errorMessage)
                return results
            }
        }

        while (queue.length > 0) {
            const element = queue.shift()!

            if (query === '') {
                /* add all elements if text query is empty */
                if (isSKGraphElement(element) && filter(element)) {
                    this.processElement(element, results)
                }
            } else {
                /* handle elements with text field */
                if (isSKLabel(element)) {
                    const { text } = element
                    if (text.trim()) {
                        this.processTextMatch(element, element, lowerQuery, filter, results, regex)
                    }
                }

                /* Process data field for renderings */
                if (isSKGraphElement(element)) {
                    const dataArr: KGraphData[] = element.data
                    if (dataArr.length > 0) {
                        const data = dataArr[0]
                        // TODO: special case toplevel no container rendering
                        if (isContainerRendering(data)) {
                            for (const child of data.children) {
                                this.visitRendering(child, element, lowerQuery, filter, results, regex)
                            }
                        }
                    }
                }
            }

            /* Add children to queue */
            if (isContainerRendering(element) || isSKGraphElement(element) || element.type === 'graph') {
                // TODO: bad don't do this
                for (const child of (element as any).children) {
                    queue.push(child as SKGraphElement | KRendering)
                }
            }
        }

        return results
    }

    /**
     * Go into a rendering to look for the text field and compare it to the input
     * @param rendering KText or KLabel
     * @param parent KContainerRendering that contains {@param rendering}
     * @param query the query string
     * @param filter the filter function
     * @param results the results object to store search results in
     * @param regex a regex if there is one
     */
    private visitRendering(
        rendering: KRendering,
        parent: SKGraphElement,
        query: string,
        filter: (el: SKGraphElement) => boolean,
        results: SearchResult[],
        regex: RegExp | undefined
    ): void {
        if (!rendering) return

        /* Check KText */
        if (isKText(rendering) && rendering.text) {
            this.processTextMatch(parent, rendering, query, filter, results, regex)
        }

        /* Check KContainerElements */
        if (isContainerRendering(rendering)) {
            for (const child of rendering.children ?? []) {
                this.visitRendering(child, parent, query, filter, results, regex)
            }
        }
    }

    /**
     * Finds a name to display for nodes that meet the searched tags
     * @param element the node
     * @returns name for result list
     */
    private extractDisplayName(element: SKGraphElement): string {
        const segments = element.id.split('$')
        for (let i = segments.length - 1; i >= 0; i--) {
            const segment = segments[i]
            if (segment?.length > 1) {
                switch (segment.charAt(0)) {
                    case 'N':
                    case 'E':
                    case 'P':
                    case 'L':
                        return segment.substring(1)
                    default:
                        break
                }
            }
        }
        return element.id
    }
}
