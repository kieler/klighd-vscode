/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018-2022 by
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

/** Base option that can be rendered as an ui input*/
export interface RenderOption {
    id: string;
    name: string;
    type: TransformationOptionType;
    initialValue: any;
    currentValue: any;
    description?: string;
    /** The category this RenderOption is part of. */
    renderCategory?: string;
    /** The values this RenderOption has, if it's type is {@link TransformationOptionType.CHOICE}. */
    renderChoiceValues?: any[];
}

export interface Preference extends RenderOption {
    notifyServer: boolean
}

/**
 * The different types a SynthesisOption can have.
 */
export enum TransformationOptionType {
    CHECK = 0,
    CHOICE = 1,
    RANGE = 2,
    TEXT = 3,
    SEPARATOR = 4,
    CATEGORY = 5,
}

/**
 * Holds an option defined by the diagram synthesis.
 * This is the counterpart to the KLighD's java implementation of the SynthesisOption.
 * Also adds a sourceHash that contains the hash code of the corresponding java instance for this option.
 */
export interface SynthesisOption extends RenderOption {
    values: any[]
    category?: SynthesisOption
}

/**
 * This is just a SynthesisOption with the ability to represent its current value.
 */
export interface ValuedSynthesisOption {
    synthesisOption: SynthesisOption
    currentValue: any
}

/**
 * A SynthesisOption with the RANGE type.
 */
export interface RangeOption extends SynthesisOption {
    range: Range
    stepSize: number
}

/**
 * A value range between a first and second value.
 */
export interface Range {
    first: number
    second: number
}

/**
 * Data class to hold the result of a keith/diagramOptions/getOptions message.
 * Includes a list of the synthesisOptions with their current value, a list of the layout options and a list of the
 * actions performable for the current diagram.
 */
export interface GetOptionsResult {
    /**
     * The list of all displayed synthesis options for the diagram for the given URI.
     */
    valuedSynthesisOptions: ValuedSynthesisOption[]

    /**
     * The list of all displayed layout options for the diagram for the given URI.
     */
    layoutOptions: LayoutOptionUIData[]

    /**
     * The list of all displayed actions for the diagram for the given URI.
     */
    actions: DisplayedActionData[]
}

export interface LayoutOptionUIData {
    /** identifier of the layout option. */
    optionId: string
    /** the default value of this option. */
    defaultValue: Pair<any, string>
    /** type of the layout option. */
    type: Type
    /** user friendly name of the layout option. */
    name: string
    /** a description to be displayed in the UI. */
    description: string
    /** cached value of the available choices. */
    choices: string[]
    /** the minimal value for the option, or {@code undefined} */
    minValue: number
    /** the maximal value for the option, or {@code undefined} */
    maxValue: number
    /** the set of values to offer, or {@code undefined} */
    availableValues: Pair<any[], string[]>
    /** The current value of this option, if necessary */
    currentValue: any
}

export interface LayoutOptionValue {
    /**
     * Identifier of the layout option.
     */
    optionId: string
    /**
     * The new value of this option.
     */
    value: any
}

export interface PreferenceValue {
    id: string
    value: any
}

/**
 * A key-value pair matching the interface of org.eclipse.xtext.xbase.lib.Pair
 */
export interface Pair<K, V> {
    k: K
    v: V
}

/**
 * Enumeration of data types for layout options.
 * From java class org.eclipse.elk.core.data.Type
 */
export enum Type {
    /** undefined type. */
    UNDEFINED,
    /** boolean type. */
    BOOLEAN,
    /** integer type. */
    INT,
    /** string type. */
    STRING,
    /** double type. */
    DOUBLE,
    /** enumeration type. */
    ENUM,
    /** enumeration set type. */
    ENUMSET,
    /** {@link IDataObject} type. */
    OBJECT
}

/**
 * From java class org.eclipse.elk.graph.properties.IProperty:
 * Interface for property identifiers. Properties have a type and a default value, and
 * they have an internal mechanism for identification, which should be compatible
 * with their {@link java.lang.Object#equals(Object)} and {@link java.lang.Object#hashCode()}
 * implementations.
 *
 * @param <T> type of the property
 */
export interface IProperty<T> {
    default: T
    id: string
    lowerBound: any
    upperBound: any
}

/**
 * From java class de.cau.cs.kieler.klighd.DisplayedActionData:
 * A concise helper record class accommodating the required information for
 * {@link de.cau.cs.kieler.klighd.IAction IAction}'s offered in the UI's side bar.
 */
export interface DisplayedActionData {
    actionId: string
    displayedName: string
    // enablementTester: any
    // image: any
    tooltipText: string
}