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
import { Bookmark, GoToBookmarkAction, GoToBookmarkCommand, SetInitialBookmark } from "./bookmark";

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

    handle(action: Action): void | Action | ICommand {
        if (action.kind === GoToBookmarkAction.KIND) {
            return new GoToBookmarkCommand(action as GoToBookmarkAction, this.preferenceRegistry.preferences.animateGoToBookmark)
        } else if (action.kind === SetInitialBookmark.KIND) {
            this._initialBookmark = (action as SetInitialBookmark).bookmark
        }
    }

    addBookmark(bookmark: Bookmark): void {
        this._bookmarks.push(bookmark)
        this.notifyListeners();
    }

    get initialBookmark(): Bookmark | undefined {
        return this._initialBookmark
    }

    get bookmarks(): Bookmark[] {
        return this._bookmarks;
    }

}
