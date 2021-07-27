/** @jsx html */
/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 * 
 * Copyright 2021 by
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

import { inject, injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom/vnode";
import { html } from "snabbdom-jsx"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { IActionDispatcher, TYPES } from "sprotty";
import { DISymbol } from "../di.symbols";
import { SidebarPanel } from "../sidebar";
import { BookmarkRegistry } from "./bookmark-registry";
import { Bookmark, GoToBookmarkAction, CreateBookmarkAction } from "./bookmark";

/**
 * Sidebar panel that displays previousely set bookmarks
 */
@injectable()
export class BookmarkPanel extends SidebarPanel {

    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    @inject(DISymbol.BookmarkRegistry) private bookmarkRegistry: BookmarkRegistry

    @postConstruct()
    init(): void {
        // Subscribe to different registry changes to make this panel reactive
        this.bookmarkRegistry.onChange(() => this.update());
    }

    get id(): string {
        return "bookmark-panel"
    }
    get title(): string {
        return "Bookmarks"
    }
    get icon(): VNode {
        return <i attrs={{ "data-feather": "bookmark" }}></i>
    }
    render(): VNode {
        return <div>
            <div>
                <button
                    title="Create new Bookmark"
                    classNames="options__icon-button"
                    on-click={() => this.newBookmark()}
                >
                    <i attrs={{ "data-feather": "bookmark" }} />
                </button>
                <button
                    title="Load from Clipboard"
                    classNames="options__icon-button"
                    on-click={() => this.handleBookmarkPast()}
                >
                    <i attrs={{ "data-feather": "upload" }} />
                </button>
            </div>
            {this.renderBookmarkList()}
        </div>;
    }

    private renderBookmarkList(): VNode {
        return <div>
            {
                this.bookmarkRegistry.bookmarks.map((bookmark, index) => (
                    this.renderBookmarkEntry(bookmark, index)
                ))
            }
        </div>
    }

    private renderBookmarkEntry(bookmark: Bookmark, index: number): VNode {
        return <div key={index}>
            <fieldset>
                <legend>{bookmark.name ?? ("Bookmark " + bookmark.bookmarkIndex)}</legend>
                <button
                    title="Goto"
                    classNames="options__icon-button"
                    on-click={() => this.handleBookmarkGoto(bookmark)}
                >
                    <i attrs={{ "data-feather": "map-pin" }} />
                </button>
                <button
                    title="Save to Clipboard"
                    classNames="options__icon-button"
                    on-click={() => this.handleBookmarkCopy(bookmark)}
                >
                    <i attrs={{ "data-feather": "download" }} />
                </button>
                <button
                    title="Delete Bookmark"
                    classNames="options__icon-button"
                    on-click={() => this.deleteBookmark(bookmark)}
                >
                    <i attrs={{ "data-feather": "trash-2" }} />
                </button>
            </fieldset>
        </div>
    }

    private handleBookmarkGoto(bookmark: Bookmark) {
        this.actionDispatcher.dispatch(new GoToBookmarkAction(bookmark));
    }

    private newBookmark() {
        this.actionDispatcher.dispatch(new CreateBookmarkAction());
    }

    private deleteBookmark(bookmark: Bookmark) {
        this.bookmarkRegistry.deleteBookmark(bookmark)
    }

    private loadBookmark(bookmarkString: string) {
        let bookmark = JSON.parse(bookmarkString);

        if (Bookmark.isBookmark(bookmark)) {
            bookmark =
                this.bookmarkRegistry.addBookmark(BookmarkPanel.copyBookmark(bookmark))
        } else {
            console.log("Clipboard does not contain a valid Bookmark")
        }

    }

    private static copyBookmark(bookmark: Bookmark): Bookmark {
        // make a copy of only the fields a bookmark has and without the bookmarkIndex
        return {
            name: bookmark.name,
            place: {
                zoom: bookmark.place.zoom,
                scroll: {
                    x: bookmark.place.scroll.x,
                    y: bookmark.place.scroll.y
                }
            }
        }
    }

    private handleBookmarkPast() {

        if (navigator.clipboard) {
            navigator.clipboard.readText().then((value) => this.loadBookmark(value), (err) => console.error("Couldn't load Bookmark from clipboards", err))
        } else {
            const textarea = document.createElement("textarea");
            document.body.appendChild(textarea)
            textarea.focus()
            textarea.select();

            try {
                const successfull = document.execCommand('paste');
                if (!successfull) {
                    console.log("Failed to past text from clipboard");
                } else {
                    this.loadBookmark(textarea.value)
                }
            } catch (err) {
                console.log("Unable paste text from clipboard");
            }
            document.body.removeChild(textarea);
        }

    }

    private handleBookmarkCopy(bookmark: Bookmark) {

        const bookmarkString = JSON.stringify(BookmarkPanel.copyBookmark(bookmark));

        if (navigator.clipboard) {
            navigator.clipboard.writeText(bookmarkString).then(() => { /* noop */ }, (err) => console.error("Couldn't save Bookmark to clipboard", err))
        } else {
            const textarea = document.createElement("textarea");
            textarea.value = bookmarkString;
            document.body.appendChild(textarea)
            textarea.focus()
            textarea.select();

            try {
                const successfull = document.execCommand('copy');
                if (!successfull)
                    console.log("Failed to copy text to clipboard");
            } catch (err) {
                console.log("Unable to copy text to clipboard");
            }
            document.body.removeChild(textarea);
        }
    }

}
