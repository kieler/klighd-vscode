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

type OptionChangeHandler<T> = (newValue: T) => void;

interface BaseProps<T> {
    id: string;
    name: string;
    value: T;
    onChange: OptionChangeHandler<T>;
}

interface CheckOptionProps extends BaseProps<boolean> {}

/** Render a labeled checkbox input. */
export function CheckOption(props: CheckOptionProps): VNode {
    return (
        <label htmlFor={props.id}>
            <input
                type="checkbox"
                id={props.id}
                checked={props.value}
                on-change={() => props.onChange(!props.value)}
            />
            {props.name}
        </label>
    );
}

interface ChoiceOptionProps extends BaseProps<string> {
    availableValues: string[];
}

/** Render a labeled group of radio inputs. */
export function ChoiceOption(props: ChoiceOptionProps): VNode {
    return (
        <div classNames="options__input-container">
            <legend>{props.name}</legend>
            {props.availableValues.map((value) => (
                <label key={value} htmlFor={value}>
                    <input
                        type="radio"
                        id={value}
                        checked={props.value === value}
                        on-change={() => props.onChange(value)}
                    />
                    {value}
                </label>
            ))}
        </div>
    );
}

interface RangeOptionProps extends BaseProps<number> {
    minValue: number;
    maxValue: number;
    stepSize: number;
}

/** Render a labeled range slider as input. */
export function RangeOption(props: RangeOptionProps): VNode {
    return (
        <div classNames="options__input-container">
            <label htmlFor={props.id}>
                {props.name}: {props.value}
            </label>
            <input
                type="range"
                id={props.id}
                min={props.minValue}
                max={props.maxValue}
                value={props.stepSize}
                step={props.stepSize}
                on-change={(e: any) => props.onChange(e.target.value)}
            />
        </div>
    );
}

interface TextOptionProps extends BaseProps<string> {}

/** Renders a labeled text input. */
export function TextOption(props: TextOptionProps): VNode {
    return (
        <label htmlFor={props.id}>
            <input
                type="text"
                id={props.id}
                value={props.value}
                on-change={(e: any) => props.onChange(e.target.value)}
            />
            {props.name}
        </label>
    );
}

/** Renders a named separator. */
export function SeparatorOption(props: { name: string }): VNode {
    return <span classNames="options__separator">{props.name}</span>;
}

interface CategoryOptionProps extends BaseProps<boolean> {
    // While Snabbdom passes the children as a separate param, this children props is necessary, otherwise TS does complain.
    children?: (VNode | "") | (VNode | "")[];
}

/** Renders a labeled options group. */
export function CategoryOption(props: CategoryOptionProps, children: VNode[]): VNode {
    function handleToggle(e: any) {
        // The toggle event is also fired if the details are rendered default open.
        // To prevent an infinite toggle loop, change is only called if the state has really changed.
        if (e.target.open !== props.value) props.onChange(e.target.open);
    }

    return (
        <details open={props.value} classNames="options__category" on-toggle={handleToggle}>
            <summary>{props.name}</summary>
            {children}
        </details>
    );
}

interface SynthesisPickerProps {
    currentId: string;
    syntheses: { displayName: string; id: string }[];
    onChange: OptionChangeHandler<string>;
}

export function SynthesisPicker(props: SynthesisPickerProps): VNode {
    return (
        <div classNames="options__input-container">
            <label htmlFor="synthesisSelect">Change diagram synthesis</label>
            <select id="synthesisSelect" on-change={(e: any) => props.onChange(e.target.value)}>
                {props.syntheses.map((synthesis) => (
                    <option value={synthesis.id} selected={synthesis.id === props.currentId}>
                        {synthesis.displayName}
                    </option>
                ))}
            </select>
        </div>
    );
}
