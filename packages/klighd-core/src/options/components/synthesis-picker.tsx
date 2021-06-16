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

interface SynthesisPickerProps {
    currentId: string;
    syntheses: { displayName: string; id: string }[];
    onChange: (newValue: string) => void;
}

export function SynthesisPicker(props: SynthesisPickerProps): VNode {
    return (
        <div classNames="options__column">
            <label htmlFor="synthesisSelect">Current synthesis:</label>
            <select id="synthesisSelect" classNames="options__selection" on-change={(e: any) => props.onChange(e.target.value)}>
                {props.syntheses.map((synthesis) => (
                    <option value={synthesis.id} selected={synthesis.id === props.currentId}>
                        {synthesis.displayName}
                    </option>
                ))}
            </select>
        </div>
    );
}
