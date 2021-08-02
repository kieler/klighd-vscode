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

import { Command, CommandExecutionContext, CommandReturn, isViewport, SetViewportAction, SetViewportCommand, TYPES, Viewport } from "sprotty";
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
     * Bookmark Index
     * Assigned by BookmarkRegistry
     */
    bookmarkIndex?: number;

    constructor(place: Viewport, name?: string) {
        this.place = place;
        this.name = name;
    }

    public static isBookmark(value: any): value is Bookmark {

        if ('zoom' in value.place
            && 'scroll' in value.place
            && 'x' in value.place.scroll
            && 'y' in value.place.scroll) {
            return true
        }
        return false
    }

    public clone(): Bookmark {
        const place = {
            zoom: this.place.zoom,
            scroll: { x: this.place.scroll.x, y: this.place.scroll.y }
        }
        return new Bookmark(place, this.name);
    }

    public get saveId(): string {
        return "bookmark-save-" + this.bookmarkIndex
    }

    public get editId(): string {
        return "bookmark-edit-" + this.bookmarkIndex
    }
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
            // copy the viewport as we do want the Bookmark to stay where we are now
            const bookmark = new Bookmark({ scroll: model.scroll, zoom: model.zoom });
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
        this.bookmark = bookmark.clone();
    }
}

export class GoToBookmarkCommand implements Command {

    action: GoToBookmarkAction
    animate: boolean
    setCommand: SetViewportCommand

    constructor(action: GoToBookmarkAction, animate: boolean) {
        this.action = action
        this.animate = animate
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const viewAction = new SetViewportAction(context.root.id, this.action.bookmark.place, this.animate)
        this.setCommand = new SetViewportCommand(viewAction)

        return this.setCommand.execute(context)
    }
    undo(context: CommandExecutionContext): CommandReturn {
        return this.setCommand.undo(context)
    }
    redo(context: CommandExecutionContext): CommandReturn {
        return this.setCommand.redo(context)
    }

}

export class SetInitialBookmark implements Action {
    static readonly KIND = 'init-bookmark';
    readonly kind = SetInitialBookmark.KIND;

    readonly bookmark: Bookmark;

    constructor(bookmark: Bookmark) {
        this.bookmark = bookmark
    }
}