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

import { expect } from 'chai'
import { describe, it } from 'mocha'

import { convert } from '../../src/filtering/legacy/converter'

import { binaryRule, constant, numericWrapper, tag, unaryRule } from './util/legacy-filter-fixtures'
import { SemanticFilterRule } from '../../lib/filtering/util'

function expectConversion(expression: unknown, expected: string, message?: string): void {
    expect(convert(expression as SemanticFilterRule), message).to.equal(expected)
}

describe('converting legacy filter rule objects to text', () => {
    it('converts atomic rules', () => {
        // Given
        const someTag = tag('someTag')

        const trueFilter = {
            ruleName: 'boolean true',
            name: 'TRUE',
        }

        const falseFilter = {
            ruleName: 'boolean false',
            name: 'FALSE',
        }

        // Then
        expectConversion(someTag, '#someTag', 'atomic tag rule')
        expectConversion(trueFilter, 'true', 'TRUE constant')
        expectConversion(falseFilter, 'false', 'FALSE constant')
    })

    it('converts logical connectives', () => {
        // Given
        const tag1 = tag('someTag')
        const tag2 = tag('anotherTag')

        // Then
        expectConversion(binaryRule('AND', tag1, tag2), '(#someTag&&#anotherTag)', 'logical AND')

        expectConversion(binaryRule('OR', tag1, tag2), '(#someTag||#anotherTag)', 'logical OR')

        expectConversion(unaryRule('NOT', tag1), '(!#someTag)', 'logical NOT')

        expectConversion(binaryRule('LOGICEQUAL', tag1, tag2), '(#someTag=#anotherTag)', 'logical equals')
    })

    it('converts numeric-to-boolean connectives', () => {
        // Given
        const tag1 = tag('someTag', 1)
        const tag2 = tag('anotherTag', 2)

        // Then
        expectConversion(binaryRule('LESSTHAN', tag1, tag2), '($someTag<$anotherTag)')

        expectConversion(binaryRule('GREATERTHAN', tag1, tag2), '($someTag>$anotherTag)')

        expectConversion(binaryRule('LESSEQUALS', tag1, tag2), '($someTag<=$anotherTag)')

        expectConversion(binaryRule('GREATEREQUALS', tag1, tag2), '($someTag>=$anotherTag)')

        expectConversion(binaryRule('NUMERICEQUAL', tag1, tag2), '($someTag=$anotherTag)')
    })

    it('converts numeric constants', () => {
        // Given
        const tag1 = tag('someTag', 1)

        const expression = binaryRule('LESSTHAN', tag1, constant(5))

        // Then
        expectConversion(expression, '($someTag<5)', 'numeric constant and numeric tag')
    })

    it('converts numeric connectives', () => {
        // Given
        const tag1 = tag('someTag', 1)
        const tag2 = tag('anotherTag', 2)

        const expressions = [
            ['NUMERICADDITION', '($someTag=($someTag+$anotherTag))'],
            ['NUMERICSUBTRACTION', '($someTag=($someTag-$anotherTag))'],
            ['NUMERICMULTIPLICATION', '($someTag=($someTag*$anotherTag))'],
            ['NUMERICDIVISION', '($someTag!=($someTag/$anotherTag))'],
        ] as const

        // Then
        for (const [operator, expected] of expressions) {
            const name = operator === 'NUMERICDIVISION' ? 'NUMERICNOTEQUAL' : 'NUMERICEQUAL'

            expectConversion(
                numericWrapper(name, tag1, {
                    ruleName: operator,
                    name: operator,
                    leftOperand: tag1,
                    rightOperand: tag2,
                }),
                expected,
                operator
            )
        }
    })
})
