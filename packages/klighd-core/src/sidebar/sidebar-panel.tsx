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

/** @jsx html */
import { RefreshDiagramAction } from "@kieler/klighd-interactive/lib/actions";
import { inject, injectable } from "inversify";
import { VNode } from "snabbdom";
import { html } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { IActionDispatcher, RequestExportSvgAction, TYPES } from "sprotty";
import { CenterAction } from "sprotty-protocol";
import { KlighdFitToScreenAction, RefreshLayoutAction } from "../actions/actions";
import { CreateBookmarkAction } from "../bookmarks/bookmark";
import { DISymbol } from "../di.symbols";
import { FeatherIcon } from '../feather-icons-snabbdom/feather-icons-snabbdom';
import { SetRenderOptionAction } from "../options/actions";
import { PossibleQuickAction, QuickActionOption } from "../options/option-models";
import { PinSidebarOption, RenderOptionsRegistry, ResizeToFit } from "../options/render-options-registry";


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

    /**
     * This method inits the quickactions, if you wanna use it for a panel.
     * To use these quckactions you have to use the getQuickActions() method to get the quickactions.
     * Furthermore you have to call this assign method in update() and init().
     * Also make sure you add the renderOptionsRegistry to the constructor init(), otherwise
     * it won't update correctly.
     * Please also add the html create method for the quickactions at the right place (createQuickActionsHTML() )
     * (also add the right imports)
     */
    protected assignQuickActions():void {
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
                state: this.renderOptionsRegistry.getValue(PinSidebarOption),
                effect: () => {
                    this.actionDispatcher.dispatch(SetRenderOptionAction.create(PinSidebarOption.ID, !this.renderOptionsRegistry.getValue(PinSidebarOption)));
                    this.update()
            }
            },
        ];
        
    }

    /**
     * Gets all available quick actions so tab panels can inherit it.
     * @returns The available quick actions so other classes can inherit it.
     */
    public getQuickActions(): QuickActionOption[] {
        return this.quickActions
    }

    /**
     * Handles the click on one quickaction element.
     * @param type The quickaction to handle.
     */
    protected handleQuickActionClick(type: PossibleQuickAction): void {
        const action = this.getQuickActions().find((a) => a.key === type)?.action

        if (!action) return

        this.actionDispatcher.dispatch(action)
    }

    /**
     * This method creates the quickactionsbar via html
     */
    protected createQuickActionsHTML(): void{
        const quickactionsHTML=
        <div class-options__section="true">
            <h5 class-options__heading="true">Quick Actions</h5>
            <div class-options__button-group="true">
                {this.getQuickActions().map((action) => (
                    <button
                        title={action.title}
                        class-options__icon-button="true"
                        class-sidebar__enabled-button={!!action.state}
                        on-click={() => {
                            if (action.effect) {
                                action.effect.apply(this)
                            }
                            this.handleQuickActionClick(action.key)
                        }}
                    >
                        <FeatherIcon iconId={action.iconId}/>
                    </button>
                ))}
            </div>
        </div>
        return quickactionsHTML
    }
}
