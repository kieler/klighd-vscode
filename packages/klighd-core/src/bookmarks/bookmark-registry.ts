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
        if (action.kind === GoToBookmarkAction.KIND) {

            const goto_action = action as GoToBookmarkAction
            return new GoToBookmarkCommand(goto_action, this.preferenceRegistry.preferences.animateGoToBookmark)

        } else if (action.kind === SetInitialBookmark.KIND) {

            const init_action = action as SetInitialBookmark;
            this._initialBookmark = init_action.bookmark
            this.addBookmark(this._initialBookmark)

        } else if (action.kind === DeleteBookmarkAction.KIND) {

            const delete_action = action as DeleteBookmarkAction;
            this.deleteBookmark(delete_action.bookmark_index)

        } else if (action.kind === RenameBookmarkAction.KIND) {

            const rename_action = action as RenameBookmarkAction;
            this.updateBookmarkName(rename_action.bookmark_index, rename_action.new_name)

        } else if (action.kind === CreateBookmarkAction.KIND) {

            console.log("Create Bookmark Action")

            const create_action = action as CreateBookmarkAction;
            return new CreateBookmarkCommand(create_action, (bookmark: Bookmark) => this.addBookmark(bookmark))

        } else if (action.kind === AddBookmarkAction.KIND) {

            const add_action = action as AddBookmarkAction;
            this.addBookmark(add_action.bookmark)
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
