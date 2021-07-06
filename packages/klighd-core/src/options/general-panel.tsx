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
import { html } from "snabbdom-jsx"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { VNode } from "snabbdom/vnode";
import { Action, CenterAction, IActionDispatcher, RequestExportSvgAction, TYPES } from "sprotty";
import { KlighdFitToScreenAction, RefreshLayoutAction } from "../actions/actions";
import { DISymbol } from "../di.symbols";
import { SynthesisPicker } from "./components/synthesis-picker";
import { SidebarPanel } from "../sidebar";
import { SetSynthesisAction } from "../syntheses/actions";
import { SynthesesRegistry } from "../syntheses/syntheses-registry";
import { RenderOptionsRegistry } from "./render-options-registry";
import { OptionsRenderer } from "./options-renderer";
import { PreferencesRegistry, SetPreferencesAction } from "../preferences-registry";
import { CheckOption } from "./components/option-inputs";

/** Type for available quick actions. */
type PossibleAction = "center" | "fit" | "layout" | "refresh" | "export";

/**
 * Sidebar panel that displays general diagram configurations,
 * such as quick actions, changing the synthesis or preferences.
 */
@injectable()
export class GeneralPanel extends SidebarPanel {
    // This panel should always have the first trigger in the sidebar
    readonly position = -10;

    /** Quick actions reference for this panel */
    private quickActions: [key: PossibleAction, title: string, icon: VNode, action: Action][];

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

        this.quickActions = [
            [
                "center",
                "Center diagram",
                <i attrs={{ "data-feather": "maximize" }}></i>,
                new CenterAction([], true),
            ],
            [
                "fit",
                "Fit to screen",
                <i attrs={{ "data-feather": "maximize-2" }}></i>,
                new KlighdFitToScreenAction(true),
            ],
            [
                "layout",
                "Layout diagram",
                <i attrs={{ "data-feather": "layout" }}></i>,
                new RefreshLayoutAction(),
            ],
            [
                "refresh",
                "Refresh diagram",
                <i attrs={{ "data-feather": "refresh-cw" }}></i>,
                new RefreshDiagramAction(),
            ],
            [
                "export",
                "Export as SVG",
                <i attrs={{ "data-feather": "save" }}></i>,
                new RequestExportSvgAction(),
            ],
        ];
    }

    get id(): string {
        return "general-panel";
    }

    get title(): string {
        return "General";
    }

    render(): VNode {
        return (
            <div>
                <div classNames="options__section">
                    <h5 classNames="options__heading">Quick Actions</h5>
                    <div classNames="options__button-group">
                        {this.quickActions.map((action) => (
                            <button
                                title={action[1]}
                                classNames="options__icon-button"
                                on-click={() => this.handleQuickActionClick(action[0])}
                            >
                                {action[2]}
                            </button>
                        ))}
                    </div>
                </div>
                <div classNames="options__section">
                    <h5 classNames="options__heading">Synthesis</h5>
                    <SynthesisPicker
                        currentId={this.synthesesRegistry.currentSynthesisID}
                        syntheses={this.synthesesRegistry.syntheses}
                        onChange={this.handleSynthesisPickerChange.bind(this)}
                    />
                </div>
                <div classNames="options__section">
                    <h5 classNames="options__heading">Render Options</h5>
                    {this.optionsRenderer.renderRenderOptions(
                        this.renderOptionsRegistry.allRenderOptions
                    )}
                </div>
                <div classNames="options__section">
                    <h5 classNames="options__heading">Preferences</h5>
                    <CheckOption
                        id="resizeToFit"
                        name="Resize To Fit"
                        value={this.preferencesRegistry.preferences.resizeToFit}
                        onChange={this.handlePreferenceChange.bind(this, "resizeToFit")}
                    />
                    <CheckOption
                        id="forceLightBackground"
                        name="Use Light Background"
                        value={this.preferencesRegistry.preferences.forceLightBackground}
                        onChange={this.handlePreferenceChange.bind(this, "forceLightBackground")}
                    />
                    <CheckOption
                        id="shouldSelectDiagram"
                        name="Text Selects Diagram"
                        value={this.preferencesRegistry.preferences.shouldSelectDiagram}
                        onChange={this.handlePreferenceChange.bind(this, "shouldSelectDiagram")}
                    />
                    <CheckOption
                        id="shouldSelectText"
                        name="Diagram Selects Text"
                        value={this.preferencesRegistry.preferences.shouldSelectText}
                        onChange={this.handlePreferenceChange.bind(this, "shouldSelectText")}
                    />
                </div>
            </div>
        );
    }

    private handleSynthesisPickerChange(newId: string) {
        this.actionDispatcher.dispatch(new SetSynthesisAction(newId));
    }

    private handlePreferenceChange(key: string, newValue: any) {
        this.actionDispatcher.dispatch(new SetPreferencesAction({ [key]: newValue }));
    }

    private handleQuickActionClick(type: PossibleAction) {
        const action = this.quickActions.find((a) => a[0] === type)?.[3];

        if (!action) return;

        this.actionDispatcher.dispatch(action);
    }

    get icon(): VNode {
        return <i attrs={{ "data-feather": "settings" }}></i>;
    }
}
