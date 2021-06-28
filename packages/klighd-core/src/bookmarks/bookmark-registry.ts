/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import { injectable } from "inversify";
import { Action, ICommand } from "sprotty";
import { Registry } from "../base/registry";
import { Bookmark } from "./bookmark";

/**
 * A simple {@link Registry} that holds a list of all available syntheses
 * as well as the currently selected synthesis.
 *
 * Handles SetSyntheses and SetSynthesis actions to keep the state in sync which
 * new events.
 */
@injectable()
export class BookmarkRegistry extends Registry {

    private _bookmarks: Bookmark[] = [];

    handle(_action: Action): void | Action | ICommand {
        // empty
    }

    addBookmark(bookmark: Bookmark) : void {
        this._bookmarks.push(bookmark)
        this.notifyListeners();
    }

    get bookmarks(): Bookmark[] {
        return this._bookmarks;
    }

}
