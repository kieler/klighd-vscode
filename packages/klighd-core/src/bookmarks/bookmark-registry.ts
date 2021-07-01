/*
* This program and the accompanying materials are made available under the
* terms of the Eclipse Public License 2.0 which is available at
* http://www.eclipse.org/legal/epl-2.0.
*
* SPDX-License-Identifier: EPL-2.0
*/

import { injectable } from "inversify";
import { Action, ICommand } from "sprotty";
import { Registry } from "../base/registry";
import { Bookmark } from "./bookmark";

/**
 * A simple {@link Registry} that holds a list of all added Bookmarks
 *
 * Handles CreateBookmark and GoToBookmark actions
 * 
 */
@injectable()
export class BookmarkRegistry extends Registry {

    private _bookmarks: Bookmark[] = [];

    handle(_action: Action): void | Action | ICommand {
        // empty
    }

    addBookmark(bookmark: Bookmark): void {
        this._bookmarks.push(bookmark)
        this.notifyListeners();
    }

    get bookmarks(): Bookmark[] {
        return this._bookmarks;
    }

}
