/** @jsx html */
import { inject, postConstruct } from 'inversify'
import { ShowSearchBarAction, ToggleSearchBarAction } from './searchbar-actions'
import { SearchBarPanel } from './searchbar-panel'
import { VNode } from 'snabbdom'
import { AbstractUIExtension, html, IActionDispatcher, Patcher, PatcherProvider, TYPES } from 'sprotty'

/**
 * A search bar extension that lets you search for text in a diagram.
 */

export class SearchBar extends AbstractUIExtension {
    static readonly ID = 'search-bar'

    private patcher: Patcher
    private oldContentRoot: VNode
    
    @inject(TYPES.PatcherProvider) patcherProvider: PatcherProvider
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher
    @inject(SearchBarPanel) private panel: SearchBarPanel
    
    
    @postConstruct()
    init(): void {
        
        this.patcher = this.patcherProvider.patcher

        this.panel.onUpdate(() => this.update())

        this.panel.setVisibilityChangeCallback(() => {
            this.update()
        })
        
        setTimeout(() => {
            this.actionDispatcher.dispatch(ShowSearchBarAction.create())
        }, 0)
        
        this.addKeyListener()
    }

    id(): string {
        return SearchBar.ID
    }

    containerClass(): string {
        return SearchBar.ID
    }

    protected onBeforeShow(): void {
        if (!this.containerElement) {
            console.warn('[SearchBar] containerElement is not yet defined')
            return
        }

        if (!this.oldContentRoot) {
            this.initializeContents(this.containerElement)
        }

        this.update()
    }

    update(): void {
        if (!this.containerElement) return

        const content: VNode = this.panel.render(this.panel.isVisible, this.panel) 

        this.oldContentRoot = this.patcher(this.oldContentRoot, content)
    }

    protected initializeContents(containerElement: HTMLElement): void {
        const contentRoot = document.createElement('div')
        this.oldContentRoot = this.patcher(contentRoot, <div />)
        
        containerElement.appendChild(contentRoot)
        
        this.panel.render(false, this.panel) /* initially not showing */
    }


    private addKeyListener(): void {
        window.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
                this.panel.changeVisibility(true)
                this.actionDispatcher.dispatch(ToggleSearchBarAction.create(this.panel, SearchBar.ID, 'show'))
            }
        })
    }
}