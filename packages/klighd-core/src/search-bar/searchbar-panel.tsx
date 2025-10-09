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

/** @jsx html */
/* global KeyboardEvent */
/* global document */
/* global HTMLElement */
/* global MouseEvent */
/* global HTMLInputElement */
import { injectable, inject } from 'inversify'
import { VNode } from 'snabbdom'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { html, IActionDispatcher, TYPES } from 'sprotty'
import { FitToScreenAction, SModelElement } from 'sprotty-protocol'
import { ClearHighlightsAction, SearchAction, ToggleSearchBarAction, UpdateHighlightsAction } from './searchbar-actions'
import { SearchBar } from './searchbar'

@injectable()
export class SearchBarPanel {
    private updateCallbacks: (() => void)[] = []

    private visible: boolean = false

    private searchResults: SModelElement[] = []

    private textRes: string[] = []

    private searched: boolean = false

    private hoverPath: string | null = null

    private hoverPos: { x: number; y: number } | null = null

    private tooltipEl: HTMLElement | null = null

    private selectedIndex: number | undefined = undefined

    private previousIndex: number | undefined = undefined

    private usedArrowKeys: boolean = false

    private tagInputVisible: boolean = false

    private regexMode: boolean = false

    private currentError: string | null = null

    private mainInput: HTMLInputElement | null = null

    private tagInput: HTMLInputElement | null = null

    private tags: { tag: string; num?: number }[] = []

    private showTagList: boolean = false

    // eslint-disable-next-line no-undef
    private tagSearchTimeout: NodeJS.Timeout | null = null

    @inject(TYPES.IActionDispatcher) protected readonly actionDispatcher: IActionDispatcher

    private onVisibilityChange?: () => void

    public setVisibilityChangeCallback(cb: () => void): void {
        this.onVisibilityChange = cb
    }

    /**
     * returns whether the search-bar is currently visible
     */
    public get isVisible() {
        return this.visible
    }

    /**
     * returns whether the regex toggle is activated
     */
    public get isRegex() {
        return this.regexMode
    }

    /**
     * returns whether the user input currently contains a syntax error
     */
    public get hasError(): boolean {
        return this.currentError !== null
    }

    /**
     * add an error message to the UI
     * @param error the error message
     */
    public setError(error: string) {
        this.currentError = error
        this.update()
    }

    /**
     * reset the error array to signalize, that the input contains no errors
     * should be used when resetting the UI
     */
    public clearError() {
        this.currentError = null
        this.update()
    }

    /** Access the input from the text field */
    public get textInput() {
        if (!this.mainInput) return
        // eslint-disable-next-line consistent-return
        return this.mainInput.value
    }

    /** Access the tag input */
    public get tagSearch() {
        if (!this.tagInput) return
        // eslint-disable-next-line consistent-return
        return this.tagInput.value
    }

    /* retrive all tags of the graph */
    public get getTags() {
        return this.tags
    }

    /* save tags from a graph to the panel */
    public setTags(tags: { tag: string; num?: number }[]) {
        this.tags = tags
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
            document.addEventListener('keydown', this.handleTabKey)
            setTimeout(() => {
                if (this.mainInput) {
                    this.mainInput.focus()
                }
            }, 0)
            if (!this.tooltipEl) {
                const tooltip = document.createElement('div')
                tooltip.id = 'search-tooltip'
                tooltip.className = 'search-tooltip'
                document.body.appendChild(tooltip)
                this.tooltipEl = tooltip
            }
            // Re-add highlights if there are existing search results
            if (this.searched && this.searchResults.length > 0) {
                this.performSearch()
            }
        } else {
            document.removeEventListener('keydown', this.handleEscapeKey)
            document.removeEventListener('keydown', this.handleKeyNavigation)
            document.removeEventListener('keydown', this.handleTabKey)
            this.actionDispatcher.dispatch(ClearHighlightsAction.create())
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
        this.selectedIndex = -1
        this.previousIndex = undefined
    }

    /**
     * Updates the variable textRes.
     * @param res : an array containing the text field from each search result match
     */
    public setTextRes(res: string[]): void {
        this.textRes = res
    }

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
     * Toggles the visibility of the tag input field
     */
    private toggleTagInput(): void {
        this.tagInputVisible = !this.tagInputVisible

        if (!this.tagInputVisible) {
            if (this.tagInput) this.tagInput.value = ''
            if (this.mainInput) {
                if (this.mainInput.value === '') {
                    this.resetUI()
                } else {
                    this.performSearch()
                }
            }
        }

        this.update()

        if (this.tagInputVisible) {
            setTimeout(() => {
                if (this.tagInput) {
                    this.tagInput.focus()
                }
            }, 0)
        }
    }

    /**
     * Performs the search with both main and tag inputs
     */
    private performSearch(): void {
        const query = this.mainInput ? this.mainInput.value : ''
        const tagQuery = this.tagInput ? this.tagInput.value : ''

        this.clearError()

        this.searched = true

        this.actionDispatcher.dispatch(ClearHighlightsAction.create())
        this.actionDispatcher.dispatch(SearchAction.create(this, SearchBar.ID, query, tagQuery))

        document.addEventListener('keydown', this.handleKeyNavigation)
    }

    /**
     * Renders the search bar.
     * @param vis : should the search bar currently be visible
     * @param panel : the search bar panel
     * @returns the search bar panel if vis=true, else an empty div
     */
    render(vis: boolean, panel: SearchBarPanel): VNode {
        if (!vis) {
            return <div className="search-bar-panel hidden"></div>
        }

        return (
            <div className="search-bar-panel">
                <div className="search-controls">
                    <input
                        id="search"
                        className="search-input"
                        placeholder="Search..."
                        hook={{
                            insert: (vnode) => {
                                this.mainInput = vnode.elm as HTMLInputElement
                            },
                            destroy: () => {
                                this.mainInput = null
                            },
                        }}
                        on={{ input: () => this.handleInputChange() }}
                    />
                    <button
                        className={`search-button ${this.tagInputVisible ? 'active' : 'inactive'}`}
                        title="Toggle tag search"
                        on={{ click: () => this.toggleTagInput() }}
                        hook={this.conditionalHoverEffect(() => this.tagInputVisible)}
                    >
                        #
                    </button>
                    <button
                        className={`search-button ${this.regexMode ? 'active' : 'inactive'}`}
                        title="Toggle RegEx search"
                        on={{
                            click: () => {
                                this.regexMode = !this.regexMode
                                this.update()
                                setTimeout(() => {
                                    if (this.mainInput) this.mainInput.focus()
                                }, 0)
                            },
                        }}
                        hook={this.conditionalHoverEffect(() => this.regexMode)}
                    >
                        *
                    </button>
                    <button
                        className="search-button inactive"
                        title="Close search bar"
                        on={{
                            click: () => {
                                this.changeVisibility(false)
                                this.searched = false
                                this.tagInputVisible = false
                                this.actionDispatcher.dispatch(
                                    ToggleSearchBarAction.create(panel, SearchBar.ID, 'hide')
                                )
                            },
                        }}
                        hook={this.hoverEffect()}
                    >
                        ×
                    </button>
                </div>

                {this.tagInputVisible && (
                    <div className="tag-input-container">
                        <input
                            id="tag-search"
                            className="tag-input"
                            placeholder="Tag filter (# or $)..."
                            hook={{
                                insert: (vnode) => {
                                    this.tagInput = vnode.elm as HTMLInputElement
                                },
                                destroy: () => {
                                    this.tagInput = null
                                },
                            }}
                            on={{ input: () => this.handleInputChange() }}
                        />
                        <button
                            className={`search-button ${this.showTagList ? 'active' : 'inactive'}`}
                            title="Show tags"
                            on={{
                                click: () => {
                                    this.showTagList = !this.showTagList
                                    this.update()
                                },
                            }}
                        >
                            ?
                        </button>
                    </div>
                )}

                {this.hoverPath && (
                    <div
                        className="search-tooltip"
                        style={{
                            top: `${this.hoverPos!.y + 12}px`,
                            left: `${this.hoverPos!.x + 12}px`,
                            display: 'block',
                        }}
                    >
                        {this.hoverPath}
                    </div>
                )}
                {this.showTagList ? this.showAvailableTags() : this.searched ? this.showSearchResults() : null}
            </div>
        )
    }

    /**
     * Displays the search results as a list below the search bar.
     * @param panel The searchbar panel
     * @returns panel with result list
     */
    private showSearchResults(): VNode {
        if (this.hasError) {
            return (
                <div>
                    <div className="search-results-error">{this.currentError}</div>
                </div>
            )
        }

        if (this.searchResults.length === 0) {
            return (
                <div className="search-results">
                    <div className="search-results-header">No results found</div>
                </div>
            )
        }

        return (
            <div className="search-results">
                <div className="search-results-header">
                    Result {(this.selectedIndex ?? 0) + 1} of {this.searchResults.length}
                </div>

                <ul className={`search-results-list ${this.searchResults.length > 8 ? 'scrollable' : ''}`}>
                    {this.searchResults.map((result, index) => {
                        const isSelected = index === this.selectedIndex
                        const listItemId = `search-result-${index}`

                        return (
                            <li
                                id={listItemId}
                                className={`search-result-item ${isSelected ? 'selected' : ''}`}
                                on={{
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
                                        this.selectedIndex = index
                                        this.actionDispatcher.dispatch(
                                            UpdateHighlightsAction.create(
                                                this.selectedIndex,
                                                this.previousIndex,
                                                this.searchResults,
                                                this
                                            )
                                        )
                                        this.previousIndex = index
                                        this.update()
                                    },
                                }}
                                hook={{
                                    insert: (vnode) => {
                                        if (isSelected) {
                                            ;(vnode.elm as HTMLElement).scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'nearest',
                                            })
                                        }
                                    },
                                    update: (oldVnode, vnode) => {
                                        if (isSelected) {
                                            setTimeout(() => {
                                                ;(vnode.elm as HTMLElement).scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'nearest',
                                                })
                                            }, 0)
                                        }
                                    },
                                }}
                            >
                                {this.textRes[index]}
                                {isSelected && <div className="search-result-path">{this.decodeId(result.id)}</div>}
                            </li>
                        )
                    })}
                </ul>
            </div>
        )
    }

    /**
     * Show all tags in a result list
     * @returns panel with tag list
     */
    private showAvailableTags(): VNode {
        if (!this.showTagList || this.tags.length === 0) {
            return <div></div>
        }

        return (
            <div className="search-results">
                <div className="search-results-header">Available Tags</div>

                <ul className={`search-results-list ${this.tags.length > 8 ? 'scrollable' : ''}`}>
                    {this.tags.map((tagObj) => {
                        const isNumeric = typeof tagObj.num === 'number'
                        const prefix = isNumeric ? '$' : '#'
                        const tagText = `${prefix}${tagObj.tag}`

                        return (
                            <li
                                className="search-result-item"
                                on={{
                                    click: () => {
                                        if (this.tagInput) {
                                            this.tagInput.value = `${this.tagInput.value.trim()} ${tagText}`.trim()
                                            this.performSearch()
                                            this.showTagList = false
                                            this.update()
                                        }
                                    },
                                }}
                            >
                                {tagText}
                            </li>
                        )
                    })}
                </ul>
            </div>
        )
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
            maxZoom: 2,
        }
        this.actionDispatcher.dispatch(action)
    }

    /** Resets the UI by removing tooltips and the result list */
    private resetUI(): void {
        if (this.mainInput) this.mainInput.value = ''
        if (this.tagInput) this.tagInput.value = ''
        if (this.tooltipEl) this.tooltipEl.style.display = 'none'

        this.searchResults = []
        this.textRes = []
        this.searched = false
        this.selectedIndex = undefined
        this.previousIndex = undefined
        this.selectedIndex = undefined
        this.update()
        this.actionDispatcher.dispatch(ClearHighlightsAction.create())
    }

    /**
     * When pressing the escape key, the search bar closes without clearing the input.
     * @param event keypress (esc key)
     */
    private handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            this.changeVisibility(false)
            this.actionDispatcher.dispatch(ToggleSearchBarAction.create(this, SearchBar.ID, 'hide'))
        }
    }

    /**
     * When the input field is cleared, the result list disappears.
     * Otherwise the search is performed.
     */
    private handleInputChange(): void {
        this.showTagList = false

        if (this.tagSearchTimeout) {
            clearTimeout(this.tagSearchTimeout)
        }
        if (this.tagInputVisible && document.activeElement === this.tagInput) {
            this.tagSearchTimeout = setTimeout(() => {
                this.performSearch()
            }, 300) // 300ms delay for tag search
        } else {
            // Immediate search for main input
            this.performSearch()
        }

        setTimeout(() => {
            const inputVal = this.mainInput?.value ?? ''
            const tagVal = this.tagInputVisible && this.tagInput ? this.tagInput.value : ''

            if (inputVal === '' && tagVal === '') {
                this.resetUI()
            }
        }, 0)
    }

    /**
     * Click through search results with enter or choose a certain result with ArrowUp/ArrowDown
     * @param event keypresses of enter, arrowUp or arrowDown
     */
    private handleKeyNavigation = (event: KeyboardEvent) => {
        if (this.searchResults.length === 0) return

        if (event.shiftKey && event.key === 'ArrowDown') {
            event.preventDefault()
            this.selectedIndex = this.searchResults.length - 1
            this.usedArrowKeys = true
            this.actionDispatcher.dispatch(
                UpdateHighlightsAction.create(this.selectedIndex, this.previousIndex, this.searchResults, this)
            )
            this.previousIndex = this.selectedIndex
            return
        }

        if (event.shiftKey && event.key === 'ArrowUp') {
            event.preventDefault()
            this.selectedIndex = 0
            this.usedArrowKeys = true
            this.actionDispatcher.dispatch(
                UpdateHighlightsAction.create(this.selectedIndex, this.previousIndex, this.searchResults, this)
            )
            this.previousIndex = this.selectedIndex
            return
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault()
                this.usedArrowKeys = true
                this.selectedIndex = ((this.selectedIndex ?? 0) + 1) % this.searchResults.length
                this.actionDispatcher.dispatch(
                    UpdateHighlightsAction.create(this.selectedIndex, this.previousIndex, this.searchResults, this)
                )
                this.previousIndex = this.selectedIndex
                break

            case 'ArrowUp':
                event.preventDefault()
                this.usedArrowKeys = true
                this.selectedIndex =
                    ((this.selectedIndex ?? 0) - 1 + this.searchResults.length) % this.searchResults.length
                this.actionDispatcher.dispatch(
                    UpdateHighlightsAction.create(this.selectedIndex, this.previousIndex, this.searchResults, this)
                )
                this.previousIndex = this.selectedIndex
                break

            case 'Enter': {
                event.preventDefault()

                this.selectedIndex = this.usedArrowKeys
                    ? this.selectedIndex ?? 0
                    : ((this.selectedIndex ?? 0) + 1) % this.searchResults.length

                const selected = this.searchResults[this.selectedIndex]

                if (this.searchResults[this.selectedIndex]) {
                    this.panToElement(selected.id)
                    if (!this.usedArrowKeys) {
                        this.actionDispatcher.dispatch(
                            UpdateHighlightsAction.create(
                                this.selectedIndex,
                                this.previousIndex,
                                this.searchResults,
                                this
                            )
                        )
                    }
                    this.previousIndex = this.selectedIndex
                }

                this.usedArrowKeys = false
                break
            }
            default:
                break
        }
        this.update()
    }

    /** Tab cycles between input fields and not the buttons as well */
    private handleTabKey = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return
        const active = document.activeElement

        if (!this.mainInput) return

        // Only #search is visible
        if (!this.tagInputVisible && active === this.mainInput) {
            event.preventDefault()
            this.toggleTagInput()
            return
        }

        if (!this.mainInput || !this.tagInput || !this.tagInputVisible) return

        if (!(active instanceof HTMLInputElement)) return
        const focusables = [this.mainInput, this.tagInput]
        const currentIndex = focusables.indexOf(active)

        if (currentIndex !== -1) {
            event.preventDefault()
            const nextIndex = (currentIndex + focusables.length) % focusables.length
            focusables[nextIndex].focus()
        }
    }

    private hoverEffect() {
        return {
            insert: (vnode: any) => {
                const el = vnode.elm as HTMLElement
                el.addEventListener('mouseenter', () => {
                    el.style.backgroundColor = '#007acc'
                    el.style.color = 'white'
                })
                el.addEventListener('mouseleave', () => {
                    el.style.backgroundColor = '#eee'
                    el.style.color = 'black'
                })
            },
        }
    }

    private conditionalHoverEffect(condFn: () => boolean) {
        return {
            insert: (vnode: any) => {
                const el = vnode.elm as HTMLElement
                el.addEventListener('mouseenter', () => {
                    el.style.backgroundColor = '#007acc'
                    el.style.color = 'white'
                })
                el.addEventListener('mouseleave', () => {
                    const cond = condFn()
                    el.style.backgroundColor = cond ? '#007acc' : '#eee'
                    el.style.color = cond ? 'white' : 'black'
                })
            },
        }
    }

    /**
     * Build the path from the id of an element.
     * @param id the id of an SModelElement
     * @returns a readable path with icons.
     */
    private decodeId(id: string): string {
        if (!id) return ''

        const iconMap: Record<string, string> = {
            N: '🔘',
            E: '➖',
            P: '🔲',
            L: '🏷️',
        }

        const segments = id.split('$')
        const result: string[] = []

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i]

            // eslint-disable-next-line no-continue
            if (!segment || segment === 'root') continue

            const isUnnamed = segments[i - 1] === ''

            const typeChar = segment.charAt(0)
            const label = segment.substring(1)
            const icon = iconMap[typeChar] ?? ''

            if (isUnnamed) {
                result.push(icon)
            } else {
                result.push(`${icon} ${label}`)
            }
        }

        return result.join(' > ')
    }
}
