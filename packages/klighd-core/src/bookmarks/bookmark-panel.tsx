/** @jsx html */
import { html } from "snabbdom-jsx"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { inject, injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom/vnode";
// import { TYPES, IActionDispatcher } from "sprotty";
import { DISymbol } from "../di.symbols";
// import { OptionsRenderer } from "../options/options-renderer";
import { RenderOptionsRegistry } from "../options/render-options-registry";
import { PreferencesRegistry } from "../preferences-registry";
import { SidebarPanel } from "../sidebar";
import { SynthesesRegistry } from "../syntheses/syntheses-registry";
// import { TYPES, IActionDispatcher } from "sprotty";
// import { BookmarkAction } from "./bookmark";
// import { ButtonOption } from "../options/components/option-inputs";

@injectable()
export class BookmarkPanel extends SidebarPanel {
    
    // @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    @inject(DISymbol.SynthesesRegistry) private synthesesRegistry: SynthesesRegistry;
    @inject(DISymbol.PreferencesRegistry) private preferencesRegistry: PreferencesRegistry;
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;

    @postConstruct()
    init(): void {
        // Subscribe to different registry changes to make this panel reactive
        this.synthesesRegistry.onChange(() => this.update());
        this.preferencesRegistry.onChange(() => this.update());
        this.renderOptionsRegistry.onChange(() => this.update());
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
                <div>
                    
                </div>
                <div classNames="BookmarkSection">
                    {this.renderAllBookmarks()}
                </div>
            </div>
        );
    } 

    renderAllBookmarks(): VNode {
        return (
            <div>gogo</div>
        );
    }
}
