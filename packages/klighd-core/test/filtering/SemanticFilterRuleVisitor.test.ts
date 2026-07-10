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

import { taggedNode } from './util/semantic-filter-fixtures'
import { expectRule } from './util/semantic-filter-test-util'

describe('tag expression parsing', () => {
    it('evaluates conjunction of tags', () => {
        // Given
        const matchingNode = taggedNode([{ tag: 'someTag' }, { tag: 'anotherTag' }])

        const missingNode = taggedNode([{ tag: 'differentTag' }, { tag: 'anotherTag' }])

        const extendedNode = taggedNode([{ tag: 'differentTag' }, { tag: 'anotherTag' }, { tag: 'someTag' }])

        // Then
        expectRule('#someTag && #anotherTag', matchingNode, true)
        expectRule('#someTag && #anotherTag', missingNode, false)
        expectRule('#someTag && #anotherTag', extendedNode, true)
    })

    it('evaluates negated tags', () => {
        // Given
        const visibleNode = taggedNode([{ tag: 'visible' }])

        const hiddenNode = taggedNode([{ tag: 'visible' }, { tag: 'hidden' }])

        const emptyNode = taggedNode([])

        // Then
        expectRule('#visible && !#hidden', visibleNode, true)
        expectRule('#visible && !#hidden', hiddenNode, false)
        expectRule('#visible && !#hidden', emptyNode, false)
    })

    it('evaluates numeric equality', () => {
        // Given
        const matchingNode = taggedNode([{ tag: 'number', num: 1 }])

        const nonMatchingNode = taggedNode([{ tag: 'number', num: 2 }])

        const missingNode = taggedNode([])

        // Then
        expectRule('$number = 1', matchingNode, true)
        expectRule('$number = 1', nonMatchingNode, false)
        expectRule('$number = 1', missingNode, false)
    })

    it('evaluates numeric comparisons', () => {
        // Given
        const highPriorityNode = taggedNode([{ tag: 'priority', num: 7 }])

        const lowPriorityNode = taggedNode([{ tag: 'priority', num: 3 }])

        // Then
        expectRule('$priority >= 5', highPriorityNode, true)
        expectRule('$priority >= 5', lowPriorityNode, false)
    })

    it('evaluates arithmetic expressions', () => {
        // Given
        const matchingNode = taggedNode([{ tag: 'score', num: 9 }])

        const lowNode = taggedNode([{ tag: 'score', num: 7 }])

        // Then
        expectRule('$score + 2 > 10', matchingNode, true)
        expectRule('$score + 2 > 10', lowNode, false)
    })

    it('evaluates combined boolean and numeric expressions', () => {
        // Given
        const activeNode = taggedNode([{ tag: 'active' }])

        const efficientNode = taggedNode([{ tag: 'load', num: 0.3 }])

        const failingNode = taggedNode([{ tag: 'load', num: 0.3 }, { tag: 'error' }])

        // Then
        expectRule('#active || ($load < 0.5 && !#error)', activeNode, true)

        expectRule('#active || ($load < 0.5 && !#error)', efficientNode, true)

        expectRule('#active || ($load < 0.5 && !#error)', failingNode, false)
    })

    it('evaluates grouped expressions and version comparisons', () => {
        // Given
        const matchingNode = taggedNode([{ tag: 'version', num: 4 }])

        const archivedNode = taggedNode([{ tag: 'archived' }, { tag: 'version', num: 4 }])

        const oldNode = taggedNode([{ tag: 'version', num: 1 }])

        // Then
        expectRule('!#archived && ($version = 2 || $version > 3)', matchingNode, true)

        expectRule('!#archived && ($version = 2 || $version > 3)', archivedNode, false)

        expectRule('!#archived && ($version = 2 || $version > 3)', oldNode, false)
    })

    it('evaluates complex expressions with all operators', () => {
        // Given
        const activeNode = taggedNode([{ tag: 'active' }])

        const numericFailNode = taggedNode([
            { tag: 'load', num: 4 },
            { tag: 'scale', num: 3 },
            { tag: 'version', num: 2 },
        ])

        const numericStrongFailNode = taggedNode([
            { tag: 'load', num: 5 },
            { tag: 'scale', num: 3 },
            { tag: 'version', num: 2 },
        ])

        const numericPassNode = taggedNode([
            { tag: 'load', num: 7 },
            { tag: 'scale', num: 3 },
            { tag: 'version', num: 2 },
        ])

        const disabledNode = taggedNode([{ tag: 'active' }, { tag: 'disabled' }])

        const rule = '(#active && !#disabled) || (($load + 2 * $scale - 1) / 3 >= 4 && $version != 0 && $version = 2)'

        // Then
        expectRule(rule, activeNode, true)

        expectRule(rule, numericFailNode, false)
        expectRule(rule, numericStrongFailNode, false)
        expectRule(rule, numericPassNode, true)

        expectRule(rule, disabledNode, false)
    })
})
