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
import { injectable } from "inversify";
import { RenderOption } from "../options";
import { DisplayedActionData, LayoutOptionUIData, ValuedSynthesisOption } from "./option-models";

// Note: Skipping a JSX children by rendering null or undefined for that child does not work the same way
// as it works in React. It will render the literals as words. To skip a child return an empty string "".
// See: https://github.com/snabbdom/snabbdom/issues/123

interface AllOptions {
    actions: DisplayedActionData[];
    renderOptions: RenderOption[];
    layoutOptions: LayoutOptionUIData[];
    synthesisOptions: ValuedSynthesisOption[];
}

@injectable()
export class OptionsRenderer {
    render(options: AllOptions): VNode {
        return (
            <div class={{ options: true }}>
                {this.renderActions(options.actions)}
                {this.renderSynthesisOptions(options.synthesisOptions)}
                {this.renderRenderOptions(options.renderOptions)}
                {this.renderLayoutOptions(options.layoutOptions)}
            </div>
        );
    }

    private renderActions(actions: DisplayedActionData[]): VNode | "" {
        if (actions.length === 0) return "";

        return (
            <div class={{ options__section: true }}>
                <h5 class={{ options__heading: true }}>Actions</h5>
                {actions.map((action) => (
                    <button
                        class={{ options__button: true }}
                        key={action.actionId}
                        title={action.tooltipText}
                    >
                        {action.displayedName}
                    </button>
                ))}
            </div>
        );
    }

    private renderSynthesisOptions(synthesisOptions: ValuedSynthesisOption[]): VNode | "" {
        if (synthesisOptions.length === 0) return "";

        return (
            <div class={{ options__section: true }}>
                <h5 class={{ options__heading: true }}>Synthesis Options</h5>
                {synthesisOptions.map((synthesisOption) => (
                    <p>{synthesisOption.synthesisOption.name}</p>
                ))}
            </div>
        );
    }

    private renderRenderOptions(renderOptions: RenderOption[]): VNode | "" {
        if (renderOptions.length === 0) return "";

        return (
            <div class={{ options__section: true }}>
                <h5 class={{ options__heading: true }}>Render Options</h5>
                {renderOptions.map((renderOption) => (
                    <p>{renderOption.name}</p>
                ))}
            </div>
        );
    }

    private renderLayoutOptions(layoutOptions: LayoutOptionUIData[]): VNode | "" {
        if (layoutOptions.length === 0) return "";

        return (
            <div class={{ options__section: true }}>
                <h5 class={{ options__heading: true }}>Layout Options</h5>
                {layoutOptions.map((layoutOption) => (
                    <p>{layoutOption.name}</p>
                ))}
            </div>
        );
    }
}
