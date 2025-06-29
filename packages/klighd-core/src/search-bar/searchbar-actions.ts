import { Action, CenterAction, SetModelAction, SModelElement, UpdateModelAction } from 'sprotty-protocol'
import { ActionHandlerRegistry, IActionDispatcher, SetUIExtensionVisibilityAction, TYPES } from 'sprotty'
import { SearchBar } from './searchbar'
import { IActionHandler } from 'sprotty'
import { SearchBarPanel } from './searchbar-panel'
import { inject, injectable } from 'inversify'
import { isContainerRendering, isKText, KColoring, KRectangle, KText } from '../skgraph-models'
import { rgb } from 'sprotty'
import { createSemanticFilter } from '../../src/filtering/util'

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
        id: `highlightRect-${Math.random().toString(36).substr(2, 9)}`,
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

function removeKTextHighlights(root: SModelElement): void {
    const queue: SModelElement[] = [root]

    while (queue.length > 0) {
        const element = queue.shift()!

        if (isKText(element) && element.styles) {
            element.styles = element.styles.filter((style: any) => 
                !(style.type === 'KBackgroundImpl' && 
                style.color && 
                style.color.red === 255 && 
                style.color.green === 255 && 
                style.color.blue === 0)
            )
        }

        if ('children' in element && Array.isArray(element.children)) {
            element.children.forEach(child => queue.push(child))
        }

        const data = (element as any).data
        if (Array.isArray(data)) {
            for (const item of data) {
                if (item && 'children' in item && Array.isArray(item.children)) {
                    item.children.forEach((c: any) => queue.push(c))
                }
            }
        }
    }
}

/* --------------------------------- search action ---------------------------------------- */   
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
            removeKTextHighlights(HandleSearchAction.currentModel)
            // make changes visible
            if (modelId && this.actionDispatcher) {
                this.actionDispatcher.dispatch(CenterAction.create([modelId]))
            }
        }
        
        /* Handle search itself */
        if (!SearchAction.isThisAction(action)) return
        if (action.id !== SearchBar.ID) return

        const query = action.textInput.trim().toLowerCase()
        const tagQuery = action.tagInput

        const isTextQuery = query !== ''
        const isTagQuery = tagQuery !== ''

        if (!isTextQuery && !isTagQuery) return

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
     * Adds highlighting directly to the text element by modifying its styles
     * @param textElement the KTextImpl element to highlight
     */
    private addHighlightToKText(textElement: any): void {
        if (!textElement.styles) {
            textElement.styles = []
        }

        const alreadyHighlighted = textElement.styles.some((style: any) => 
            style.type === 'KBackgroundImpl' && style.color && 
            style.color.red === 255 && style.color.green === 255 && style.color.blue === 0
        )
        
        if (!alreadyHighlighted) {
            const highlightStyle: KColoring = {
                type: 'KBackgroundImpl',
                color: rgb(255, 255, 0),
                alpha: 127,
                gradientAngle: 0,
                propagateToChildren: false,
                selection: false,
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
    private processTextMatch(parent: SModelElement, element: SModelElement, query: string, results: SModelElement[], textRes: string[]): void {
        const text = (element as KText).text
        if (text.toLowerCase().includes(query)) {
            results.push(parent)
            textRes.push(text)
            if(isKText(element)) {
                this.addHighlightToKText(element)
            } else {
                const bounds = this.extractBounds(element)
                this.addHighlightToElement(parent, bounds)
            }
        }
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
     * Perform a breadth-first search on {@param root} to find {@param query}
     * @param root the model
     * @param query the user input
     * @param panel the search bar panel
     * @returns array of results
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
                this.processTextMatch(parent, rendering, lowerQuery, results, textRes)
            }

            /* Check KContainerElements */
            if (isContainerRendering(rendering)) {
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
                            this.processTextMatch(element, element, lowerQuery, results, textRes);
                        }
                    }
                    break;
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

    ///////////////////////////////// Tag search //////////////////////////////////////
    
    /**
     * Parses the tag input and creates a filter based on it
     * @param element a graph element
     * @param rule the tag(s)
     * @returns true if elem has tag, otherwise false
     */
    private matchesFilterRule(element: any, rule: string): boolean {
       try {
            const filter = createSemanticFilter(rule)
            return filter(element)
        } catch (e) {
            console.error('Invalid filter expression:', e)
            return false
        }
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
        const queue: SModelElement[] = [root]
        const isMixedQuery : boolean = !(textQuery === '')

        if (isMixedQuery) {
            const textResults = this.searchModel(root, textQuery, panel)
            while (textResults.length > 0) {
                const res = textResults.shift()
                const match = this.matchesFilterRule(res, tagQuery)
                if (match) {
                    const bounds = this.extractBounds(res)
                    this.addHighlightToElement(res as any, bounds)
                    results.push(res as any)

                    const name = this.extractDisplayName(res as any)
                    textRes.push(name)
                }
            }

        } else {
            console.log('Else')
            while (queue.length > 0) {
                const element = queue.shift()!

                const matchesTag = this.matchesFilterRule(element, tagQuery)

                if (matchesTag) {
                    const bounds = this.extractBounds(element)
                    this.addHighlightToElement(element, bounds)
                    results.push(element)

                    const name = this.extractDisplayName(element)
                    textRes.push(name)
                }

                if ('children' in element && Array.isArray(element.children)) {
                    queue.push(...element.children)
                }
            }
        }

        panel.setTextRes(textRes)
        return results
    }
}