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
import { OptionsRegistry } from "./options-registry";
import { OptionsRenderer } from "./options-renderer";
import { DISymbol } from "../di.symbols";
import { SidebarPanel } from "../sidebar";

@injectable()
export class OptionsPanel extends SidebarPanel {
    @inject(DISymbol.OptionsRegistry) private optionsRegistry: OptionsRegistry;
    @inject(DISymbol.OptionsRenderer) private optionsRenderer: OptionsRenderer;

    @postConstruct()
    init() {
        this.optionsRegistry.onChange(() => this.update());
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
                {this.optionsRenderer.renderServerOptions({
                    actions: this.optionsRegistry.displayedActions,
                    layoutOptions: this.optionsRegistry.layoutOptions,
                    synthesisOptions: this.optionsRegistry.valuedSynthesisOptions,
                })}
            </div>
        );
    }

    get icon(): string {
        // Icon-source: https://feathericons.com/?query=sliders
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-sliders"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`;
    }
}
