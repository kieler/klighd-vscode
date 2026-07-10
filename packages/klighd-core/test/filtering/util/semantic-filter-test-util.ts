/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2026 by
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

import { expect } from 'chai'
import { createSemanticFilter } from '../../../src/filtering/util'
import { SKEdge, SKNode, SKPort, SKLabel } from '../../../src/skgraph-models'

export type FilterElement = SKNode | SKEdge | SKPort | SKLabel

export function expectRule(rule: string, element: FilterElement, expected: boolean, message?: string): void {
    const filter = createSemanticFilter(rule)
    expect(filter(element), message).to.equal(expected)
}
