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

const reservedStructuralTags: Record<string, (el: SKGraphElement) => boolean> = {
    children: (el: SKGraphElement) => el.children.length !== 0,
}

const reservedNumericTags: Record<string, (el: SKGraphElement) => number> = {
    children: (el: SKGraphElement) => el.children.length,
}

export function isReservedStructuralTag(tag: string): boolean {
    return tag in reservedStructuralTags
}

export function isReservedNumericTag(tag: string): boolean {
    return tag in reservedNumericTags
}

export function evaluateReservedStructuralTag(tag: string, element: SKGraphElement): boolean {
    return reservedStructuralTags[tag](element)
}

export function evaluateReservedNumericTag(tag: string, element: SKGraphElement): number {
    return reservedNumericTags[tag](element)
}
