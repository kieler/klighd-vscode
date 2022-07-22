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

/** @jsx html */
import { RefreshDiagramAction } from "@kieler/klighd-interactive/lib/actions";
import { inject, injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom";
import { html, IActionDispatcher, RequestExportSvgAction, TYPES } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Action, CenterAction } from "sprotty-protocol";
import { KlighdFitToScreenAction, RefreshLayoutAction } from "../actions/actions";
import { CreateBookmarkAction } from "../bookmarks/bookmark";
import { DISymbol } from "../di.symbols";
import { FeatherIcon } from '../feather-icons-snabbdom/feather-icons-snabbdom';
import { IncrementalDiagramGeneratorOption, PreferencesRegistry, ShouldSelectDiagramOption, ShouldSelectTextOption } from "../preferences-registry";
import { SidebarPanel } from "../sidebar";
import { PinSidebarAction } from "../sidebar/actions";
import { SetSynthesisAction } from "../syntheses/actions";
import { SynthesesRegistry } from "../syntheses/syntheses-registry";
import { SetPreferencesAction } from "./actions";
import { CheckOption } from "./components/option-inputs";
import { SynthesisPicker } from "./components/synthesis-picker";
import { OptionsRenderer } from "./options-renderer";
import { RenderOptionsRegistry } from "./render-options-registry";

/** Type for available quick actions. */
type PossibleAction = "center" | "fit" | "layout" | "refresh" | "export" | "create-bookmark" | "pin-sidebar";

/**
 * Sidebar panel that displays general diagram configurations,
 * such as quick actions, changing the synthesis or preferences.
 */
@injectable()
export class GeneralPanel extends SidebarPanel {
    // This panel should always have the first trigger in the sidebar
    readonly position = -10;

    /** Quick actions reference for this panel */
    private quickActions: [key: PossibleAction, title: string, iconId: string, action: Action][];

    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    @inject(DISymbol.SynthesesRegistry) private synthesesRegistry: SynthesesRegistry;
    @inject(DISymbol.PreferencesRegistry) private preferencesRegistry: PreferencesRegistry;
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;
    @inject(DISymbol.OptionsRenderer) private optionsRenderer: OptionsRenderer;

    @postConstruct()
    init(): void {
        // Subscribe to different registry changes to make this panel reactive
        this.synthesesRegistry.onChange(() => this.update());
        this.preferencesRegistry.onChange(() => this.update());
        this.renderOptionsRegistry.onChange(() => this.update());

        this.assignQuickActions()
    }

    get id(): string {
        return "general-panel";
    }

    get title(): string {
        return "General";
    }

    private assignQuickActions() {
        this.quickActions = [
            [
                "center",
                "Center diagram",
                "maximize",
                CenterAction.create([], { animate: true }),
            ],
            [
                "fit",
                "Fit to screen",
                "maximize-2",
                KlighdFitToScreenAction.create(true),
            ],
            [
                "layout",
                "Layout diagram",
                "layout",
                RefreshLayoutAction.create(),
            ],
            [
                "refresh",
                "Refresh diagram",
                "refresh-cw",
                RefreshDiagramAction.create(),
            ],
            [
                "export",
                "Export as SVG",
                "save",
                RequestExportSvgAction.create(),
            ],
            [
                "create-bookmark",
                "Bookmark",
                "bookmark",
                CreateBookmarkAction.create()
            ],
            [
                "pin-sidebar",
                this.panelPinned ? "Unpin Sidebar" : "Pin Sidebar",
                this.panelPinned ? "lock" : "unlock",
                PinSidebarAction.create()
            ],
        ];
    }

    update(): void {
        this.assignQuickActions()
        super.update()
    }

    render(): VNode {
        return (
            <div>
                <div class-options__section="true">
                    <h5 class-options__heading="true">Quick Actions</h5>
                    <div class-options__button-group="true">
                        {this.quickActions.map((action) => (
                            <button
                                title={action[1]}
                                class-options__icon-button="true"
                                on-click={() => this.handleQuickActionClick(action[0])}
                            >
                                <FeatherIcon iconId={action[2]}/>
                            </button>
                        ))}
                    </div>
                </div>
                <div class-options__section="true">
                    <h5 class-options__heading="true">Synthesis</h5>
                    <SynthesisPicker
                        currentId={this.synthesesRegistry.currentSynthesisID}
                        syntheses={this.synthesesRegistry.syntheses}
                        onChange={this.handleSynthesisPickerChange.bind(this)}
                    />
                </div>
                <div class-options__section="true">
                    <h5 class-options__heading="true">Render Options</h5>
                    {this.optionsRenderer.renderRenderOptions(
                        this.renderOptionsRegistry.allRenderOptions
                    )}
                </div>
                <div class-options__section="true">
                    <h5 class-options__heading="true">Preferences</h5>
                    <CheckOption
                        id={ShouldSelectDiagramOption.ID}
                        name={ShouldSelectDiagramOption.NAME}
                        value={this.preferencesRegistry.getValue(ShouldSelectDiagramOption)}
                        onChange={this.handlePreferenceChange.bind(this, ShouldSelectDiagramOption.ID)}
                    />
                    <CheckOption
                        id={ShouldSelectTextOption.ID}
                        name={ShouldSelectTextOption.NAME}
                        value={this.preferencesRegistry.getValue(ShouldSelectTextOption)}
                        onChange={this.handlePreferenceChange.bind(this, ShouldSelectTextOption.ID)}
                    />
                    <CheckOption
                        id={IncrementalDiagramGeneratorOption.ID}
                        name={IncrementalDiagramGeneratorOption.NAME}
                        value={this.preferencesRegistry.getValue(IncrementalDiagramGeneratorOption)}
                        onChange={this.handlePreferenceChange.bind(this, IncrementalDiagramGeneratorOption.ID)}
                    />
                </div>
            </div>
        );
    }

    private handleSynthesisPickerChange(newId: string) {
        this.actionDispatcher.dispatch(SetSynthesisAction.create(newId));
    }

    private handlePreferenceChange(key: string, newValue: any) {
        this.actionDispatcher.dispatch(SetPreferencesAction.create([{id:key, value:newValue}]));
    }

    private handleQuickActionClick(type: PossibleAction) {
        const action = this.quickActions.find((a) => a[0] === type)?.[3];

        if (!action) return;

        this.actionDispatcher.dispatch(action);
    }

    get icon(): VNode {
        return <FeatherIcon iconId={"settings"}/>;
    }
}
