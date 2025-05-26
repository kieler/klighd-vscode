/** @jsx html */
import { injectable, inject } from 'inversify'
import { html, IActionDispatcher, TYPES } from 'sprotty'
import { VNode, h } from 'snabbdom'
import { SearchAction, ToggleSearchBarAction } from './searchbar-actions'
import { SearchBar } from './searchbar'
import { SModelElement } from 'sprotty-protocol'

@injectable()
export class SearchBarPanel {
    private updateCallbacks: (() => void)[] = []
    private visible: boolean = false
    private searchResults: SModelElement[] = []
    private textRes: string[] = []
    private searched: boolean = false

    private onVisibilityChange?: () => void

    public setVisibilityChangeCallback(cb: () => void): void {
        this.onVisibilityChange = cb
    }

    public get isVisible() {
        return this.visible
    }

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
        } else {
            document.removeEventListener('keydown', this.handleEscapeKey)
        }
    }

    public setResults(results: SModelElement[]): void {
        this.searchResults = results
        /* Debug: */ console.log("[SearchBar] setting results:", results)
    }

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
                        keydown: (event: KeyboardEvent) => {
                            if (event.key === 'Enter') {
                                const input = (event.target as HTMLInputElement).value
                                this.searched = true
                                this.actionDispatcher.dispatch(SearchAction.create(panel, SearchBar.ID, input))
                                //this.update()
                            }
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

+            this.searched ? this.showSearchResults(panel) : null
        ])
    }

    private showSearchResults(panel: SearchBarPanel): VNode {
        if (this.searchResults.length === 0) {
            return h('div', {}, [
                h('div', { style: { fontWeight: 'bold', marginBottom: '5px' } }, ['No results found'])
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
                    paddingLeft: '20px',
                    margin: '0',
                    marginTop: '4px',
                    border: this.searchResults.length > 12 ? '1px solid #eee' : 'none'
                }
            }, this.textRes.map(result => { return h('li', {}, [result])
            }))
        ])
    }

    private handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            this.changeVisibility(false)
            this.searched = false
            this.actionDispatcher.dispatch(ToggleSearchBarAction.create(this, SearchBar.ID, 'hide'))
        }
    }
}
