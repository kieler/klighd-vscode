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

import { injectable, inject } from 'inversify'
import { ICommand } from 'sprotty'
import { Action } from 'sprotty-protocol'
import { Registry } from '../base/registry'
import { DISymbol } from '../di.symbols'
import { AnimateGoToBookmark, RenderOptionsRegistry } from '../options/render-options-registry'
import {
    AddBookmarkAction,
    Bookmark,
    DeleteBookmarkAction,
    GoToBookmarkAction,
    GoToBookmarkCommand,
    RenameBookmarkAction,
    SetInitialBookmarkAction,
} from './bookmark'

/**
 * A simple {@link Registry} that holds a list of all added Bookmarks
 *
 * Handles CreateBookmark and GoToBookmark actions
 *
 */
@injectable()
export class BookmarkRegistry extends Registry {
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry

    private _bookmarks: Bookmark[] = []

    private _initialBookmark?: Bookmark

    private count = 0

    // eslint-disable-next-line consistent-return
    handle(action: Action): void | Action | ICommand {
        if (GoToBookmarkAction.isThisAction(action)) {
            return new GoToBookmarkCommand(action, this.renderOptionsRegistry.getValue(AnimateGoToBookmark))
        }
        if (SetInitialBookmarkAction.isThisAction(action)) {
            this._initialBookmark = action.bookmark
            this.addBookmark(this._initialBookmark)
        } else if (DeleteBookmarkAction.isThisAction(action)) {
            this.deleteBookmark(action.bookmarkIndex)
        } else if (RenameBookmarkAction.isThisAction(action)) {
            this.updateBookmarkName(action.bookmarkIndex, action.newName)
        } else if (AddBookmarkAction.isThisAction(action)) {
            this.addBookmark(action.bookmark)
        }
    }

    protected addBookmark(bookmark: Bookmark): void {
        bookmark.bookmarkIndex = this.count++
        this._bookmarks.push(bookmark)
        this.notifyListeners()
    }

    protected deleteBookmark(bookmarkIndex: number): void {
        const index = this._bookmarks.findIndex((value) => value.bookmarkIndex === bookmarkIndex)
        this._bookmarks.splice(index, 1)
        this.notifyListeners()
    }

    protected updateBookmarkName(bookmarkIndex: number, newName: string): void {
        const bookmark = this._bookmarks.find((bm) => bm.bookmarkIndex === bookmarkIndex)
        if (bookmark) {
            if (newName === '') {
                bookmark.name = undefined
            } else {
                bookmark.name = newName
            }
            this.notifyListeners()
        }
    }

    get initialBookmark(): Bookmark | undefined {
        return this._initialBookmark
    }

    get bookmarks(): Bookmark[] {
        return this._bookmarks
    }
}
