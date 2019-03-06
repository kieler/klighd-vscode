/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

 /**
  * Holds an option defined by the diagram synthesis.
  * This is the counterpart to the KLighD's java implementation of the SynthesisOption.
  * Also adds a sourceHash that contains the hash code of the corresponding java instance for this option.
  */
export interface SynthesisOption {
    name: string
    type: TransformationOptionType
    initialValue: any
    values: any[]
    currentValue: any
    category?: SynthesisOption
    sourceHash: number
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
 * The different types a SynthesisOption can have.
 */
export enum TransformationOptionType {
    CHECK = 0,
    CHOICE = 1,
    RANGE = 2,
    SEPARATOR = 3,
    CATEGORY = 4
}