import { Action, CenterAction, SetModelAction, SModelElement, UpdateModelAction } from 'sprotty-protocol'
import { ActionHandlerRegistry, IActionDispatcher, SetUIExtensionVisibilityAction, TYPES } from 'sprotty'
import { SearchBar } from './searchbar'
import { IActionHandler } from 'sprotty'
import { SearchBarPanel } from './searchbar-panel'
import { inject, injectable } from 'inversify'
import { isContainerRendering, isKText, KColoring, KRectangle } from '../skgraph-models'
import { rgb } from 'sprotty'

/* --------------------------------- search bar visibility actions ----------------------------------------*/   

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
        if (ToggleSearchBarAction.isThisAction(action)) {
            if (action.id !== SearchBar.ID) return

            const newVisible = action.state === 'show' ? true :
                                action.state === 'hide' ? false :
                                false
            
            if (action.panel.isVisible !== newVisible) {
                action.panel.changeVisibility(newVisible)
                action.panel.update()
            }
        }
    }
} 

/* --------------------------------- highlight action ---------------------------------------- */
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

function createHighlightRectangle(xPos: number, yPos: number, width: number, height: number): KRectangle {
    const highlight: KColoring = {
        type: 'KBackgroundImpl',
        color: rgb(255, 255, 0),
        alpha: 80,
        gradientAngle: 0,
        propagateToChildren: false,
        selection: false,
    }

    return {
        type: 'KRectangleImpl',
        id: `highlightRect-${Math.random().toString(36).substr(2, 9)}`,
        children: [],
        properties: {
            x: xPos,
            y: yPos,
            width: width,
            height: height,
        },
        actions: [],
        styles: [highlight],
    }
}

function removePreviousHighlights(root: SModelElement): void {
    const queue: SModelElement[] = [root]

    while (queue.length > 0) {
        const element = queue.shift()!

        if ('children' in element && Array.isArray(element.children)) {
            element.children = element.children.filter(child => !child.id?.startsWith('highlightRect-'))
            element.children.forEach(child => queue.push(child))
        }

        const data = (element as any).data
        if (Array.isArray(data)) {
            for (const item of data) {
                if (item && 'children' in item && Array.isArray(item.children)) {
                    item.children = item.children.filter((child: { id: string }) => !child.id?.startsWith('highlightRect-'))
                    item.children.forEach((c: any) => queue.push(c))
                }
            }
        }
    }
}

interface HighlightBounds {
    x: number
    y: number
    width: number
    height: number
}

/* --------------------------------- search action ---------------------------------------- */   
export interface SearchAction extends Action {
    kind: typeof SearchAction.KIND
    id: string
    panel: SearchBarPanel
    input: string
}

export namespace SearchAction {
    export const KIND = 'handleSearch'

    export function create(panel: SearchBarPanel, id: string, input: string): SearchAction {
        return {
            kind: KIND,
            id,
            input,
            panel,
        }
    } 

    export function isThisAction(action: Action): action is SearchAction {
        return action.kind === KIND
    }
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
        if (action.kind === SetModelAction.KIND || action.kind === UpdateModelAction.KIND) {
            const model = (action as SetModelAction).newRoot as SModelElement
            HandleSearchAction.currentModel = model
            return
        }
        
        if (!HandleSearchAction.currentModel) return

        const modelId = HandleSearchAction.currentModel?.id

        /* Handle ClearHighlightsActions */
        if (ClearHighlightsAction.isThisAction(action)) {
            removePreviousHighlights(HandleSearchAction.currentModel)
            if (modelId && this.actionDispatcher) {
                this.actionDispatcher.dispatch(CenterAction.create([modelId]))
            }
        }
        
        /* Handle search itself */
        if (!SearchAction.isThisAction(action)) return
        if (action.id !== SearchBar.ID) return

        const query = action.input.trim().toLowerCase()
        if (!query) return

        const isTagQuery = query.startsWith('#') || query.startsWith('$')
        
        const results : SModelElement[] = isTagQuery
            ? this.searchTags(HandleSearchAction.currentModel, query, action.panel)
            : this.searchModel(HandleSearchAction.currentModel, query, action.panel)        
        action.panel.setResults(results)
        action.panel.update()
    }

    /**
     * Adds highlighting to an element if it doesn't already have it
     * @param element the element that might get the highlight
     * @param bounds the position and size of the highlight
     */
    private addHighlightToElement(element: SModelElement, bounds: HighlightBounds): void {
        const data = (element as any).data
        if (Array.isArray(data)) {
            for (const item of data) {
                if (isContainerRendering(item)) {
                    const alreadyHasHighlight = item.children?.some(child => child.id?.startsWith('highlightRect-'))
                    if (!alreadyHasHighlight) {
                        const highlightRect = createHighlightRectangle(bounds.x, bounds.y, bounds.width, bounds.height)
                        item.children = [...(item.children ?? []), highlightRect]
                    }
                }
            }
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
    private processTextMatch(element: SModelElement, text: string, query: string, bounds: HighlightBounds, results: SModelElement[], textRes: string[]): void {
        if (text.toLowerCase().includes(query)) {
            results.push(element)
            textRes.push(text)
            this.addHighlightToElement(element, bounds)
        }
    }

    /**
     * Extracts bounds from an element
     * @param element the element, whose bounds need to be extracted
     */
    private extractBounds(element: any): HighlightBounds {
        return {
            x: Number(element.x ?? element.properties?.x ?? 0),
            y: Number(element.y ?? element.properties?.y ?? 0),
            width: Number(element.width ?? element.properties?.width ?? 0),
            height: Number(element.height ?? element.properties?.height ?? 0)
        }
    }

    /**
     * Matches the query to the tags.
     * @param tags the tags of some object
     * @param query The user input in the format "$someTag someNumValue"
     * @returns whether the searched tag is included in the tags 
     */
    private matchesTagWithNumQuery(tags: { tag: string, num?: number }[], query: string): boolean {
        const match = query.match(/^(\w+)\s+(\d+)$/)
        if (!match) return false

        const tagToFind = match[1].toLowerCase()
        const numToFind = parseInt(match[2], 10)

        for (const tagObj of tags) {
            console.log('Checking tag:', tagObj.tag, 'num:', tagObj.num)
            if (tagObj.tag === tagToFind && tagObj.num === numToFind) return true
        }
        return false
    }



    /**
     * Parses logical operators
     * @param tags the tags of some element
     * @param fullQuery the user input
     * @returns whether fullquery is met
     */
    private matchesTagQuery(tags: { tag: string, num?: number }[], fullQuery: string): boolean {
        const orClauses = fullQuery.split('||').map(s => s.trim())

        for (const orClause of orClauses) {
            const andTerms = orClause.split('&&').map(term => term.trim())
            let allMatch = true

            for (const term of andTerms) {
                if (term.startsWith('#')) {
                    const plainTag = term.slice(1).toLowerCase()
                    const tagStrings = tags.map(t => t.tag)
                    if (!tagStrings.includes(plainTag)) {
                        allMatch = false
                        break
                    }
                } else if (term.startsWith('$')) {
                    const numQuery = term.slice(1).toLowerCase()
                    if (!this.matchesTagWithNumQuery(tags, numQuery)) {
                        allMatch = false
                        break
                    }
                } else {
                    allMatch = false
                    break
                }
            }

            if (allMatch) return true
        }

        return false
    }

    /**
     * Extracts the tags from a graph element with the goal to further search through the tags.
     * @param element the graph element
     * @returns a list of tags, that the element has
     */
    private getTagsFromElement(element: any): { tag: string, num?: number }[] {
        const tags: { tag: string, num?: number }[] = []

        const tagProp = element.properties?.["de.cau.cs.kieler.klighd.semanticFilter.tags"]
        if (tagProp && Array.isArray(tagProp)) {
            const parsed = tagProp
                .filter((item: any) => typeof item.tag === 'string')
                .map((item: any) => ({ tag: item.tag.toLowerCase(), num: item.num }))
            tags.push(...parsed)
        }

        if (Array.isArray(element.data)) {
            for (const item of element.data) {
                const dataTagProp = item?.properties?.["de.cau.cs.kieler.klighd.semanticFilter.tags"]
                if (dataTagProp && Array.isArray(dataTagProp)) {
                    tags.push(...dataTagProp
                        .filter((t: any) => typeof t.tag === 'string')
                        .map((t: any) => ({ tag: t.tag.toLowerCase(), num: t.num })))
                }
            }
        }

        return tags
    }

    /**
     * Performes a tag search
     * @param root the current model starting with the root
     * @param query tags to find
     * @param panel the search bar panel
     * @returns list of results
     */
    private searchTags(root: SModelElement, query: string, panel: SearchBarPanel): SModelElement[] {
        const results: SModelElement[] = []
        const textRes: string[] = []

        const queue: SModelElement[] = [root]

        while (queue.length > 0) {
            const element = queue.shift()!

            const tagObjs = this.getTagsFromElement(element)
            const tagStrings = tagObjs.map(t => t.tag)  

            const matched = this.matchesTagQuery(tagObjs, query.toLowerCase())

            if (tagStrings.length > 0 && matched) {
                const bounds = this.extractBounds(element)
                this.addHighlightToElement(element, bounds)
                results.push(element)

                const segments = element.id.split('$')
                let nodeName = ''
                for (let i = segments.length - 1; i >= 0; i--) {
                    const segment = segments[i]
                    if (segment && segment !== '') {
                        if (segment.length > 1) {
                            switch (segment.charAt(0)){
                                case 'N': nodeName = '[node]'; break
                                case 'E': nodeName = '[edge]'; break
                                case 'P': nodeName = '[port]'; break
                                case 'L': nodeName = '[label]'; break
                            }
                            nodeName += ' ' + segment.substring(1)
                        } else {
                            nodeName = segment
                        }
                        break
                    }
                }

                const displayText = nodeName || element.id
                textRes.push(displayText)
            }

            if ('children' in element && Array.isArray((element as any).children)) {
                for (const child of (element as any).children) {
                    queue.push(child)
                }
            }
        }

        panel.setTextRes(textRes)
        return results
    }


    /**
     * Perform a breadth-first search on {@param root} to find {@param query}
     * @param root the model
     * @param query the user input
     * @param panel the search bar panel
     * @returns list of results
     */
    private searchModel(root: SModelElement, query: string, panel: SearchBarPanel): SModelElement[] {
        const results: SModelElement[] = []
        const textRes: string[] = []
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
                const bounds = this.extractBounds(rendering)
                this.processTextMatch(parent, rendering.text, lowerQuery, bounds, results, textRes)
            }

            /* Check KContainerElements */
            if (isContainerRendering(rendering)) {
                if ('text' in rendering && typeof rendering.text === 'string') {
                    const bounds = this.extractBounds(rendering)
                    if (rendering.text.toLowerCase().includes(lowerQuery)) {
                        results.push(rendering)
                        textRes.push(rendering.text)
                        
                        // Add highlight directly to rendering children
                        const highlightRect = createHighlightRectangle(bounds.x, bounds.y, bounds.width, bounds.height)
                        rendering.children = [...(rendering.children ?? []), highlightRect]
                    }
                }

                for (const child of rendering.children ?? []) {
                    visitRendering(child, parent)
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
                    if ('text' in element) {
                        const text = (element as any).text;
                        if (typeof text === 'string' && text.trim()) {
                            const bounds = this.extractBounds(element);
                            this.processTextMatch(element, text, lowerQuery, bounds, results, textRes);
                        }
                    }
                    break;
            }

            /* Process data field for renderings */
            const data = (element as any).data
            if (Array.isArray(data)) {
                for (const item of data) {
                    visitRendering(item, element)
                }
            }

            /* Add children to queue */
            if ('children' in element && Array.isArray((element as any).children)) {
                for (const child of (element as any).children) {
                    queue.push(child)
                }
            }
        }

        panel.setTextRes(textRes)
        return results
    }
}