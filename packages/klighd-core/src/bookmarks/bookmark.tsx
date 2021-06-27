/** @jsx html */
import { html } from "snabbdom-jsx"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Command, CommandExecutionContext, CommandReturn, isViewport, Point, TYPES, ViewportAnimation } from "sprotty";
import { Action } from "sprotty/lib/base/actions/action";
import { inject } from "inversify";
import { BookmarkPanel } from "./bookmark-panel";

const ANIMATE_BOOKMARK = true;

export class CreateBookmarkAction implements Action {
    static readonly KIND = 'create-bookmark';
    readonly kind = CreateBookmarkAction.KIND;
}

export class CreateBookmarkCommand extends Command {
    static readonly KIND = CreateBookmarkAction.KIND;

    constructor(@inject(TYPES.Action) protected action: CreateBookmarkAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        let model = context.root
        if (isViewport(model)) {
            BookmarkPanel.addBookmark("MakeBookmark" + BookmarkPanel.getLenghtBookmarks(), <
                                        div>Bookmark {BookmarkPanel.getLenghtBookmarks()}</div>, 
                                        new GetBookmarkAction(model.zoom, model.scroll))
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


export class GetBookmarkAction implements Action {
    static readonly KIND = 'get-bookmark';
    readonly kind = GetBookmarkAction.KIND;
    
    zoom: number;
    scroll: Point;
    
    constructor(zoom: number, scroll: Point){
        this.zoom = zoom;
        this.scroll = scroll
    }
}

export class GetBookmarkCommand extends Command {
    static readonly KIND = GetBookmarkAction.KIND;

    constructor(@inject(TYPES.Action) protected action: GetBookmarkAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {

        let model = context.root
        if (isViewport(model)) {
            if (ANIMATE_BOOKMARK) {
                context.duration = 1000;
                return new ViewportAnimation(model, 
                    { scroll: model.scroll, zoom: model.zoom }, 
                    { scroll: this.action.scroll, zoom: this.action.zoom }, 
                    context).start();
            } else {
                model.zoom = this.action.zoom;
                model.scroll = this.action.scroll;
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
