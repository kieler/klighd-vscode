import { Action, SetModelAction, SModelElement, UpdateModelAction } from 'sprotty-protocol'
import { ActionHandlerRegistry, SetUIExtensionVisibilityAction } from 'sprotty'
import { SearchBar } from './searchbar'
import { IActionHandler } from 'sprotty'
import { SearchBarPanel } from './searchbar-panel'
import { injectable } from 'inversify'
import { isContainerRendering, isKText } from '../skgraph-models'


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

    initialize(registry: ActionHandlerRegistry): void {
        registry.register(SetModelAction.KIND, this)
        registry.register(UpdateModelAction.KIND, this)
        registry.register(SearchAction.KIND, this)
    }

    handle(action: Action): void {
        /* Intercept model during SetModelAction / UpdateModelAction */
        if (action.kind === SetModelAction.KIND || action.kind === UpdateModelAction.KIND) {
            const model = (action as SetModelAction).newRoot as SModelElement
            HandleSearchAction.currentModel = model
            /* Debug */console.log("[SearchBar] model intercepted")
            return
        }

        /* Handle search itself */
        if (!SearchAction.isThisAction(action)) return
        if (action.id !== SearchBar.ID) return
        if (!HandleSearchAction.currentModel) return

        const query = action.input.trim().toLowerCase()
        if (!query) return

        const results : SModelElement[] = this.searchModel(HandleSearchAction.currentModel, query, action.panel)
        action.panel.setResults(results)
        action.panel.update()
    }

    private searchModel(root: SModelElement, query: string, panel: SearchBarPanel): SModelElement[] {
        const results: SModelElement[] = []
        const textRes: string[] = []
        const lowerQuery = query.toLowerCase()

        const queue: SModelElement[] = [root]

        const visitRendering = (rendering: any, owner: SModelElement): void => {
            if (rendering != null && isKText(rendering) && rendering.text?.toLowerCase().includes(lowerQuery)) {
                results.push(owner)
                textRes.push(rendering.text)
            }

            if (rendering != null && isContainerRendering(rendering)) {
                if ('text' in rendering && typeof rendering.text === 'string' &&
                    rendering.text.toLowerCase().includes(lowerQuery)) {
                    results.push(owner)
                    textRes.push(rendering.text)
                }

                for (const child of rendering.children ?? []) {
                    visitRendering(child, owner)
                }
            }
        }

        while (queue.length > 0) {
            const element = queue.shift()!

            if (element.type === 'label' && 'text' in element && typeof (element as any).text === 'string') {
                const text = (element as any).text.toLowerCase()
                if (text.includes(lowerQuery)) {
                    results.push(element)
                    textRes.push((element as any).text)
                }
            }

            if ((element.type === 'edge' || element.type === 'node') && 'text' in element) {
                const text = (element as any).text?.toLowerCase?.()
                if (text?.includes(lowerQuery)) {
                    results.push(element)
                    textRes.push((element as any).text)
                }
            }

            const data = (element as any).data
            if (Array.isArray(data)) {
                for (const item of data) {
                    visitRendering(item, element)
                }
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
}
