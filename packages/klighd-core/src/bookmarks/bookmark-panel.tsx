/** @jsx html */
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

import { inject, injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom/vnode";
import { html } from "snabbdom-jsx"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { IActionDispatcher, TYPES } from "sprotty";
import { DISymbol } from "../di.symbols";
import { SidebarPanel } from "../sidebar";
import { BookmarkRegistry } from "./bookmark-registry";
import { Bookmark, GoToBookmarkAction } from "./bookmark";

/**
 * Sidebar panel that displays previousely set bookmarks
 */
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
    get icon(): VNode {
        return <i attrs={{ "data-feather": "bookmark" }}></i>
    }
    render(): VNode {
        return <div>{this.bookmarkRegistry.bookmarks.map((bookmark, index) => (
            <div key={index}>
                <fieldset>
                    <legend>{bookmark.name ?? ("Bookmark " + index)}</legend>
                    <button
                        title="GoTo"
                        classNames="options__icon-button"
                        on-click={() => this.handleBookmarkActionClick(bookmark)}
                    >
                        <i attrs={{ "data-feather": "map-pin" }} />
                    </button>
                    <button
                        title="Copy to Clipboard"
                        classNames="options__icon-button"
                        on-click={() => { return }}
                    >
                        <i attrs={{ "data-feather": "copy" }} />
                    </button>
                </fieldset>
            </div>
        )
        )}</div>;
    }

    private handleBookmarkActionClick(bookmark: Bookmark) {
        this.actionDispatcher.dispatch(new GoToBookmarkAction(bookmark));
    }

}
