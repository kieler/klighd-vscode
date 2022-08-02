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
import { CenterAction } from "sprotty-protocol";
import { KlighdFitToScreenAction, RefreshLayoutAction } from "../actions/actions";
import { CreateBookmarkAction } from "../bookmarks/bookmark";
import { DISymbol } from "../di.symbols";
import { FeatherIcon } from '../feather-icons-snabbdom/feather-icons-snabbdom';
import { IncrementalDiagramGeneratorOption, PreferencesRegistry, ShouldSelectDiagramOption, ShouldSelectTextOption } from "../preferences-registry";
import { SidebarPanel } from "../sidebar";
import { SetSynthesisAction } from "../syntheses/actions";
import { SynthesesRegistry } from "../syntheses/syntheses-registry";
import { SetPreferencesAction, SetRenderOptionAction } from "./actions";
import { CheckOption } from "./components/option-inputs";
import { SynthesisPicker } from "./components/synthesis-picker";
import { PossibleQuickAction, QuickActionOption } from "./option-models";
import { OptionsRenderer } from "./options-renderer";
import { PinSidebarOption, RenderOptionsRegistry, ResizeToFit } from "./render-options-registry";

/**
 * Sidebar panel that displays general diagram configurations,
 * such as quick actions, changing the synthesis or preferences.
 */
@injectable()
export class GeneralPanel extends SidebarPanel {
    // This panel should always have the first trigger in the sidebar
    readonly position = -10;

    /** Quick actions reference for this panel */
    private quickActions: QuickActionOption[];

    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    @inject(DISymbol.SynthesesRegistry) private synthesesRegistry: SynthesesRegistry;
    @inject(DISymbol.PreferencesRegistry) private preferencesRegistry: PreferencesRegistry;
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;
    @inject(DISymbol.OptionsRenderer) private optionsRenderer: OptionsRenderer;

    @postConstruct()
    async init(): Promise<void> {
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

    private handleQuickActionClick(type: PossibleQuickAction) {
        const action = this.quickActions.find((a) => a.key === type)?.action;

        if (!action) return;

        this.actionDispatcher.dispatch(action);
    }

    get icon(): VNode {
        return <FeatherIcon iconId={"settings"}/>;
    }
}
