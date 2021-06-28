import { Command, CommandExecutionContext, CommandReturn, isViewport, TYPES, Viewport, ViewportAnimation } from "sprotty";
import { Action } from "sprotty/lib/base/actions/action";
import { inject } from "inversify";
import { DISymbol } from "../di.symbols";
import { BookmarkRegistry } from "./bookmark-registry";

const ANIMATE_BOOKMARK = true;

export class Bookmark {
    name?: string;
    place: Viewport;
}

export class CreateBookmarkAction implements Action {
    static readonly KIND = 'create-bookmark';
    readonly kind = CreateBookmarkAction.KIND;
}

export class CreateBookmarkCommand extends Command {
    static readonly KIND = CreateBookmarkAction.KIND;

    constructor(@inject(TYPES.Action) protected action: CreateBookmarkAction, @inject(DISymbol.BookmarkRegistry) protected bookmarkRegistry: BookmarkRegistry) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        const model = context.root
        if (isViewport(model)) {
            const bookmark = new Bookmark();
            bookmark.place = {scroll: model.scroll, zoom: model.zoom}
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


export class GoToBookmarkAction implements Action {
    static readonly KIND = 'get-bookmark';
    readonly kind = GoToBookmarkAction.KIND;
    
    viewport: Viewport;
    
    constructor(bookmark: Bookmark){
        this.viewport = bookmark.place;
    }
}

export class GoToBookmarkCommand extends Command {
    static readonly KIND = GoToBookmarkAction.KIND;

    constructor(@inject(TYPES.Action) protected action: GoToBookmarkAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {

        const model = context.root
        if (isViewport(model)) {
            if (ANIMATE_BOOKMARK) {
                context.duration = 1000;
                return new ViewportAnimation(model, 
                    { scroll: model.scroll, zoom: model.zoom }, 
                    { scroll: this.action.viewport.scroll, zoom: this.action.viewport.zoom }, 
                    context).start();
            } else {
                model.zoom = this.action.viewport.zoom;
                model.scroll = this.action.viewport.scroll;
            }
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandReturn {
        return context.root;
    }
}
