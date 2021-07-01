/*
* This program and the accompanying materials are made available under the
* terms of the Eclipse Public License 2.0 which is available at
* http://www.eclipse.org/legal/epl-2.0.
*
* SPDX-License-Identifier: EPL-2.0
*/

import { Command, CommandExecutionContext, CommandReturn, isViewport, TYPES, Viewport } from "sprotty";
import { Action } from "sprotty/lib/base/actions/action";
import { inject } from "inversify";
import { DISymbol } from "../di.symbols";
import { BookmarkRegistry } from "./bookmark-registry";

/**
 * A Bookmark
 */
export class Bookmark {
    /**
     * Optional a user defined display name for the bookmark
     */
    name?: string;

    /**
     * The Viewport which the Bookmark marks
     */
    place: Viewport;

    /**
     * The id of the viewport
     */
    elementId: string;
}

/**
 * An action to create a new Bookmark at the current Viewport
 */
export class CreateBookmarkAction implements Action {
    static readonly KIND = 'create-bookmark';
    readonly kind = CreateBookmarkAction.KIND;
}

/**
 * The Command corresponding to the CreateBookmarkAction,
 * this is what actually causes the Bookmark to be added to the {@link BookmarkRegistry}
 */
export class CreateBookmarkCommand extends Command {
    static readonly KIND = CreateBookmarkAction.KIND;

    constructor(@inject(TYPES.Action) protected action: CreateBookmarkAction, @inject(DISymbol.BookmarkRegistry) protected bookmarkRegistry: BookmarkRegistry) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const model = context.root
        if (isViewport(model)) {
            const bookmark = new Bookmark();
            // copy the viewport as we don't want the Bookmark to stay where we are now
            bookmark.place = { scroll: model.scroll, zoom: model.zoom }
            bookmark.elementId = model.id
            this.bookmarkRegistry.addBookmark(bookmark)
        }
        return model;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}


/**
 * An action to return to a bookmarked Viewport
 */
export class GoToBookmarkAction implements Action {
    static readonly KIND = 'get-bookmark';
    readonly kind = GoToBookmarkAction.KIND;

    readonly bookmark: Bookmark;

    constructor(bookmark: Bookmark) {
        this.bookmark = { ...bookmark };
    }
}
