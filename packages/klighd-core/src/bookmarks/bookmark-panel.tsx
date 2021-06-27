/** @jsx html */
import { html } from "snabbdom-jsx"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { inject, injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom/vnode";
import { DISymbol } from "../di.symbols";
import { RenderOptionsRegistry } from "../options/render-options-registry";
import { PreferencesRegistry } from "../preferences-registry";
import { SidebarPanel } from "../sidebar";
import { SynthesesRegistry } from "../syntheses/syntheses-registry";
import { TYPES, IActionDispatcher, Action } from "sprotty";

@injectable()
export class BookmarkPanel extends SidebarPanel {
    
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    @inject(DISymbol.SynthesesRegistry) private synthesesRegistry: SynthesesRegistry;
    @inject(DISymbol.PreferencesRegistry) private preferencesRegistry: PreferencesRegistry;
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;

    private static bookmarkActions: [key: string, icon: VNode, action: Action][]

    @postConstruct()
    init(): void {
        // Subscribe to different registry changes to make this panel reactive
        this.synthesesRegistry.onChange(() => this.update());
        this.preferencesRegistry.onChange(() => this.update());
        this.renderOptionsRegistry.onChange(() => this.update());
        BookmarkPanel.bookmarkActions = []
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
        return (
                <div>
                {BookmarkPanel.bookmarkActions.map((action) => (
                    <div>
                        <button 
                            on-click={() => this.handleBookmarkActionClick(action[0])}
                        >
                            {action[1]}
                        </button>
                    </div>
                    ))}
                </div>
        );
    } 

    private handleBookmarkActionClick(type: string) {
        const action = BookmarkPanel.bookmarkActions.find((a) => a[0] === type)?.[2];

        if (!action) return;

        this.actionDispatcher.dispatch(action);
    }

    public static addBookmark(key: string, icon: VNode, action: Action): void{
        BookmarkPanel.bookmarkActions.push([key, icon, action]);
    }

    public static getLenghtBookmarks():number{
        return BookmarkPanel.bookmarkActions.length
    }
}
