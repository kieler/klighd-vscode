/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
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
import { VNode } from "snabbdom";

//rik imports
import { RefreshDiagramAction } from "@kieler/klighd-interactive/lib/actions";
import { CenterAction } from "sprotty-protocol";
import { KlighdFitToScreenAction, RefreshLayoutAction } from "../actions/actions";
import { CreateBookmarkAction } from "../bookmarks/bookmark";
import { PossibleQuickAction, QuickActionOption } from "../options/option-models";
import { SetRenderOptionAction } from "../options/actions";
import { PinSidebarOption,RenderOptionsRegistry, ResizeToFit } from "../options/render-options-registry";
import { IActionDispatcher, RequestExportSvgAction, TYPES } from "sprotty";
import { DISymbol } from "../di.symbols";


/**
 * A sidebar panel provides content that is shown by the sidebar.
 * An implementation has to be registered as a "SidebarPanel" DISymbol.
 */
export interface ISidebarPanel {
    /** Unique ID that identifies this panel in the DI container. */
    readonly id: string;
    /** Title that should be used if this panel is shown. */
    readonly title: string;
    /**
     * Icon used for the corresponding panel toggle.
     * For an icon source you should use feather-icons (https://feathericons.com)
     * and the FeatherIcon method from the folder feather-icons-snabbdom.
     *
     * Usage example: `<FeatherIcon iconId={"settings"}/>` where
     * settings is the name of the icon.
     */
    readonly icon: VNode;

    /**
     * A sidebar panel can provide a position for its trigger in the trigger stack.
     * The trigger at the top has the smallest position. If two panels specify the
     * same position, the panel that is resolved first by the DI container is placed on top.
     */
    readonly position: number;

    /** Registers a callback that is called when this panel should be re-rendered. */
    onUpdate(callback: () => void): void;

    /**
     * Renders this panel content and returns the content as a snabbdom VNode.
     * Learn more about snabbdom and how to use it here:
     * - https://www.npmjs.com/package/snabbdom
     * - https://www.npmjs.com/package/snabbdom-jsx (package not used anymore, but concept is still
     * the same)
     */
    render(): VNode;
}

/**
 * Abstract SidebarPanel that should be used as the base for a custom {@link ISidebarPanel}.
 *
 * This class simplifies the implementation around handling render updates.
 */
@injectable()
export abstract class SidebarPanel implements ISidebarPanel {
    private _updateCallbacks: (() => void)[] = [];

    private quickActions: QuickActionOption[];

    @inject(DISymbol.RenderOptionsRegistry) protected renderOptionsRegistry: RenderOptionsRegistry;
    @inject(TYPES.IActionDispatcher) protected actionDispatcher: IActionDispatcher;

    abstract get id(): string;
    abstract get title(): string;
    abstract get icon(): VNode;

    readonly position: number = 0;

    onUpdate(callback: () => void): void {
        this._updateCallbacks.push(callback);
    }
    
    /** Call this method if you want to trigger a re-render and update the UI. */
    update(): void {
        for (const callback of this._updateCallbacks) {
            callback();
        }
    }

    abstract render(): VNode;

    public assignQuickActions():void {
        this.quickActions = [
            {
                key: "center",
                title: "Center diagram",
                iconId: "maximize",
                action: CenterAction.create([], { animate: true }),
            },
            {
                key: "fit",
                title: "Fit to screen",
                iconId: "maximize-2",
                action: this.renderOptionsRegistry.getValue(ResizeToFit) ? undefined : KlighdFitToScreenAction.create(true),
                state: this.renderOptionsRegistry.getValue(ResizeToFit),
                effect: () => {
                        this.actionDispatcher.dispatch(SetRenderOptionAction.create(ResizeToFit.ID, !this.renderOptionsRegistry.getValue(ResizeToFit)));
                        this.update()
                }
            },
            {
                key: "layout",
                title: "Layout diagram",
                iconId: "layout",
                action: RefreshLayoutAction.create(),
            },
            {
                key: "refresh",
                title: "Refresh diagram",
                iconId: "rotate-cw",
                action: RefreshDiagramAction.create(),
            },
            {
                key: "export",
                title: "Export as SVG",
                iconId: "save",
                action: RequestExportSvgAction.create(),
            },
            {
                key: "create-bookmark",
                title: "Bookmark",
                iconId: "bookmark",
                action: CreateBookmarkAction.create()
            },
            {
                key: "pin-sidebar",
                title: this.renderOptionsRegistry.getValueOrDefault(PinSidebarOption) ? "Unpin Sidebar" : "Pin Sidebar",
                iconId: this.renderOptionsRegistry.getValueOrDefault(PinSidebarOption) ? "lock" : "unlock",
                action: SetRenderOptionAction.create(PinSidebarOption.ID, !this.renderOptionsRegistry.getValueOrDefault(PinSidebarOption)),
                state: this.renderOptionsRegistry.getValue(PinSidebarOption)
            },
        ];
        

    }
    public getQuickAction() :QuickActionOption[]{
        return this.quickActions;
    }
    protected handleQuickActionClick(type: PossibleQuickAction): void {
        const action = this.getQuickAction().find((a) => a.key === type)?.action;

        if (!action) return;

        this.actionDispatcher.dispatch(action);
    }


}

