/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2022 by
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
import { inject, injectable } from "inversify";
import { VNode } from "snabbdom";
import { html, IActionDispatcher, TYPES } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import {
    PerformOptionsActionAction,
    SetLayoutOptionsAction,
    SetRenderOptionAction,
    SetSynthesisOptionsAction,
} from "./actions";
import {
    CheckOption,
    ChoiceOption,
    RangeOption,
    TextOption,
    SeparatorOption,
    CategoryOption,
} from "./components/option-inputs";
import {
    DisplayedActionData,
    LayoutOptionUIData,
    SynthesisOption,
    RangeOption as RangeOptionData,
    Type,
    RenderOption,
    TransformationOptionType
} from "./option-models";

// Note: Skipping a JSX children by rendering null or undefined for that child does not work the same way
// as it works in React. It will render the literals as words. To skip a child return an empty string "".
// See: https://github.com/snabbdom/snabbdom/issues/123

interface AllOptions {
    actions: DisplayedActionData[];
    layoutOptions: LayoutOptionUIData[];
    synthesisOptions: SynthesisOption[];
}

/** Renderer that is capable of rendering different option models to jsx. */
@injectable()
export class OptionsRenderer {
    @inject(TYPES.IActionDispatcher) actionDispatcher: IActionDispatcher;

    /**
     * Renders all diagram options that are provided by the server. This includes
     * the synthesis and layout options as well as performable actions.
     */
    renderServerOptions(options: AllOptions): VNode {
        return (
            <div class-options="true">
                {options.actions.length === 0 ? (
                    ""
                ) : (
                    <div class-options__section="true">
                        <h5 class-options__heading="true">Actions</h5>
                        <div class-options__button-group="true">
                            {this.renderActions(options.actions)}
                        </div>
                    </div>
                )}
                {options.synthesisOptions.length === 0 ? (
                    ""
                ) : (
                    <div class-options__section="true">
                        <h5 class-options__heading="true">Synthesis Options</h5>
                        {this.renderSynthesisOptions(options.synthesisOptions, null)}
                    </div>
                )}
                {options.layoutOptions.length === 0 ? (
                    ""
                ) : (
                    <div class-options__section="true">
                        <h5 class-options__heading="true">Layout Options</h5>
                        {this.renderLayoutOptions(options.layoutOptions)}
                    </div>
                )}
            </div>
        );
    }

    private renderActions(actions: DisplayedActionData[]): (VNode | "")[] | "" {
        return actions.map((action) => (
            <button
                class-options__button="true"
                key={action.actionId}
                title={action.tooltipText}
                on-click={this.handleActionClick.bind(this, action.actionId)}
            >
                {action.displayedName}
            </button>
        ));
    }

    private handleActionClick(actionId: string) {
        this.actionDispatcher.dispatch(PerformOptionsActionAction.create(actionId));
    }

    /**
     * Renders all synthesis options that are part of a given category. Renders all
     * synthesisOptions that belong to no category if the category is null.
     */
    private renderSynthesisOptions(
        synthesisOptions: SynthesisOption[],
        category: SynthesisOption | null
    ): (VNode | "")[] | "" {
        return synthesisOptions
            .filter((option) => option.category?.id === category?.id)
            .map((option) => {
                switch (option.type) {
                    case TransformationOptionType.CHECK:
                        return (
                            <CheckOption
                                key={option.id}
                                id={option.id}
                                name={option.name}
                                value={option.currentValue}
                                description={option.description}
                                onChange={this.handleSynthesisOptionChange.bind(this, option)}
                            />
                        );
                    case TransformationOptionType.CHOICE:
                        return (
                            <ChoiceOption
                                key={option.id}
                                id={option.id}
                                name={option.name}
                                value={option.currentValue}
                                availableValues={option.values}
                                description={option.description}
                                onChange={this.handleSynthesisOptionChange.bind(this, option)}
                            />
                        );
                    case TransformationOptionType.RANGE:
                        return (
                            <RangeOption
                                key={option.id}
                                id={option.id}
                                name={option.name}
                                value={option.currentValue}
                                minValue={(option as RangeOptionData).range.first}
                                maxValue={(option as RangeOptionData).range.second}
                                stepSize={(option as RangeOptionData).stepSize}
                                description={option.description}
                                onChange={this.handleSynthesisOptionChange.bind(this, option)}
                            />
                        );
                    case TransformationOptionType.TEXT:
                        return (
                            <TextOption
                                key={option.id}
                                id={option.id}
                                name={option.name}
                                value={option.currentValue}
                                description={option.description}
                                onChange={this.handleSynthesisOptionChange.bind(this, option)}
                            />
                        );
                    case TransformationOptionType.SEPARATOR:
                        return <SeparatorOption key={option.id} name={option.name} />;
                    case TransformationOptionType.CATEGORY:
                        return (
                            <CategoryOption
                                key={option.id}
                                id={option.id}
                                name={option.name}
                                value={option.currentValue}
                                description={option.description}
                                onChange={this.handleSynthesisOptionChange.bind(this, option)}
                            >
                                {/* Skip rendering the children if the category is closed */}
                                {!option.currentValue
                                    ? ""
                                    : this.renderSynthesisOptions(synthesisOptions, option)}
                            </CategoryOption>
                        );
                    default:
                        console.error("Unsupported option type for option:", option.name);
                        return "";
                }
            });
    }

    private handleSynthesisOptionChange(option: SynthesisOption, newValue: any) {
        this.actionDispatcher.dispatch(
            SetSynthesisOptionsAction.create([{ ...option, currentValue: newValue }])
        );
    }

    private renderLayoutOptions(layoutOptions: LayoutOptionUIData[]): (VNode | "")[] | "" {
        return layoutOptions.map((option) => {
            switch (option.type) {
                case Type.INT:
                case Type.DOUBLE:
                    return (
                        <RangeOption
                            key={option.optionId}
                            id={option.optionId}
                            name={option.name}
                            value={option.currentValue}
                            minValue={option.minValue}
                            maxValue={option.maxValue}
                            stepSize={option.type === Type.INT ? 1 : 0.01}
                            description={option.description}
                            onChange={this.handleLayoutOptionChange.bind(this, option)}
                        />
                    );
                case Type.BOOLEAN:
                    return (
                        <CheckOption
                            key={option.optionId}
                            id={option.optionId}
                            name={option.name}
                            value={option.currentValue}
                            description={option.description}
                            onChange={this.handleLayoutOptionChange.bind(this, option)}
                        />
                    );
                case Type.ENUM:
                    return (
                        <ChoiceOption
                            key={option.optionId}
                            id={option.optionId}
                            name={option.name}
                            value={option.currentValue}
                            availableValues={option.availableValues.k}
                            availableValuesLabels={option.availableValues.v}
                            description={option.description}
                            onChange={this.handleLayoutOptionChange.bind(this, option)}
                        />
                    );
                default:
                    console.error("Unsupported option type for option:", option.name);
                    return "";
            }
        });
    }

    private handleLayoutOptionChange(option: LayoutOptionUIData, newValue: any) {
        this.actionDispatcher.dispatch(
            SetLayoutOptionsAction.create([{ optionId: option.optionId, value: newValue }])
        );
    }

    /** Renders render options that are stored in the client. An example would be "show constraints" */
    renderRenderOptions(renderOptions: RenderOption[], renderCategory?: RenderOption): (VNode | "")[] | "" {
        if (renderOptions.length === 0) return "";

        return renderOptions
            .filter(option => option.renderCategory === renderCategory?.id)
            .map((option) => {
            switch (option.type) {
                case TransformationOptionType.CHECK:
                    return (
                        <CheckOption
                            key={option.id}
                            id={option.id}
                            name={option.name}
                            value={option.currentValue}
                            description={option.description}
                            onChange={this.handleRenderOptionChange.bind(this, option)}
                        />
                    );
                case TransformationOptionType.RANGE:
                    return (
                        <RangeOption
                            key={option.id}
                            id={option.id}
                            name={option.name}
                            value={option.currentValue}
                            minValue={(option as RangeOptionData).range.first}
                            maxValue={(option as RangeOptionData).range.second}
                            stepSize={(option as RangeOptionData).stepSize}
                            description={option.description}
                            onChange={this.handleRenderOptionChange.bind(this, option)}
                        />
                    );
                case TransformationOptionType.CATEGORY:
                    return (
                        <CategoryOption
                            key={option.id}
                            id={option.id}
                            name={option.name}
                            value={option.currentValue}
                            description={option.description}
                            onChange={this.handleRenderOptionChange.bind(this, option)}
                        >
                            {/* Skip rendering the children if the category is closed */}
                            {!option.currentValue
                                ? ""
                                : this.renderRenderOptions(renderOptions, option)}
                        </CategoryOption>
                    );
                case TransformationOptionType.CHOICE:
                    if (option.renderChoiceValues) {
                        return (
                            <ChoiceOption
                                key={option.id}
                                id={option.id}
                                name={option.name}
                                value={option.currentValue}
                                availableValues={option.renderChoiceValues}
                                description={option.description}
                                onChange={this.handleRenderOptionChange.bind(this, option)}
                            />
                        );
                    } else {
                        console.error("No choice values for option:", option.name);
                        return "";
                    }
                default:
                    console.error("Unsupported option type for option:", option.name);
                    return "";
            }
        });
    }

    private handleRenderOptionChange(option: RenderOption, newValue: any) {
        this.actionDispatcher.dispatch(SetRenderOptionAction.create(option.id, newValue));
    }
}
