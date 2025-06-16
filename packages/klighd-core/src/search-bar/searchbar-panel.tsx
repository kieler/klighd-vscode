/** @jsx html */
import { injectable, inject } from 'inversify'
import { html, IActionDispatcher, TYPES } from 'sprotty'
import { VNode, h } from 'snabbdom'
import { ClearHighlightsAction, SearchAction, ToggleSearchBarAction } from './searchbar-actions'
import { SearchBar } from './searchbar'
import { FitToScreenAction, SModelElement } from 'sprotty-protocol'

@injectable()
export class SearchBarPanel {
    private updateCallbacks: (() => void)[] = []
    private visible: boolean = false
    private searchResults: SModelElement[] = []
    private textRes: string[] = []
    private searched: boolean = false
    private hoverPath: string | null = null
    private hoverPos: { x: number, y: number } | null = null
    private tooltipEl: HTMLElement | null = null

    private onVisibilityChange?: () => void

    public setVisibilityChangeCallback(cb: () => void): void {
        this.onVisibilityChange = cb
    }

    public get isVisible() {
        return this.visible
    }

    /**
     * Updates anything that changes, when the search bar is toggled
     * @param vis the new visibility
     */
    public changeVisibility(vis: boolean): void {
        this.visible = vis
        if (this.onVisibilityChange) {
            this.onVisibilityChange()
        }

        if (vis) {
            document.addEventListener('keydown', this.handleEscapeKey)
            setTimeout(() => {
                const input = document.getElementById('search') as HTMLInputElement
                if (input) {
                    input.focus()
                } 
            }, 0)
            if (!this.tooltipEl) {
                const tooltip = document.createElement('div')
                tooltip.id = 'search-tooltip'
                tooltip.style.position = 'fixed'
                tooltip.style.pointerEvents = 'none'
                tooltip.style.zIndex = '10000'
                tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
                tooltip.style.color = 'white'
                tooltip.style.padding = '4px 8px'
                tooltip.style.borderRadius = '4px'
                tooltip.style.fontSize = '12px'
                tooltip.style.display = 'none'
                document.body.appendChild(tooltip)
                this.tooltipEl = tooltip
            }
        } else {
            document.removeEventListener('keydown', this.handleEscapeKey)
            if (this.tooltipEl) {
                this.tooltipEl.style.display = 'none'
            }
        }
    }

    /**
     * Update variable searchResults
     * @param results : an array containing the search result elements
     */
    public setResults(results: SModelElement[]): void {
        this.searchResults = results
        /* Debug: */ console.log("[SearchBar] setting results:", results)
    }

    /**
     * Updates the variable textRes.
     * @param res : an array containing the text field from each search result match
     */
    public setTextRes(res: string[]): void {
        this.textRes = res
    }

    @inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: IActionDispatcher

    readonly id: 'search-bar-panel'
    readonly title: 'Search'
    readonly position: number = 0

    onUpdate(callback: () => void): void {
        this.updateCallbacks.push(callback)
    }

    update(): void {
        for (const callback of this.updateCallbacks) {
            callback()
        }
    }

    /**
     * Renders the search bar.
     * @param vis : should the search bar currently be visible
     * @param panel : the search bar panel
     * @returns the search bar panel if vis=true, else an empty div
     */
    render(vis: boolean, panel: SearchBarPanel): VNode {
        if (!vis) {
            return <div style={{ display: 'none' }}></div>
        }

        return h('div', {
            style: {
                position: 'absolute',
                top: '10px',
                left: '10px',
                zIndex: '9999',
                backgroundColor: 'white',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '250px'
            }
        }, [
            h('div', {
                style: {
                    display: 'flex',
                    marginBottom: '8px'
                }
            }, [
                h('input', {
                    props: {
                        id: 'search',
                        placeholder: 'Search...'
                    },
                    style: {
                        flex: '1',
                        padding: '4px'
                    },
                    on: {
                        input: (event: Event) => {
                            document.addEventListener('keydown', this.handleEmptyInput)
                            const input = (event.target as HTMLInputElement).value
                            this.searched = true

                            const start = performance.now();

                            this.actionDispatcher.dispatch(ClearHighlightsAction.create())
                            this.actionDispatcher.dispatch(SearchAction.create(panel, SearchBar.ID, input))

                            const end = performance.now();
                            const total = end - start;
                            console.log(`[SearchBar] search took ${total.toFixed(10)} ms`);
                            
                            document.addEventListener('keydown', this.handleEnter)
                            document.removeEventListener('keydown', this.handleEmptyInput)
                        }
                    }
                }),
                h('button', {
                    style: {
                        marginLeft: '4px',
                        background: '#eee',
                        border: 'none',
                        cursor: 'pointer',
                        width: '30px'
                    },
                    on: {
                        click: () => {
                            this.changeVisibility(false)
                            this.searched = false
                            this.actionDispatcher.dispatch(ToggleSearchBarAction.create(panel, SearchBar.ID, 'hide'))
                        },
                    }
                }, ['x']),
            ]),
            this.hoverPath ? h('div', {
                style: {
                    position: 'fixed',
                    top: `${this.hoverPos!.y + 12}px`,
                    left: `${this.hoverPos!.x + 12}px`,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    pointerEvents: 'none',
                    zIndex: '10000'
                }
            }, [ this.hoverPath ]) : null,
+            this.searched ? this.showSearchResults(panel) : null
        ])
    }

    /**
     * Displays the search results as a list below the search bar.
     * @param panel The searchbar panel
     * @returns panel with result list
     */
    private showSearchResults(panel: SearchBarPanel): VNode {
        /* empty input or invalid tag (-> any tag not present in graph is invalid) */
        if (this.searchResults.length === 0) {
            const input = document.getElementById('search') as HTMLInputElement
            const currentInput = input ? input.value : ''
            const isTagSearch = currentInput.startsWith('#') || currentInput.startsWith('$')
            const message = isTagSearch ? 'Not a valid tag' : 'No results found'
            const textColor = isTagSearch ? 'red' : 'black'
            
            return h('div', {}, [
                h('div', { 
                    style: { 
                        fontWeight: 'bold', 
                        marginBottom: '5px',
                        color: textColor
                    } 
                }, [message])
            ])
        }

        return h('div', {}, [
            h('div', { style: { fontWeight: 'bold', marginBottom: '5px' } }, [
                `Found ${this.searchResults.length} result${this.searchResults.length !== 1 ? 's' : ''}`
            ]),

            h('ul', {
                style: {
                    maxHeight: '200px',
                    overflowY: this.searchResults.length > 12 ? 'auto' : 'visible',
                    listStyleType: 'none',
                    paddingLeft: '0',
                    margin: '0',
                    marginTop: '4px',
                    border: this.searchResults.length > 12 ? '1px solid #eee' : 'none'
                }
            },
            this.searchResults.map((result, index) => {
                return h('li', {
                    style: {
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s ease',
                        cursor: 'pointer'
                    },
                    on: {
                        mouseenter: (event: MouseEvent) => {
                            const path = this.decodeId(this.searchResults[index].id)
                            if (this.tooltipEl) {
                                this.tooltipEl.textContent = path
                                this.tooltipEl.style.top = `${event.clientY + 12}px`
                                this.tooltipEl.style.left = `${event.clientX + 12}px`
                                this.tooltipEl.style.display = 'block'
                            }
                        },
                        mouseleave: () => {
                            if (this.tooltipEl) {
                                this.tooltipEl.style.display = 'none'
                            }
                        },
                        click: () => {
                            this.panToElement(result.id)
                        }
                    },
                    hook: {
                        insert: vnode => {
                            vnode.elm!.addEventListener('mouseover', () => {
                                (vnode.elm as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.25)'
                            })
                            vnode.elm!.addEventListener('mouseout', () => {
                                (vnode.elm as HTMLElement).style.backgroundColor = 'transparent'
                            })
                        }
                    }
                }, [this.textRes[index]])
            }))
        ])
    }

    /**
     * Zoom in on a certain element.
     * @param elementId id of the element to zoom in to. 
     */
    private panToElement(elementId: string): void {
        const action: FitToScreenAction = {
            kind: 'fit',
            elementIds: [elementId],
            animate: true,
            padding: 20,
            maxZoom: 2
        }
        this.actionDispatcher.dispatch(action)
    }


    /**
     * When pressing the escape key, the search input resets.
     * @param event keypress (esc key)
     */
    private handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            const input = document.getElementById('search') as HTMLInputElement
            if (input) {
                input.value = ''
                input.focus()
            }
            if (this.tooltipEl) {
                this.tooltipEl.style.display = 'none'
            }
            this.searchResults = []
            this.textRes = []
            this.searched = false
            this.update()
            this.actionDispatcher.dispatch(ClearHighlightsAction.create())
        }
    }
    
    /**
     * When the input field is cleared, the result list disappears.
     * @param event keypress (backspace key)
     */
    private handleEmptyInput = (event: KeyboardEvent) => {
        if (event.key === 'Backspace') {
            const input = document.getElementById('search') as HTMLInputElement
            if (input && input.value === '') {
                input.value = ''
                input.focus()
            }
            if (this.tooltipEl) {
                this.tooltipEl.style.display = 'none'
            }
            this.searchResults = []
            this.textRes = []
            this.searched = false
            this.update()
            this.actionDispatcher.dispatch(ClearHighlightsAction.create())
        }
    }

    private handleEnter = (event : KeyboardEvent) => {
        if (event.key === 'Enter') {
            this.panToElement(this.searchResults[0].id)
        }
    }

    /**
     * Build the path from the id of an element.
     * @param id the id of an SModelElement
     * @returns a readable path with icons.
     */
    private decodeId(id : string) : string {
        if (!id) return ""

        const iconMap: Record<string, string> = {
            N: "🔘", 
            E: "➖", 
            P: "🔲", 
            L: "🏷️", 
        }

        const segments = id.split("$")
        const result: string[] = []

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i]

            if (!segment || segment === "root") continue

            const isUnnamed = segments[i - 1] === ""

            const typeChar = segment.charAt(0)
            const label = segment.substring(1)
            const icon = iconMap[typeChar] ?? "❓"

            if (isUnnamed) {
                result.push(icon)
            } else {
                result.push(`${icon} ${label}`)
            }
        }

        return result.join(" > ")
    }
}