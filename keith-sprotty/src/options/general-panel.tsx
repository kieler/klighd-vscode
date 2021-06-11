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
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

/** @jsx html */
import { RefreshDiagramAction } from "@kieler/keith-interactive/lib/actions";
import { inject, injectable, postConstruct } from "inversify";
import { html } from "snabbdom-jsx";
import { VNode } from "snabbdom/vnode";
import { CenterAction, IActionDispatcher, RequestExportSvgAction, TYPES } from "sprotty";
import { KeithFitToScreenAction, RefreshLayoutAction } from "../actions/actions";
import { DISymbol } from "../di.symbols";
import { SynthesisPicker } from "./components/synthesis-picker";
import { SidebarPanel } from "../sidebar";
import { SetSynthesisAction } from "../syntheses/actions";
import { SynthesesRegistry } from "../syntheses/syntheses-registry";
import { CenterIcon, ExportIcon, FitIcon, LayoutIcon, RefreshIcon } from "./components/icons";
import { RenderOptionsRegistry } from "./render-options-registry";
import { OptionsRenderer } from "./options-renderer";
import { PreferencesRegistry, SetPreferencesAction } from "../preferences-registry";
import { CheckOption } from "./components/option-inputs";

type PossibleAction = "center" | "fit" | "layout" | "refresh" | "export";

@injectable()
export class GeneralPanel extends SidebarPanel {
    // This panel should always have the first trigger in the sidebar
    readonly position = -10;

    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    @inject(DISymbol.SynthesesRegistry) private synthesesRegistry: SynthesesRegistry;
    @inject(DISymbol.PreferencesRegistry) private preferencesRegistry: PreferencesRegistry;
    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;
    @inject(DISymbol.OptionsRenderer) private optionsRenderer: OptionsRenderer;

    @postConstruct()
    init() {
        this.synthesesRegistry.onChange(() => this.update());
        this.renderOptionsRegistry.onChange(() => this.update());
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
                        <button
                            title="Center diagram"
                            classNames="options__icon-button"
                            on-click={() => this.handleActionClick("center")}
                        >
                            <CenterIcon />
                        </button>
                        <button
                            title="Fit to screen"
                            classNames="options__icon-button"
                            on-click={() => this.handleActionClick("fit")}
                        >
                            <FitIcon />
                        </button>
                        <button
                            title="Layout diagram"
                            classNames="options__icon-button"
                            on-click={() => this.handleActionClick("layout")}
                        >
                            <LayoutIcon />
                        </button>
                        <button
                            title="Refresh diagram"
                            classNames="options__icon-button"
                            on-click={() => this.handleActionClick("refresh")}
                        >
                            <RefreshIcon />
                        </button>
                        <button
                            title="Export as svg"
                            classNames="options__icon-button"
                            on-click={() => this.handleActionClick("export")}
                        >
                            <ExportIcon />
                        </button>
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
                        name="Resize to fit"
                        value={this.preferencesRegistry.preferences.resizeToFit}
                        onChange={this.handlePreferenceChange.bind(this, "resizeToFit")}
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

    private handleActionClick(type: PossibleAction) {
        switch (type) {
            case "center":
                this.actionDispatcher.dispatch(new CenterAction([], true));
                break;
            case "fit":
                this.actionDispatcher.dispatch(new KeithFitToScreenAction(true));
                break;
            case "layout":
                this.actionDispatcher.dispatch(new RefreshLayoutAction());
                break;
            case "refresh":
                // TODO: Move this action into keith-sprotty
                this.actionDispatcher.dispatch(new RefreshDiagramAction());
                break;
            case "export":
                this.actionDispatcher.dispatch(new RequestExportSvgAction());
                break;
        }
    }

    get icon(): string {
        // Icon-source: https://feathericons.com/?query=settings
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-settings"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
    }
}
