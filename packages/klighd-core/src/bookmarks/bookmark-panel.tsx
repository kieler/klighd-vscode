/** @jsx html */
import { html } from "snabbdom-jsx"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { inject, injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom/vnode";
import { DISymbol } from "../di.symbols";
import { SidebarPanel } from "../sidebar";
import { BookmarkRegistry } from "./bookmark-registry";
import { Bookmark, GoToBookmarkAction } from "./bookmark";
import { IActionDispatcher, TYPES } from "sprotty";

@injectable()
export class BookmarkPanel extends SidebarPanel {
    
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    @inject(DISymbol.BookmarkRegistry) private bookmarkRegistry: BookmarkRegistry

    @postConstruct()
    init(): void {
        // Subscribe to different registry changes to make this panel reactive
        this.bookmarkRegistry.onChange(() => this.update());
    }

    get id(): string {
        return "bookmark-panel"
    }
    get title(): string {
        return "Bookmarks"
    }
    get icon(): string {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-bookmark"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
    }
    render(): VNode {
        return <div>{this.bookmarkRegistry.bookmarks.map((bookmark,index) => (
                <div key={index}>
                    <button on-click={() => this.handleBookmarkActionClick(bookmark)}>{bookmark.name ?? ("Bookmark " + index)}</button>
                </div>
            )
        })}</div>;
    } 

    private handleBookmarkActionClick(bookmark: Bookmark) {
        this.actionDispatcher.dispatch(new GoToBookmarkAction(bookmark));
    }

}
