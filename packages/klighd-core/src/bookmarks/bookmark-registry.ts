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

import { injectable, inject } from "inversify";
import { Action, ICommand } from "sprotty";
import { Registry } from "../base/registry";
import { DISymbol } from "../di.symbols";
import { PreferencesRegistry } from "../preferences-registry";
import { AddBookmarkAction, Bookmark, CreateBookmarkAction, CreateBookmarkCommand, DeleteBookmarkAction, GoToBookmarkAction, GoToBookmarkCommand, RenameBookmarkAction, SetInitialBookmark } from "./bookmark";

/**
 * A simple {@link Registry} that holds a list of all added Bookmarks
 *
 * Handles CreateBookmark and GoToBookmark actions
 * 
 */
@injectable()
export class BookmarkRegistry extends Registry {

    @inject(DISymbol.PreferencesRegistry) private preferenceRegistry: PreferencesRegistry;

    private _bookmarks: Bookmark[] = [];
    private _initialBookmark?: Bookmark;
    private count = 0;

    handle(action: Action): void | Action | ICommand {
        if (GoToBookmarkAction.isThisAction(action)) {

            return new GoToBookmarkCommand(action, this.preferenceRegistry.preferences.animateGoToBookmark)

        } else if (SetInitialBookmark.isThisAction(action)) {

            this._initialBookmark = action.bookmark
            this.addBookmark(this._initialBookmark)

        } else if (DeleteBookmarkAction.isThisAction(action)) {

            this.deleteBookmark(action.bookmark_index)

        } else if (RenameBookmarkAction.isThisAction(action)) {

            this.updateBookmarkName(action.bookmark_index, action.new_name)

        } else if (CreateBookmarkAction.isThisAction(action)) {

            console.log("Create Bookmark Action")

            return new CreateBookmarkCommand(action, (bookmark: Bookmark) => this.addBookmark(bookmark))

        } else if (AddBookmarkAction.isThisAction(action)) {

            this.addBookmark(action.bookmark)

        }
    }

    protected addBookmark(bookmark: Bookmark): void {
        bookmark.bookmarkIndex = this.count++;
        this._bookmarks.push(bookmark)
        this.notifyListeners();
    }

    protected deleteBookmark(bookmark_index: number): void {
        const index = this._bookmarks.findIndex((value) => value.bookmarkIndex === bookmark_index);
        this._bookmarks.splice(index, 1)
        this.notifyListeners();
    }

    protected updateBookmarkName(bookmark_index: number, new_name: string): void {
        const bm = this._bookmarks.find((bm) => bm.bookmarkIndex === bookmark_index)
        if (bm) {
            if (new_name === "") {
                bm.name = undefined
            } else {
                bm.name = new_name
            }
            this.notifyListeners();
        }

    }

    get initialBookmark(): Bookmark | undefined {
        return this._initialBookmark
    }

    get bookmarks(): Bookmark[] {
        return this._bookmarks;
    }

}
