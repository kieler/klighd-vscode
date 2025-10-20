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
/* global HTMLElement */
/* global document */
/* global window */
import { inject, postConstruct } from 'inversify'
import { VNode } from 'snabbdom'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AbstractUIExtension, html, IActionDispatcher, Patcher, PatcherProvider, TYPES } from 'sprotty'
import { RetrieveTagsAction, ShowSearchBarAction, ToggleSearchBarAction } from './searchbar-actions'
import { SearchBarPanel } from './searchbar-panel'

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
        if (!this.containerElement) return

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
                event.preventDefault()
                this.panel.changeVisibility(true)
                this.actionDispatcher.dispatch(ToggleSearchBarAction.create(this.panel, 'show'))
                this.actionDispatcher.dispatch(RetrieveTagsAction.create())
            }
        })
    }
}
