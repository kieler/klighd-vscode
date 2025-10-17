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
import { Action, CenterAction, SetModelAction, SModelElement, UpdateModelAction } from 'sprotty-protocol'
import { createSemanticFilter } from '../filtering/util'
import { SearchBar } from './searchbar'
import { SearchBarPanel } from './searchbar-panel'
import { isContainerRendering, isKText, KRectangle, KText } from '../skgraph-models'
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
    id: string
    state?: 'show' | 'hide'
    panel: SearchBarPanel
}

// eslint-disable-next-line no-redeclare
export namespace ToggleSearchBarAction {
    export const KIND = 'toggleSearchBar'

    export function create(panel: SearchBarPanel, id: string, state?: 'show' | 'hide'): ToggleSearchBarAction {
        return {
            kind: KIND,
            id,
            state,
            panel,
        }
    }

    export function isThisAction(action: Action): action is ToggleSearchBarAction {
        return action.kind === KIND
    }
}

@injectable()
export class ToggleSearchBarHandler implements IActionHandler {
    handle(action: Action): void {
        if (ToggleSearchBarAction.isThisAction(action)) {
            if (action.id !== SearchBar.ID) return

            const newVisible = action.state === 'show'

            if (action.panel.isVisible !== newVisible) {
                action.panel.changeVisibility(newVisible)
                action.panel.update()
            }
        }
    }
}

export interface UpdateHighlightsAction extends Action {
    kind: typeof UpdateHighlightsAction.KIND
    selectedIndex: number
    previousIndex: number | undefined
    results: SearchResult[]
    panel: SearchBarPanel
}

// eslint-disable-next-line no-redeclare
export namespace UpdateHighlightsAction {
    export const KIND = 'updateHighlights'

    export function create(
        currentIndex: number,
        prevIndex: number | undefined,
        results: SearchResult[],
        panel: SearchBarPanel
    ): UpdateHighlightsAction {
        return {
            kind: KIND,
            selectedIndex: currentIndex,
            previousIndex: prevIndex,
            results,
            panel,
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

function createHighlightRectangle(
    elem: SModelElement,
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

/**
 * Remove all highlights
 * @param elem the root
 */
function removeHighlights(elem: SModelElement): void {
    const queue: SModelElement[] = [elem]

    while (queue.length > 0) {
        const element = queue.shift()!

        // Remove KText highlights
        if (isKText(element) && element.styles) {
            element.properties['klighd.rendering.highlight'] = 0
        }

        // Remove rectangle highlights from children
        if ('children' in element && Array.isArray(element.children)) {
            element.children = element.children.filter((child) => !child.id?.startsWith('highlightRect-'))
            element.children.forEach((child) => queue.push(child))
        }

        // Handle data array (for renderings)
        const { data } = element as any
        if (Array.isArray(data)) {
            for (const item of data) {
                if (item && 'children' in item && Array.isArray(item.children)) {
                    item.children = item.children.filter(
                        (child: { id: string }) => !child.id?.startsWith('highlightRect-')
                    )
                    item.children.forEach((c: any) => queue.push(c))
                }
            }
        }
    }
}

export interface RetrieveTagsActions extends Action {
    kind: typeof RetrieveTagsAction.KIND
    panel: SearchBarPanel
}

export namespace RetrieveTagsAction {
    export const KIND = 'retrieveTags'

    export function create(panel: SearchBarPanel): RetrieveTagsActions {
        return {
            kind: KIND,
            panel,
        }
    }

    export function isThisAction(action: Action): action is RetrieveTagsActions {
        return action.kind === KIND
    }
}

export interface SearchAction extends Action {
    kind: typeof SearchAction.KIND
    id: string
    panel: SearchBarPanel
    textInput: string
    tagInput: string
}

// eslint-disable-next-line no-redeclare
export namespace SearchAction {
    export const KIND = 'handleSearch'

    export function create(panel: SearchBarPanel, id: string, textInput: string, tagInput: string): SearchAction {
        return {
            kind: KIND,
            id,
            textInput,
            tagInput,
            panel,
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
export class HandleSearchAction implements IActionHandler {
    private static currentModel?: SModelElement

    private OPACITY_INCREMENT: number = 2

    private HIGHLIGHT_MATCH: number = 2

    private HIGHLIGHT_MAIN_MATCH: number = 1

    // TODO: ktexts can't have a border, so instead of setting highlight directly on the ktext, a rectangle with the correct
    //       size should be added behind it instead (this does pose an additional issue with the foreground then not being
    //       applied to the text itself, so it's a choice, support border or support foreground highlight)

    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(SetModelAction.KIND, this)
        registry.register(UpdateModelAction.KIND, this)
        registry.register(SearchAction.KIND, this)
        registry.register(ClearHighlightsAction.KIND, this)
        registry.register(UpdateHighlightsAction.KIND, this)
        registry.register(RetrieveTagsAction.KIND, this)
    }

    handle(action: Action): void {
        /* Intercept model during SetModelAction / UpdateModelAction */
        if (action.kind === SetModelAction.KIND || action.kind === UpdateModelAction.KIND) {
            const model = (action as SetModelAction).newRoot as SModelElement
            HandleSearchAction.currentModel = model
            return
        }

        if (!HandleSearchAction.currentModel) return

        const modelId = HandleSearchAction.currentModel?.id

        /* Handle ClearHighlightsActions */
        if (ClearHighlightsAction.isThisAction(action)) {
            removeHighlights(HandleSearchAction.currentModel)
            // make changes visible
            if (modelId && this.actionDispatcher) {
                this.actionDispatcher.dispatch(CenterAction.create([modelId]))
            }
        } else if (UpdateHighlightsAction.isThisAction(action)) {
            /* Update highlights to show current result orange  */
            if (action.selectedIndex === undefined || !action.results || !action.panel) return
            this.updateHighlights(action.selectedIndex, action.previousIndex, action.results, action.panel)
            this.actionDispatcher.dispatch(CenterAction.create([modelId]))
        } else if (RetrieveTagsAction.isThisAction(action)) {
            /* searches for all tags on the model */
            if (!action.panel) return
            this.retrieveTags(HandleSearchAction.currentModel, action.panel)
        }

        /* Handle search itself */
        if (!SearchAction.isThisAction(action)) return
        if (action.id !== SearchBar.ID) return

        const query = action.textInput.trim().toLowerCase()
        const tagQuery = action.tagInput

        const results: SearchResult[] = this.searchModel(HandleSearchAction.currentModel, query, tagQuery, action.panel)
        this.highlightSearchResults(results)
        this.updateHighlights(0, undefined, results, action.panel)

        action.panel.setResults(results)
        action.panel.update()
    }

    /**
     * Looks for all tags on the current graph to display them on the panel.
     * @param root the model
     * @param panel the search bar panel
     */
    private retrieveTags(root: SModelElement, panel: SearchBarPanel): void {
        const results = this.searchModel(root, '', 'true', panel).map((result) => result.element)
        if (!results) return

        const seenTags = new Set<string>()
        const tags: { tag: string; num?: number }[] = getReservedStructuralTags().map((tag) => ({ tag }))

        const collectFrom = (obj: any) => {
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
            const currentElem = results.shift()! as any

            collectFrom(currentElem)

            if (Array.isArray(currentElem.data)) {
                for (const child of currentElem.data) {
                    collectFrom(child)
                }
            }
        }

        tags.sort((a, b) => a.tag.localeCompare(b.tag))
        panel.setTags(tags)
    }

    /**
     * Remove a specific highlight
     * @param searchResult the search result for which to remove the highlight
     */
    private removeSpecificHighlight(searchResult: SearchResult) {
        const elemID = searchResult.element.id

        const { element } = searchResult

        if (isKText(element) && element.styles) {
            element.properties['klighd.rendering.highlight'] = 0
        }

        if ('children' in element && Array.isArray(element.children)) {
            element.children = element.children.filter((child) => !child.id?.includes(`highlightRect-${elemID}`))
        }

        const { data } = element as any
        if (Array.isArray(data)) {
            for (const item of data) {
                if (item && 'children' in item && Array.isArray(item.children)) {
                    item.children = item.children.filter(
                        (child: { id: string }) => !child.id?.includes(`highlightRect-${elemID}`)
                    )
                }
            }
        }
    }

    /**
     * Adds highlighting to labels or nodes
     * @param searchResult the the search result that shall be highlighted
     * @param bounds the position and size of the highlight
     */
    private addHighlightToElement(searchResult: SearchResult, bounds: HighlightBounds, highlight: number): void {
        const { data } = searchResult.element as any
        if (Array.isArray(data)) {
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
    private updateHighlights(
        selectedIndex: number,
        lastIndex: number | undefined,
        results: SearchResult[],
        panel: SearchBarPanel
    ): void {
        if (selectedIndex >= results.length) return

        this.removeSpecificHighlight(results[selectedIndex])

        const lastElem = lastIndex !== undefined ? results[lastIndex] : undefined
        if (lastElem) this.removeSpecificHighlight(lastElem)

        if (panel.textInput === '') {
            if (lastElem) this.addHighlightToElement(lastElem, this.extractBounds(lastElem), this.HIGHLIGHT_MATCH)
            this.addHighlightToElement(
                results[selectedIndex],
                this.extractBounds(results[selectedIndex]),
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
     * @param element the text field of the element
     * @param query the user input
     * @param bounds the position and size of the possible highlight
     * @param results the array containing all results
     * @param textRes the array containing all {@param text} matches
     */
    private processTextMatch(
        parent: SModelElement,
        element: any,
        query: string,
        filter: (el: any) => boolean,
        results: SearchResult[],
        regex: RegExp | null
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
    private processElement(element: SModelElement, results: SearchResult[]) {
        const name = this.extractDisplayName(element)
        const result = new SearchResult(element, undefined, name)
        results.push(result)
    }

    /**
     * Extracts bounds from an element
     * @param element the element, whose bounds need to be extracted
     */
    private extractBounds(element: any): HighlightBounds {
        const bounds = element?.properties?.['klighd.lsp.calculated.bounds']

        if (!bounds) {
            return { x: -1, y: -1, width: -1, height: -1 }
        }

        return bounds
    }

    /**
     * Helper function for regular expressions
     * @param query the user input
     * @param panel our searchbar panel
     * @returns a parsed regular expression or an error
     */
    private compileRegex(query: string, panel: SearchBarPanel): RegExp | null {
        try {
            return new RegExp(query, 'i')
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e)
            panel.setError(errorMessage)
            return null
        }
    }

    /**
     * Perform a breadth-first search on {@param root} to find {@param query}
     * @param root the model
     * @param query the user input
     * @param panel the search bar panel
     * @returns array of results
     */
    private searchModel(root: SModelElement, query: string, tagQuery: string, panel: SearchBarPanel): SearchResult[] {
        const results: SearchResult[] = []
        const regex = panel.isRegex ? this.compileRegex(query, panel) : null
        const lowerQuery = query.toLowerCase()
        const queue: SModelElement[] = [root]

        /**
         * Go into a rendering to look for the text field and compare it to the input
         * @param rendering KText or KLabel
         * @param parent KContainerRendering that contains {@param rendering}
         */
        const visitRendering = (rendering: any, parent: SModelElement): void => {
            if (!rendering) return

            /* Check KText */
            if (isKText(rendering) && rendering.text) {
                this.processTextMatch(parent, rendering, lowerQuery, filter, results, regex)
            }

            /* Check KContainerElements */
            if (isContainerRendering(rendering)) {
                for (const child of rendering.children ?? []) {
                    visitRendering(child, parent)
                }
            }
        }

        if (query === '' && tagQuery === '') {
            return results
        }

        let filter: (el: any) => boolean = () => true
        if (tagQuery !== '') {
            try {
                filter = createSemanticFilter(tagQuery)
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e)
                panel.setError(errorMessage)
                return results
            }
        }

        while (queue.length > 0) {
            const element = queue.shift()!

            if (query === '') {
                /* add all elements if text query is empty */
                if (filter(element)) {
                    this.processElement(element, results)
                }
            } else {
                /* handle elements with text field */
                switch (element.type) {
                    case 'label':
                    case 'edge':
                    case 'node':
                    case 'port':
                        if ('text' in element) {
                            const { text } = element as any
                            if (typeof text === 'string' && text.trim()) {
                                this.processTextMatch(element, element, lowerQuery, filter, results, regex)
                            }
                        }
                        break
                    default:
                        break
                }

                /* Process data field for renderings */
                const dataArr = (element as any).data
                if (Array.isArray(dataArr) && dataArr.length > 0) {
                    const data = dataArr[0]
                    if (data && Array.isArray(data.children)) {
                        for (const child of data.children) {
                            visitRendering(child, element)
                        }
                    }
                }
            }

            /* Add children to queue */
            if ('children' in element && Array.isArray((element as any).children)) {
                for (const child of (element as any).children) {
                    queue.push(child)
                }
            }
        }

        return results
    }

    /**
     * Finds a name to display for nodes that meet the searched tags
     * @param element the node
     * @returns name for result list
     */
    private extractDisplayName(element: SModelElement): string {
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
