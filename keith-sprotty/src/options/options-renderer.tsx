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
import { inject, injectable } from "inversify";
import { RenderOption, TransformationOptionType } from "../options";
import {
    DisplayedActionData,
    LayoutOptionUIData,
    SynthesisOption,
    RangeOption as RangeOptionData,
    Type,
} from "./option-models";
import { IActionDispatcher, TYPES } from "sprotty";
import {
    PerformOptionsActionAction,
    SetLayoutOptionsAction,
    SetSynthesisOptionsAction,
} from "./actions";
import {
    CheckOption,
    ChoiceOption,
    RangeOption,
    TextOption,
    SeparatorOption,
    CategoryOption,
} from "./options-components";

// Note: Skipping a JSX children by rendering null or undefined for that child does not work the same way
// as it works in React. It will render the literals as words. To skip a child return an empty string "".
// See: https://github.com/snabbdom/snabbdom/issues/123

interface AllOptions {
    actions: DisplayedActionData[];
    renderOptions: RenderOption[];
    layoutOptions: LayoutOptionUIData[];
    synthesisOptions: SynthesisOption[];
}

@injectable()
export class OptionsRenderer {
    @inject(TYPES.IActionDispatcher) actionDispatcher: IActionDispatcher;

    render(options: AllOptions): VNode {
        console.groupCollapsed("Rendering diagram options:");
        console.log(options.actions);
        console.log(options.synthesisOptions);
        console.log(options.renderOptions);
        console.log(options.layoutOptions);
        console.groupEnd();

        return (
            <div classNames="options">
                {options.actions.length === 0 ? (
                    ""
                ) : (
                    <div classNames="options__section">
                        <h5 classNames="options__heading">Actions</h5>
                        {this.renderActions(options.actions)}
                    </div>
                )}
                {options.synthesisOptions.length === 0 ? (
                    ""
                ) : (
                    <div classNames="options__section">
                        <h5 classNames="options__heading">Synthesis Options</h5>
                        {this.renderSynthesisOptions(options.synthesisOptions, null)}
                    </div>
                )}
                {options.renderOptions.length === 0 ? (
                    ""
                ) : (
                    <div classNames="options__section">
                        <h5 classNames="options__heading">Render Options</h5>
                        {this.renderRenderOptions(options.renderOptions)}
                    </div>
                )}
                {options.layoutOptions.length === 0 ? (
                    ""
                ) : (
                    <div classNames="options__section">
                        <h5 classNames="options__heading">Layout Options</h5>
                        {this.renderLayoutOptions(options.layoutOptions)}
                    </div>
                )}
            </div>
        );
    }

    private renderActions(actions: DisplayedActionData[]): (VNode | "")[] | "" {
        return actions.map((action) => (
            <button
                classNames="options__button"
                key={action.actionId}
                title={action.tooltipText}
                on-click={this.handleActionClick.bind(this, action.actionId)}
            >
                {action.displayedName}
            </button>
        ));
    }

    private handleActionClick(actionId: string) {
        this.actionDispatcher.dispatch(new PerformOptionsActionAction(actionId));
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
        console.log("Synthesis Option toggled", option, newValue);
        this.actionDispatcher.dispatch(
            new SetSynthesisOptionsAction([{ ...option, currentValue: newValue }])
        );
    }

    private renderRenderOptions(renderOptions: RenderOption[]): (VNode | "")[] | "" {
        return renderOptions.map((option) => {
            switch (option.type) {
                case TransformationOptionType.CHECK:
                    return (
                        <CheckOption
                            key={option.id}
                            id={option.id}
                            name={option.name}
                            value={option.currentValue}
                            onChange={this.handleRenderOptionChange.bind(this, option)}
                        />
                    );
                default:
                    console.error("Unsupported option type for option:", option.name);
                    return "";
            }
        });
    }

    private handleRenderOptionChange(option: RenderOption, newValue: any) {
        console.log("Render Option toggled", option, newValue);
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
        console.log("Layout Option toggled", option, newValue);
        this.actionDispatcher.dispatch(
            new SetLayoutOptionsAction([{ optionId: option.optionId, value: newValue }])
        );
    }
}
