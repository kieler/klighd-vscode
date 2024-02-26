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
import { VNode } from 'snabbdom'
import { html } from 'sprotty' // eslint-disable-line @typescript-eslint/no-unused-vars

interface SynthesisPickerProps {
    currentId: string
    syntheses: { displayName: string; id: string }[]
    onChange: (newValue: string) => void
}

export function SynthesisPicker(props: SynthesisPickerProps): VNode {
    // The sprotty jsx function always puts an additional 'props' key around the element, requiring this hack.
    props = (props as any as { props: SynthesisPickerProps }).props
    return (
        <div class-options__column="true">
            <label htmlFor="synthesisSelect">Current synthesis:</label>
            <select
                id="synthesisSelect"
                class-options__selection="true"
                on-change={(e: any) => props.onChange(e.target.value)}
            >
                {props.syntheses.map((synthesis) => (
                    <option value={synthesis.id} selected={synthesis.id === props.currentId}>
                        {synthesis.displayName}
                    </option>
                ))}
            </select>
        </div>
    )
}
