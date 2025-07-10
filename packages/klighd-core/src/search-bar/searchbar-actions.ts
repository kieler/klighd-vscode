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

import { createSemanticFilter } from '../filtering/util'
import { inject, injectable } from 'inversify'
import { SearchBar } from './searchbar'
import { SearchBarPanel } from './searchbar-panel'
import { isContainerRendering, isKText, KColoring, KRectangle, KText } from '../skgraph-models'
import { ActionHandlerRegistry, IActionDispatcher, IActionHandler, rgb, SetUIExtensionVisibilityAction, TYPES } from 'sprotty'
import { Action, CenterAction, SetModelAction, SModelElement, UpdateModelAction } from 'sprotty-protocol'

export type ShowSearchBarAction = SetUIExtensionVisibilityAction

/** add UI container */
export namespace ShowSearchBarAction {
    export function create(): ShowSearchBarAction {
        return SetUIExtensionVisibilityAction.create({
            extensionId: SearchBar.ID,
            visible: true
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
        if(ToggleSearchBarAction.isThisAction(action)) {
            if(action.id !== SearchBar.ID) return

            const newVisible = action.state === 'show' ? true :
                                action.state === 'hide' ? false :
                                false
            
            if(action.panel.isVisible !== newVisible) {
                action.panel.changeVisibility(newVisible)
                action.panel.update()
            }
        }
    }
} 

export interface ClearHighlightsAction extends Action {
    kind: typeof ClearHighlightsAction.KIND
}   

export namespace ClearHighlightsAction {
    export const KIND = 'clearHighlights'

    export function create() : ClearHighlightsAction {
        return {
            kind: KIND
        }
    }

    export function isThisAction(action: Action): action is ClearHighlightsAction {
        return action.kind === KIND
    }
}

function createHighlightRectangle(idSuffix: string | number, xPos: number, yPos: number, width: number, height: number): KRectangle {
    const highlight: KColoring = {
        type: 'KBackgroundImpl',
        color: rgb(255, 255, 0),
        alpha: 50,
        gradientAngle: 0,
        propagateToChildren: false,
        selection: false,
    }

    const noStroke: KColoring = {
        type: 'KForegroundImpl',
        color: rgb(0,0,0),
        alpha: 0,
        propagateToChildren: false,
        selection: false,
        gradientAngle: 0
    };

    return {
        type: 'KRectangleImpl',
        id: `highlightRect-${idSuffix}`,
        children: [],
        properties: {
            x: xPos,
            y: yPos,
            width: width,
            height: height,
        },
        actions: [],
        styles: [highlight,noStroke],
    }
}

/**
 * Remove either all highlights when {@param elem = root} or from a specific element
 * @param elem a specific element or the whole model
 */
function removeHighlights(elem: SModelElement): void {
    const queue: SModelElement[] = [elem]

    while (queue.length > 0) {
        const element = queue.shift()!

        // Remove KText highlights
        if(isKText(element) && element.styles) {
            element.styles = element.styles.filter((style: any) =>
                !(style.type === 'KBackgroundImpl' && style.modifierId === 'searchHighlight')
            )
        }

        // Remove rectangle highlights from children
        if('children' in element && Array.isArray(element.children)) {
            element.children = element.children.filter(child => !child.id?.startsWith('highlightRect-'))
            element.children.forEach(child => queue.push(child))
        }

        // Handle data array (for renderings)
        const data = (element as any).data
        if(Array.isArray(data)) {
            for (const item of data) {
                if(item && 'children' in item && Array.isArray(item.children)) {
                    item.children = item.children.filter((child: { id: string }) => !child.id?.startsWith('highlightRect-'))
                    item.children.forEach((c: any) => queue.push(c))
                }
            }
        }
    }
}

export interface SearchAction extends Action {
    kind: typeof SearchAction.KIND
    id: string
    panel: SearchBarPanel
    textInput: string,
    tagInput: string
}

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
    x: number,
    y: number,
    width: number,
    height: number
}


@injectable()
export class HandleSearchAction implements IActionHandler {

    private static currentModel?: SModelElement
    
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(SetModelAction.KIND, this)
        registry.register(UpdateModelAction.KIND, this)
        registry.register(SearchAction.KIND, this)
        registry.register(ClearHighlightsAction.KIND, this)
    }

    handle(action: Action): void {
        /* Intercept model during SetModelAction / UpdateModelAction */
        if(action.kind === SetModelAction.KIND || action.kind === UpdateModelAction.KIND) {
            const model = (action as SetModelAction).newRoot as SModelElement
            HandleSearchAction.currentModel = model
            return
        }
        
        if(!HandleSearchAction.currentModel) return

        const modelId = HandleSearchAction.currentModel?.id

        /* Handle ClearHighlightsActions */
        if(ClearHighlightsAction.isThisAction(action)) {
            removeHighlights(HandleSearchAction.currentModel)
            // make changes visible
            if(modelId && this.actionDispatcher) {
                this.actionDispatcher.dispatch(CenterAction.create([modelId]))
            }
        }
        
        /* Handle search itself */
        if(!SearchAction.isThisAction(action)) return
        if(action.id !== SearchBar.ID) return

        const query = action.textInput.trim().toLowerCase()
        const tagQuery = action.tagInput

        const isTextQuery = query !== ''
        const isTagQuery = tagQuery !== ''

        if(!isTextQuery && !isTagQuery) return

        const results: SModelElement[] =
            isTagQuery
                ? this.searchTags(HandleSearchAction.currentModel, query, tagQuery, action.panel)
                : this.searchModel(HandleSearchAction.currentModel, query, action.panel)
       
        action.panel.setResults(results)
        action.panel.update()
    }

    /**
     * Adds highlighting to labels or nodes
     * @param element the element whose child gets the highlight
     * @param bounds the position and size of the highlight
     */
    private addHighlightToElement(element: SModelElement, bounds: HighlightBounds, index: number): void {
        const data = (element as any).data
        if(Array.isArray(data)) {
            for (const item of data) {
                if(isContainerRendering(item)) {
                    const alreadyHasHighlight = item.children?.some(child => child.id?.startsWith('highlightRect-'))
                    if(!alreadyHasHighlight) {
                        const highlightRect = createHighlightRectangle(index, bounds.x, bounds.y, bounds.width, bounds.height)
                        item.children = [...(item.children ?? []), highlightRect]
                    }
                }
            }
        }
    }

    /**
     * Adds highlighting directly to the text element by modifying its styles
     * @param textElement the KTextImpl element to highlight
     */
    private addHighlightToKText(textElement: any): void {
        if(!textElement.styles) {
            textElement.styles = []
        }

        const alreadyHighlighted = textElement.styles.some((style: any) =>
            style.type === 'KBackgroundImpl' &&
            style.color?.red === 255 &&
            style.color?.green === 255 &&
            style.color?.blue === 0 &&
            style.highlightId === 'searchHighlight'
        )

        if(!alreadyHighlighted) {
            const highlightStyle: KColoring = {
                type: 'KBackgroundImpl',
                color: rgb(255, 255, 0),
                alpha: 127,
                gradientAngle: 0,
                propagateToChildren: false,
                selection: false,
                modifierId: 'searchHighlight'
            }
            
            textElement.styles.push(highlightStyle)
        }
    }

    /**
     * Checks if text matches query and possibly adds the element to results with highlighting
     * @param element the graph element containing the text
     * @param text the text field of the element
     * @param query the user input
     * @param bounds the position and size of the possible highlight
     * @param results the array containing all results
     * @param textRes the array containing all {@param text} matches
     */
    private processTextMatch(parent: SModelElement, element: SModelElement, query: string, results: SModelElement[], textRes: string[], regex: RegExp | null, index: number): void {
        const text = (element as KText).text
        const matches = regex ? regex.test(text) : text.toLowerCase().includes(query)

        if(matches) {
            results.push(parent)
            textRes.push(text)
            if(isKText(element)) {
                this.addHighlightToKText(element)
            } else {
                const bounds = this.extractBounds(element)
                this.addHighlightToElement(parent, bounds, index)
            }
        }
    }

    /**
     * Extracts bounds from an element
     * @param element the element, whose bounds need to be extracted
     */
    private extractBounds(element: any): HighlightBounds {
        const bounds = element?.properties?.['klighd.lsp.calculated.bounds']

        if(!bounds) {
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
    private searchModel(root: SModelElement, query: string, panel: SearchBarPanel): SModelElement[] {
        const results: SModelElement[] = []
        const textRes: string[] = []
        const regex = panel.isRegex ? this.compileRegex(query, panel) : null
        const lowerQuery = query.toLowerCase()
        const queue: SModelElement[] = [root]
        let highlightIndex = 1

        /**
         * Go into a rendering to look for the text field and compare it to the input
         * @param rendering KText or KLabel
         * @param parent KContainerRendering that contains {@param rendering}
         */
        const visitRendering = (rendering: any, parent: SModelElement, index: number): void => {
            if(!rendering) return 

            /* Check KText */
            if(isKText(rendering) && rendering.text) {
                this.processTextMatch(parent, rendering, lowerQuery, results, textRes, regex, index)
            }

            /* Check KContainerElements */
            if(isContainerRendering(rendering)) {
                for (const child of rendering.children ?? []) {
                    visitRendering(child, parent, results.length + 1)
                }
            }
        }

        while (queue.length > 0) {
            const element = queue.shift()!

            /* handle elements with text field */
            switch (element.type) {
                case 'label':
                case 'edge':
                case 'node':
                case 'port':
                    if('text' in element) {
                        const text = (element as any).text;
                        if(typeof text === 'string' && text.trim()) {
                            const resultsBefore = results.length
                            this.processTextMatch(element, element, lowerQuery, results, textRes, regex, highlightIndex);
                            if (results.length > resultsBefore) highlightIndex++
                        }
                    }
                    break;
            }

            /* Process data field for renderings */
            const dataArr = (element as any).data
            if(Array.isArray(dataArr) && dataArr.length > 0) {
                const data = dataArr[0]
                if(data && Array.isArray(data.children)) {
                    for (const child of data.children) {
                        visitRendering(child, element, results.length + 1)
                    }
                }
            }


            /* Add children to queue */
            if('children' in element && Array.isArray((element as any).children)) {
                for (const child of (element as any).children) {
                    queue.push(child)
                }
            }
        }
        
        panel.setTextRes(textRes)
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
            if(segment?.length > 1) {
                switch (segment.charAt(0)) {
                    case 'N':
                    case 'E':
                    case 'P':
                    case 'L':
                        return segment.substring(1)
                }
            }
        }
        return element.id
    }

    /**
     * Performs a tag search on the model
     * @param root the model
     * @param textQuery the user text input 
     * @param tagQuery the tags the user entered
     * @param panel the search bar panel
     * @returns an array with all query results
     */
    private searchTags(root: SModelElement, textQuery: string, tagQuery: string, panel: SearchBarPanel): SModelElement[] {
        const results: SModelElement[] = []
        const textRes: string[] = []
        const isMixedQuery: boolean = !(textQuery === '')

        let filter: (el: any) => boolean = () => false
        try {
            filter = createSemanticFilter(tagQuery)
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e)
            panel.setError(errorMessage)
            return results
        }

        const textResults = this.searchModel(root, textQuery, panel)
        for (const result of textResults) {
            if(result && filter(result)) {
                if(!isMixedQuery) {
                    const bounds = this.extractBounds(result)
                    this.addHighlightToElement(result, bounds, results.length + 1)
                }
                results.push(result)
                const name = this.extractDisplayName(result)
                textRes.push(name)
            } else {
                removeHighlights(result)
            }
        }

        panel.setTextRes(textRes)
        return results
    }
}
