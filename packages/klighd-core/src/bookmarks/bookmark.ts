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

import { inject, injectable } from "inversify";
import { ActionDispatcher, Command, CommandExecutionContext, CommandReturn, isViewport, SetViewportCommand, TYPES } from "sprotty";
import { Action, SetViewportAction, Viewport } from "sprotty-protocol";

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
export interface CreateBookmarkAction extends Action {
    kind: typeof CreateBookmarkAction.KIND
}

export namespace CreateBookmarkAction {
    export const KIND = 'create-bookmark'

    export function create(): CreateBookmarkAction {
        return {
            kind: KIND,
        }
    }

    /** Type predicate to narrow an action to this action. */
    export function isThisAction(action: Action): action is CreateBookmarkAction {
        return action.kind === CreateBookmarkAction.KIND;
    }
}

/**
 * The Command corresponding to the CreateBookmarkAction,
 * this is what actually causes the Bookmark to be added to the {@link BookmarkRegistry}
 */
@injectable()
export class CreateBookmarkCommand extends Command {
    static readonly KIND = CreateBookmarkAction.KIND;

    @inject(TYPES.IActionDispatcher) private actionDispatcher: ActionDispatcher;

    // the created bookmark for us to be able to perform the undo/redo
    // undo relies on the fact that this is the same object that is stored in the registry
    // and we are able to observe the assigned id through this reference
    private bookmark?: Bookmark;

    constructor(@inject(TYPES.Action) protected action: CreateBookmarkAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const model = context.root

        if (isViewport(model)) {
            // copy the viewport as we do want the Bookmark to stay where we are now
            this.bookmark = new Bookmark({ scroll: model.scroll, zoom: model.zoom });
            this.actionDispatcher.dispatch(AddBookmarkAction.create(this.bookmark))
        }
        return model;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        if (this.bookmark?.bookmarkIndex) {
            this.actionDispatcher.dispatch(DeleteBookmarkAction.create(this.bookmark.bookmarkIndex))
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        if (this.bookmark) {
            this.actionDispatcher.dispatch(AddBookmarkAction.create(this.bookmark))
        }
        return context.root;
    }
}

/**
 * An action to add a Bookmark to the BookmarkRegistry
 */
export interface AddBookmarkAction extends Action {
    kind: typeof AddBookmarkAction.KIND
    bookmark: Bookmark
}

export namespace AddBookmarkAction {
    export const KIND = 'add-bookmark'

    export function create(bookmark: Bookmark): AddBookmarkAction {
        return {
            kind: KIND,
            bookmark,
        }
    }

    /** Type predicate to narrow an action to this action. */
    export function isThisAction(action: Action): action is AddBookmarkAction {
        return action.kind === AddBookmarkAction.KIND;
    }
}

/**
 * An action to delete a Bookmark from the BookmarkRegistry
 */
export interface DeleteBookmarkAction extends Action {
    kind: typeof DeleteBookmarkAction.KIND
    bookmark_index: number
}

export namespace DeleteBookmarkAction {
    export const KIND = 'delete-bookmark'

    export function create(bookmark_index: number): DeleteBookmarkAction {
        return {
            kind: KIND,
            bookmark_index,
        }
    }

    /** Type predicate to narrow an action to this action. */
    export function isThisAction(action: Action): action is DeleteBookmarkAction {
        return action.kind === DeleteBookmarkAction.KIND;
    }
}

export interface RenameBookmarkAction extends Action {
    kind: typeof RenameBookmarkAction.KIND
    bookmark_index: number
    new_name: string
}

export namespace RenameBookmarkAction {
    export const KIND = 'rename-bookmark'

    export function create(bookmark_index: number, new_name: string): RenameBookmarkAction {
        return {
            kind: KIND,
            bookmark_index,
            new_name,
        }
    }

    /** Type predicate to narrow an action to this action. */
    export function isThisAction(action: Action): action is RenameBookmarkAction {
        return action.kind === RenameBookmarkAction.KIND;
    }
}

/**
 * An action to return to a bookmarked Viewport
 */
export interface GoToBookmarkAction extends Action {
    kind: typeof GoToBookmarkAction.KIND
    bookmark: Bookmark
}

export namespace GoToBookmarkAction {
    export const KIND = 'get-bookmark'

    export function create(bookmark: Bookmark): GoToBookmarkAction {
        return {
            kind: KIND,
            bookmark,
        }
    }

    /** Type predicate to narrow an action to this action. */
    export function isThisAction(action: Action): action is GoToBookmarkAction {
        return action.kind === GoToBookmarkAction.KIND;
    }
}

export class GoToBookmarkCommand implements Command {
    static readonly KIND = GoToBookmarkAction.KIND;

    action: GoToBookmarkAction
    animate: boolean
    setCommand: SetViewportCommand

    constructor(action: GoToBookmarkAction, animate: boolean) {
        this.action = action
        this.animate = animate
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const viewAction = SetViewportAction.create(context.root.id, this.action.bookmark.place, { animate: this.animate })
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

export interface SetInitialBookmarkAction extends Action {
    kind: typeof SetInitialBookmarkAction.KIND
    bookmark: Bookmark
}

export namespace SetInitialBookmarkAction {
    export const KIND = 'init-bookmark'

    export function create(bookmark: Bookmark): SetInitialBookmarkAction {
        return {
            kind: KIND,
            bookmark,
        }
    }

    /** Type predicate to narrow an action to this action. */
    export function isThisAction(action: Action): action is SetInitialBookmarkAction {
        return action.kind === SetInitialBookmarkAction.KIND;
    }
}