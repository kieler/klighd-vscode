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
import { html } from "snabbdom-jsx"; // eslint-disable-line @typescript-eslint/no-unused-vars
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
