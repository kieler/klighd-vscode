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
import { html } from "snabbdom-jsx";
import { VNode } from "snabbdom/vnode";
import { inject, injectable, postConstruct } from "inversify";
import { AbstractUIExtension, IActionDispatcher, Patcher, PatcherProvider, TYPES } from "sprotty";
import { OptionsRegistry } from "./options-registry";
import { OptionsRenderer } from "./options-renderer";
import { RenderOptions } from "../options";
import { DISymbol } from "../di.symbols";
import { SynthesesRegistry } from "../syntheses/syntheses-registry";
import { SynthesisPicker } from "./options-components";
import { SetSynthesisAction } from "../syntheses/actions";
import { SidebarPanel } from "../sidebar";

@injectable()
export class OptionsPanel extends SidebarPanel {
    @inject(TYPES.IActionDispatcher) actionDispatcher: IActionDispatcher;
    @inject(DISymbol.OptionsRegistry) optionsRegistry: OptionsRegistry;
    @inject(DISymbol.SynthesesRegistry) synthesesRegistry: SynthesesRegistry;
    @inject(RenderOptions) renderOptions: RenderOptions;
    @inject(DISymbol.OptionsRenderer) optionsRenderer: OptionsRenderer;

    @postConstruct()
    init() {
        this.optionsRegistry.onOptionsChange(() => this.update());
        this.synthesesRegistry.onSynthesisChange(() => this.update());
    }

    get id(): string {
        return "options-panel";
    }

    get title(): string {
        return "Options";
    }

    render(): VNode {
        return (
            <div classNames="options-panel__content">
                <SynthesisPicker
                    currentId={this.synthesesRegistry.currentSynthesisID}
                    syntheses={this.synthesesRegistry.syntheses}
                    onChange={this.handleSynthesisPickerChange.bind(this)}
                />
                {this.optionsRenderer.render({
                    actions: this.optionsRegistry.displayedActions,
                    layoutOptions: this.optionsRegistry.layoutOptions,
                    synthesisOptions: this.optionsRegistry.valuedSynthesisOptions,
                    renderOptions: this.renderOptions.getRenderOptions(),
                })}
            </div>
        );
    }

    private handleSynthesisPickerChange(newId: string) {
        this.actionDispatcher.dispatch(new SetSynthesisAction(newId));
    }

    get icon(): string {
        // Icon-source: https://feathericons.com/?query=settings
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-settings"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
    }
}

@injectable()
export class OptionsPanelOld extends AbstractUIExtension {
    static readonly ID = "options-panel";

    private patcher: Patcher;
    private node: VNode;

    @inject(TYPES.PatcherProvider) patcherProvider: PatcherProvider;
    @inject(TYPES.IActionDispatcher) actionDispatcher: IActionDispatcher;
    @inject(DISymbol.OptionsRegistry) optionsRegistry: OptionsRegistry;
    @inject(DISymbol.SynthesesRegistry) synthesesRegistry: SynthesesRegistry;
    @inject(RenderOptions) renderOptions: RenderOptions;
    @inject(DISymbol.OptionsRenderer) optionsRenderer: OptionsRenderer;

    @postConstruct()
    init() {
        this.patcher = this.patcherProvider.patcher;
        this.optionsRegistry.onOptionsChange(() => {
            // Rerender if the options changed
            if (this.node) this.node = this.patcher(this.node, this.getJSXContent());
        });
        this.synthesesRegistry.onSynthesisChange(() => {
            // Rerender if the synthesis changed
            if (this.node) this.node = this.patcher(this.node, this.getJSXContent());
        });
    }

    id(): string {
        return OptionsPanelOld.ID;
    }

    containerClass(): string {
        return OptionsPanelOld.ID;
    }

    protected onBeforeShow(): void {
        this.node = this.patcher(this.node, this.getJSXContent());
    }

    protected initializeContents(containerElement: HTMLElement): void {
        // Snabbdom's patch does not work directly on the containerElement (guess it does not count as empty... :shrug:)
        const jsxRoot = document.createElement("div");
        const title = document.createElement("h4");
        title.classList.add("options-panel__title");
        title.innerText = "Options";

        // onBeforeShow patches the real content. This only prepares the initial VDOM.
        // Using the real Content would patch it twice on first open.
        this.node = this.patcher(jsxRoot, <div></div>);

        containerElement.appendChild(title);
        containerElement.appendChild(jsxRoot);

        // Notice that AbstractUIExtension only calls initializeContents once, so this handler is also only registered once.
        this.addClickOutsideListenser(containerElement);
    }

    private getJSXContent(): VNode {
        return (
            <div classNames="options-panel__content">
                <SynthesisPicker
                    currentId={this.synthesesRegistry.currentSynthesisID}
                    syntheses={this.synthesesRegistry.syntheses}
                    onChange={this.handleSynthesisPickerChange.bind(this)}
                />
                {this.optionsRenderer.render({
                    actions: this.optionsRegistry.displayedActions,
                    layoutOptions: this.optionsRegistry.layoutOptions,
                    synthesisOptions: this.optionsRegistry.valuedSynthesisOptions,
                    renderOptions: this.renderOptions.getRenderOptions(),
                })}
            </div>
        );
    }

    private handleSynthesisPickerChange(newId: string) {
        this.actionDispatcher.dispatch(new SetSynthesisAction(newId));
    }

    /**
     * Register a click outside handler that hides the content when a user click outsides.
     * Using "mousedown" instead of "click" also hides the panel as soon as the user starts
     * dragging the diagram.
     */
    private addClickOutsideListenser(containerElement: HTMLElement): void {
        document.addEventListener("mousedown", (e) => {
            // See for information on detecting "click outside": https://stackoverflow.com/a/64665817/7569889
            if (!this.activeElement || e.composedPath().includes(containerElement)) return;

            this.hide();
        });
    }
}
