/** @jsx html */
import { html } from "snabbdom-jsx"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Command, CommandExecutionContext, CommandReturn, isViewport, TYPES } from "sprotty";
import { Action } from "sprotty/lib/base/actions/action";
import { inject } from "inversify";
import { BookmarkPanel } from "./bookmark-panel";


export class CreateBookmarkAction implements Action {
    static readonly KIND = 'bookmark';
    readonly kind = CreateBookmarkAction.KIND;
}

export class CreateBookmarkCommand extends Command {
    static readonly KIND = CreateBookmarkAction.KIND;

    constructor(@inject(TYPES.Action) protected action: CreateBookmarkAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        // for now its simply a save restore
        let model = context.root
        if (isViewport(model)) {
            BookmarkPanel.addBookmark("MakeBookmark", <div>Bookmark</div>, new CreateBookmarkAction())
            // if (!(BookmarkCommand.scroll && BookmarkCommand.zoom)) {
            //     BookmarkCommand.scroll = model.scroll;
            //     BookmarkCommand.zoom = model.zoom;
            // } else {
            //     let oldScroll = BookmarkCommand.scroll;
            //     let oldZoom = BookmarkCommand.zoom;
            //     BookmarkCommand.scroll = model.scroll;
            //     BookmarkCommand.zoom = model.zoom;

            //     if (ANIMATE_BOOKMARK) {
            //         let oldViewport = { scroll: model.scroll, zoom: model.zoom };
            //         let newViewport = { scroll: oldScroll, zoom: oldZoom }
            //         context.duration = 1000;
            //         return new ViewportAnimation(model, oldViewport, newViewport, context).start();
            //     } else {
            //         model.zoom = oldZoom;
            //         model.scroll = oldScroll;
            //     }
            // }
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

