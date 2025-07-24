/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2025 by
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

// We follow Sprotty's way of redeclaring the interface and its create function, so disable this lint check for this file.
/* eslint-disable no-redeclare */
import { SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes'
import { SEdgeImpl } from 'sprotty'
import { FluentIterable, toArray } from 'sprotty/lib/utils/iterable'
import { SKEdge, SKLabel, SKNode, SKPort } from '../skgraph-models'

type FilterDefinition<T> = {
    description: string
    filter: (el: SKGraphElement) => T
}

/** Dictionary of boolean tags with their evaluation implementation. */
const reservedStructuralTags: Record<string, FilterDefinition<boolean>> = {
    isNode: {
        description: 'True if the graph element is a node.',
        filter: (el: SKGraphElement) => el instanceof SKNode,
    },
    isEdge: {
        description: 'True if the graph element is an edge.',
        filter: (el: SKGraphElement) => el instanceof SKEdge,
    },
    isPort: {
        description: 'True if the graph element is a port.',
        filter: (el: SKGraphElement) => el instanceof SKPort,
    },
    isLabel: {
        description: 'True if the graph element is a label.',
        filter: (el: SKGraphElement) => el instanceof SKLabel,
    },
    edgeDegree: {
        description: 'True if the graph element has at least one incident edge.',
        filter: (el: SKGraphElement) =>
            toArray(getIncomingEdgesIfNode(el)).length + toArray(getOutgoingEdgesIfNode(el)).length !== 0,
    },
    inDegree: {
        description: 'True if there is at least one incoming edge to the graph element.',
        filter: (el: SKGraphElement) => toArray(getIncomingEdgesIfNode(el)).length !== 0,
    },
    outDegree: {
        description: 'True if there is at least one outgoing edge from the graph element.',
        filter: (el: SKGraphElement) => toArray(getOutgoingEdgesIfNode(el)).length !== 0,
    },
}

/** Dictionary of numeric tags with their evaluation implementation. */
const reservedNumericTags: Record<string, FilterDefinition<number>> = {
    edgeDegree: {
        description: 'The number of edges connected to this graph element.',
        filter: (el: SKGraphElement) =>
            toArray(getIncomingEdgesIfNode(el)).length + toArray(getOutgoingEdgesIfNode(el)).length,
    },
    inDegree: {
        description: 'The number of incoming edges.',
        filter: (el: SKGraphElement) => toArray(getIncomingEdgesIfNode(el)).length,
    },
    outDegree: {
        description: 'The number of outgoing edges.',
        filter: (el: SKGraphElement) => toArray(getOutgoingEdgesIfNode(el)).length,
    },
}

/**
 * Evaluates the given reserved tag if it is defined otherwise returns undefined.
 * @param tag The tag to be evaluated
 * @param element The element to evaluate the tag on
 * @returns True if the condition of the tag is fulfilled for the given element.
 */
export function evaluateReservedStructuralTag(tag: string, element: SKGraphElement): boolean | undefined {
    if (isReservedStructuralTag(tag)) {
        return reservedStructuralTags[tag].filter(element)
    }
    return undefined
}

/**
 * Evaluates the given reserved tag if it is defined otherwise returns undefined
 * @param tag The tag to be evaluated
 * @param element The element to evaluate the tag on
 * @returns The value evaluated for tag for the given element.
 */
export function evaluateReservedNumericTag(tag: string, element: SKGraphElement): number | undefined {
    if (isReservedNumericTag(tag)) {
        return reservedNumericTags[tag].filter(element)
    }
    return undefined
}

/**
 * Returns the description for a given reserved tag if it is defined otherwise returns undefined
 * @param tag The tag whose description should be returned
 * @returns The description for the tag
 */
export function descriptionForStructuralTag(tag: string): string | undefined {
    if (isReservedStructuralTag(tag)) {
        return reservedStructuralTags[tag].description
    }
    return undefined
}

/**
 * Returns the description for a given reserved tag if it is defined otherwise returns undefined
 * @param tag The tag whose description should be returned
 * @returns The description for the tag
 */
export function descriptionForNumericTag(tag: string): string | undefined {
    if (isReservedNumericTag(tag)) {
        return reservedNumericTags[tag].description
    }
    return undefined
}

/**
 * Provides the list of all pre-defined structural tags i.e. tags that can be accessed with # and will return a boolean value.
 * @returns The list of available structural tags.
 */
export function getReservedStructuralTags(): string[] {
    return Object.keys(reservedStructuralTags)
}

/**
 * Provides the list of all pre-defined numeric tags i.e. tags that can be accessed with $ and will return a numeric value.
 * @returns The list of available numeric tags.
 */
export function getReservedNumericTags(): string[] {
    return Object.keys(reservedNumericTags)
}

/**
 * Checks whether the given tag is a reserved boolean tag.
 * @param tag the tag in question
 * @returns true if it is reserved
 */
function isReservedStructuralTag(tag: string): boolean {
    return tag in reservedStructuralTags
}

/**
 * Checks whether the given tag is a reserved numeric tag.
 * @param tag the tag in question
 * @returns true if it is reserved
 */
function isReservedNumericTag(tag: string): boolean {
    return tag in reservedNumericTags
}

/** Helper function to get incoming edges. */
function getIncomingEdgesIfNode(element: SKGraphElement): FluentIterable<SEdgeImpl> {
    if (element instanceof SKNode) {
        return element.incomingEdges
    }
    return []
}

/** Helper function to get outgoing edges. */
function getOutgoingEdgesIfNode(element: SKGraphElement): FluentIterable<SEdgeImpl> {
    if (element instanceof SKNode) {
        return element.outgoingEdges
    }
    return []
}
