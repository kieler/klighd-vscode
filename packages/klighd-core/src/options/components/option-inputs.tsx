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
import { VNode } from "snabbdom";
import { html } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars

type OptionChangeHandler<T> = (newValue: T) => void;

interface BaseProps<T> {
    key?: string;
    id: string;
    name: string;
    value: T;
    onChange: OptionChangeHandler<T>;
}

type CheckOptionProps = BaseProps<boolean>;

/** Render a labeled checkbox input. */
export function CheckOption(props: CheckOptionProps): VNode {
    return (
        <label htmlFor={props.id}>
            <input
                classNames="options__input"
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
    availableValuesLabels?: string[];
}

/** Render a labeled group of radio inputs. */
export function ChoiceOption(props: ChoiceOptionProps): VNode {
    return (
        <div classNames="options__input-container">
            <legend>{props.name}</legend>
            {props.availableValues.map((value, i) => (
                <label key={value} htmlFor={props.availableValuesLabels?.[i] ?? value}>
                    <input
                        classNames="options__input"
                        type="radio"
                        id={props.availableValuesLabels?.[i] ?? value}
                        checked={props.value === value}
                        on-change={() => props.onChange(value)}
                    />
                    {props.availableValuesLabels?.[i] ?? value}
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
        <div classNames="options__column">
            <label htmlFor={props.id}>
                {props.name}: {props.value}
            </label>
            <input
                classNames="options__input"
                type="range"
                id={props.id}
                min={props.minValue}
                max={props.maxValue}
                attrs={{ "value": props.value }}
                step={props.stepSize}
                on-change={(e: any) => props.onChange(e.target.value)}
            />
        </div>
    );
}

type TextOptionProps = BaseProps<string>;

/** Renders a labeled text input. */
export function TextOption(props: TextOptionProps): VNode {
    return (
        <div classNames="options__column">
            <label htmlFor={props.id}>{props.name}</label>
            <input
                classNames="options__input options__text-field"
                type="text"
                id={props.id}
                value={props.value}
                on-change={(e: any) => props.onChange(e.target.value)}
            />
        </div>
    );
}

/** Renders a named separator. */
export function SeparatorOption(props: { name: string; key?: string }): VNode {
    return <span classNames="options__separator">{props.name}</span>;
}

interface CategoryOptionProps extends BaseProps<boolean> {
    // While Snabbdom passes the children as a separate param, this children prop is necessary, otherwise TS does complain.
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
