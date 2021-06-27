import { Command, CommandExecutionContext, CommandReturn, isViewport, TYPES, ViewportAnimation } from "sprotty";
import { Action } from "sprotty/lib/base/actions/action";
import { inject } from "inversify";


export class BookmarkAction implements Action {
    static readonly KIND = 'bookmark';
    readonly kind = BookmarkAction.KIND;
}

const ANIMATE_BOOKMARK: boolean = true

export class BookmarkCommand extends Command {
    static readonly KIND = BookmarkAction.KIND;

    static scroll?: any;
    static zoom?: number;

    constructor(@inject(TYPES.Action) protected action: BookmarkAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandReturn {
        // for now its simply a save restore
        let model = context.root
        if (isViewport(model)) {
            if (!(BookmarkCommand.scroll && BookmarkCommand.zoom)) {
                BookmarkCommand.scroll = model.scroll;
                BookmarkCommand.zoom = model.zoom;
            } else {
                let oldScroll = BookmarkCommand.scroll;
                let oldZoom = BookmarkCommand.zoom;
                BookmarkCommand.scroll = model.scroll;
                BookmarkCommand.zoom = model.zoom;

                if (ANIMATE_BOOKMARK) {
                    let oldViewport = { scroll: model.scroll, zoom: model.zoom };
                    let newViewport = { scroll: oldScroll, zoom: oldZoom }
                    context.duration = 1000;
                    return new ViewportAnimation(model, oldViewport, newViewport, context).start();
                } else {
                    model.zoom = oldZoom;
                    model.scroll = oldScroll;
                }
            }
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