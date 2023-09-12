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
import { inject, injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom";
import { html } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { DISymbol } from "../di.symbols";
import { FeatherIcon } from '../feather-icons-snabbdom/feather-icons-snabbdom';
import { IncrementalDiagramGeneratorOption, PreferencesRegistry, ShouldSelectDiagramOption, ShouldSelectTextOption } from "../preferences-registry";
import { SidebarPanel } from "../sidebar";
import { SetSynthesisAction } from "../syntheses/actions";
import { SynthesesRegistry } from "../syntheses/syntheses-registry";
import { SetPreferencesAction } from "./actions";
import { CheckOption } from "./components/option-inputs";
import { SynthesisPicker } from "./components/synthesis-picker";
import { OptionsRenderer } from "./options-renderer";
import { DebugOptions, PinSidebarOption, RenderOptionsRegistry, ResizeToFit } from "./render-options-registry";
import { QuickActionsBar } from '../sidebar/sidebar-panel';

/**
 * Sidebar panel that displays general diagram configurations,
 * such as quick actions, changing the synthesis or preferences.
 */
@injectable()
export class GeneralPanel extends SidebarPanel {
    // Sets this panel at the second position
    // hierarchy is: first elem has the lowest number. so the last one got the highest
    readonly position = 0; // --> middle position (at the moment)
                                                    
    @inject(DISymbol.SynthesesRegistry) private synthesesRegistry: SynthesesRegistry;
    @inject(DISymbol.PreferencesRegistry) private preferencesRegistry: PreferencesRegistry;
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

    update(): void {
        super.assignQuickActions()
        super.update()
    }

    render(): VNode {
        return (
            <div>
                <QuickActionsBar
                    quickActions={this.getQuickActions()}
                    onChange={this.handleQuickActionClick.bind(this)}
                    thisSidebarPanel={this}
                />
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
                        this.renderOptionsRegistry.allRenderOptions,
                        this.renderOptionsRegistry.getValue(DebugOptions) as boolean
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

    get icon(): VNode {
        return <FeatherIcon iconId={"settings"}/>;
    }
}
