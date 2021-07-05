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

import { injectable } from "inversify";
import { Action, ICommand, SetViewportAction } from "sprotty";
import { Registry } from "../base/registry";
import { Bookmark, GoToBookmarkAction } from "./bookmark";

/**
 * A simple {@link Registry} that holds a list of all added Bookmarks
 *
 * Handles CreateBookmark and GoToBookmark actions
 * 
 */
@injectable()
export class BookmarkRegistry extends Registry {

    private _bookmarks: Bookmark[] = [];

    handle(action: Action): void | Action | ICommand {
        if (action.kind === GoToBookmarkAction.KIND) {
            const bookmarkAction: GoToBookmarkAction = action as GoToBookmarkAction;
            // TODO add preference for whether GoToBookmark actions should be animated
            return new SetViewportAction(bookmarkAction.bookmark.elementId, bookmarkAction.bookmark.place, true)
        }
    }

    addBookmark(bookmark: Bookmark): void {
        this._bookmarks.push(bookmark)
        this.notifyListeners();
    }

    get bookmarks(): Bookmark[] {
        return this._bookmarks;
    }

}
