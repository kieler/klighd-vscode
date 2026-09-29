/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2025-2026 by
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

import { describe, it } from 'mocha'

import { createChildrenFixture, createConnectedFixture, label, node, edge, port } from './util/semantic-filter-fixtures'

import { expectRule } from './util/semantic-filter-test-util'

describe('reserved tags and lists tests', () => {
    it('$children and #children list evaluation', () => {
        // Given
        const { parent, child1 } = createChildrenFixture()

        // Then
        expectRule('$children >= 2', parent, true)
        expectRule('$children >= 2', child1, false)

        expectRule('#children', parent, true)
        expectRule('#children', child1, false)
    })

    it('#isNode, #isEdge, #isPort, #isLabel', () => {
        // Given
        const n = node()
        const e = edge('a', 'b')
        const p = port()
        const l = label()

        // Then
        expectRule('#isNode', n, true)
        expectRule('#isNode', e, false)
        expectRule('#isNode', p, false)
        expectRule('#isNode', l, false)

        expectRule('#isEdge', e, true)
        expectRule('#isEdge', n, false)
        expectRule('#isEdge', p, false)
        expectRule('#isEdge', l, false)

        expectRule('#isPort', p, true)
        expectRule('#isPort', n, false)
        expectRule('#isPort', e, false)
        expectRule('#isPort', l, false)

        expectRule('#isLabel', l, true)
        expectRule('#isLabel', n, false)
        expectRule('#isLabel', e, false)
        expectRule('#isLabel', p, false)
    })

    it('$adjacents and #adjacents', () => {
        // Given
        const { n1, n2, n3 } = createConnectedFixture()

        // Then
        expectRule('$adjacents >= 1', n1, true)
        expectRule('$adjacents >= 1', n2, true)
        expectRule('$adjacents >= 1', n3, false)

        expectRule('#adjacents', n1, true)
        expectRule('#adjacents', n2, true)
        expectRule('#adjacents', n3, false)
    })

    it('$incoming and #incoming', () => {
        // Given
        const { n1, n2, n3 } = createConnectedFixture()

        // Then
        expectRule('$incoming >= 1', n1, false)
        expectRule('$incoming >= 1', n2, true)
        expectRule('$incoming >= 1', n3, false)

        expectRule('#incoming', n1, false)
        expectRule('#incoming', n2, true)
        expectRule('#incoming', n3, false)
    })

    it('$outgoing and #outgoing', () => {
        // Given
        const { n1, n2, n3 } = createConnectedFixture()

        // Then
        expectRule('$outgoing >= 1', n1, true)
        expectRule('$outgoing >= 1', n2, false)
        expectRule('$outgoing >= 1', n3, false)

        expectRule('#outgoing', n1, true)
        expectRule('#outgoing', n2, false)
        expectRule('#outgoing', n3, false)
    })
})
