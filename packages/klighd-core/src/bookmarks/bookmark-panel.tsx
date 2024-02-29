/** @jsx html */
/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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

import { inject, injectable, postConstruct } from 'inversify'
import { VNode } from 'snabbdom'
import { html } from 'sprotty' // eslint-disable-line @typescript-eslint/no-unused-vars
import { DISymbol } from '../di.symbols'
import { FeatherIcon } from '../feather-icons-snabbdom/feather-icons-snabbdom'
import { SidebarPanel } from '../sidebar'
import { BookmarkRegistry } from './bookmark-registry'
import {
    Bookmark,
    GoToBookmarkAction,
    CreateBookmarkAction,
    DeleteBookmarkAction,
    AddBookmarkAction,
    RenameBookmarkAction,
} from './bookmark'
/* global document, KeyboardEvent, navigator */

/**
 * Sidebar panel that displays previously set bookmarks
 */
@injectable()
export class BookmarkPanel extends SidebarPanel {
    // sets the bookmarkpanel at the bottom
    // hierarchy is: first elem has the lowest number. so the last one got the highest
    readonly position = 10 // --> last position (at the moment)

    @inject(DISymbol.BookmarkRegistry) private bookmarkRegistry: BookmarkRegistry

    @postConstruct()
    init(): void {
        // Subscribe to different registry changes to make this panel reactive
        this.bookmarkRegistry.onChange(() => this.update())
    }

    get id(): string {
        return 'bookmark-panel'
    }

    get title(): string {
        return 'Bookmarks'
    }

    get icon(): VNode {
        return <FeatherIcon iconId={'bookmark'} />
    }

    render(): VNode {
        return (
            <div>
                <div>
                    <button
                        title="Create new Bookmark"
                        class-options__icon-button="true"
                        on-click={() => this.newBookmark()}
                    >
                        <FeatherIcon iconId={'bookmark'} />
                    </button>
                    <button
                        title="Load from Clipboard"
                        class-options__icon-button="true"
                        on-click={() => this.handleBookmarkPast()}
                    >
                        <FeatherIcon iconId={'upload'} />
                    </button>
                </div>
                {this.renderBookmarkList()}
            </div>
        )
    }

    protected renderBookmarkList(): VNode {
        return <div>{this.bookmarkRegistry.bookmarks.map((bookmark) => this.renderBookmarkEntry(bookmark))}</div>
    }

    protected renderBookmarkEntry(bookmark: Bookmark): VNode {
        return (
            <div key={bookmark.bookmarkIndex}>
                <fieldset>
                    <legend>{bookmark.name ?? `Bookmark ${bookmark.bookmarkIndex}`}</legend>
                    <button
                        title="Goto"
                        class-options__icon-button="true"
                        on-click={() => this.handleBookmarkGoto(bookmark)}
                    >
                        <FeatherIcon iconId={'map-pin'} />
                    </button>
                    <button
                        title="Save to Clipboard"
                        class-options__icon-button="true"
                        on-click={() => this.handleBookmarkCopy(bookmark)}
                    >
                        <FeatherIcon iconId={'download'} />
                    </button>
                    <button
                        title="Delete Bookmark"
                        class-options__icon-button="true"
                        on-click={() => this.deleteBookmark(bookmark)}
                    >
                        <FeatherIcon iconId={'trash-2'} />
                    </button>
                    <button
                        id={bookmark.editId}
                        title="Edit Bookmark Name"
                        class-options__icon-button="true"
                        on-click={() => this.startBookmarkNameEdit(bookmark)}
                    >
                        <FeatherIcon iconId={'edit-3'} />
                    </button>
                    <span id={bookmark.saveId} class-options__hidden="true">
                        <button
                            title="Save Bookmark Name"
                            class-options__icon-button="true"
                            on-click={() => this.saveBookmarkName(bookmark)}
                        >
                            <FeatherIcon iconId={'check'} />
                        </button>
                        <input
                            type="text"
                            value={bookmark.name ?? ''}
                            placeholder="Enter Bookmark Name"
                            on-keypress={(event: KeyboardEvent) => this.inputSaveBookmarkName(bookmark, event)}
                        />
                    </span>
                </fieldset>
            </div>
        )
    }

    protected handleBookmarkGoto(bookmark: Bookmark): void {
        this.actionDispatcher.dispatch(GoToBookmarkAction.create(bookmark))
    }

    protected newBookmark(): void {
        this.actionDispatcher.dispatch(CreateBookmarkAction.create())
    }

    protected deleteBookmark(bookmark: Bookmark): void {
        if (bookmark.bookmarkIndex !== undefined) {
            this.actionDispatcher.dispatch(DeleteBookmarkAction.create(bookmark.bookmarkIndex))
        }
    }

    protected loadBookmark(bookmarkString: string): void {
        const bookmark = JSON.parse(bookmarkString)

        if (Bookmark.isBookmark(bookmark)) {
            bookmark.clone = Bookmark.prototype.clone
            this.actionDispatcher.dispatch(AddBookmarkAction.create(bookmark.clone()))
        } else {
            console.log('Clipboard does not contain a valid Bookmark')
        }
    }

    protected startBookmarkNameEdit(bookmark: Bookmark): void {
        document.getElementById(bookmark.editId)?.classList.toggle('options__hidden', true)
        const save = document.getElementById(bookmark.saveId)
        save?.classList.toggle('options__hidden', false)
        save?.getElementsByTagName('input')[0].focus()
    }

    protected inputSaveBookmarkName(bookmark: Bookmark, event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            this.saveBookmarkName(bookmark)
        }
    }

    protected saveBookmarkName(bookmark: Bookmark): void {
        document.getElementById(bookmark.editId)?.classList.toggle('options__hidden', false)
        const save = document.getElementById(bookmark.saveId)
        if (save && bookmark.bookmarkIndex !== undefined) {
            save.classList.toggle('options__hidden', true)
            const newName = save.getElementsByTagName('input')[0].value ?? undefined
            this.actionDispatcher.dispatch(RenameBookmarkAction.create(bookmark.bookmarkIndex, newName))
        }
    }

    protected handleBookmarkPast(): void {
        if (navigator.clipboard) {
            navigator.clipboard.readText().then(
                (value) => this.loadBookmark(value),
                (err) => console.error("Couldn't load Bookmark from clipboards", err)
            )
        } else {
            const textarea = document.createElement('textarea')
            document.body.appendChild(textarea)
            textarea.focus()
            textarea.select()

            try {
                const successful = document.execCommand('paste')
                if (!successful) {
                    console.log('Failed to past text from clipboard')
                } else {
                    this.loadBookmark(textarea.value)
                }
            } catch (err) {
                console.log('Unable paste text from clipboard')
            }
            document.body.removeChild(textarea)
        }
    }

    protected handleBookmarkCopy(bookmark: Bookmark): void {
        const bookmarkString = JSON.stringify(bookmark.clone())

        if (navigator.clipboard) {
            navigator.clipboard.writeText(bookmarkString).then(
                () => {
                    /* noop */
                },
                (err) => console.error("Couldn't save Bookmark to clipboard", err)
            )
        } else {
            const textarea = document.createElement('textarea')
            textarea.value = bookmarkString
            document.body.appendChild(textarea)
            textarea.focus()
            textarea.select()

            try {
                const successful = document.execCommand('copy')
                if (!successful) console.log('Failed to copy text to clipboard')
            } catch (err) {
                console.log('Unable to copy text to clipboard')
            }
            document.body.removeChild(textarea)
        }
    }
}
