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

import { expect } from 'chai'
import { describe, it } from 'mocha'
import { convert } from '../../src/filtering/legacy/converter'
import { SemanticFilterTag } from '../../src/filtering/util'

describe('converting legacy filter rule objects to text', () => {
    it('atomic rules', () => {
        const filter = new SemanticFilterTag()
        filter.tag = 'someTag'

        expect(convert(filter), 'atomic tag rule').to.equal('#someTag')

        const trueFilter = { ruleName: 'boolean true', name: 'TRUE' }
        expect(convert(trueFilter), 'TRUE constant').to.equal('true')

        const falseFilter = { ruleName: 'boolean false', name: 'FALSE' }
        expect(convert(falseFilter), 'FALSE constant').to.equal('false')
    })

    it('logical connectives', () => {
        const tag1 = new SemanticFilterTag()
        tag1.tag = 'someTag'

        const tag2 = new SemanticFilterTag()
        tag2.tag = 'anotherTag'

        const logicalAnd = { ruleName: 'AND', name: 'AND', leftOperand: tag1, rightOperand: tag2 }
        expect(convert(logicalAnd), 'logical AND').to.equal('(#someTag&&#anotherTag)')

        const logicalOr = { ruleName: 'OR', name: 'OR', leftOperand: tag1, rightOperand: tag2 }
        expect(convert(logicalOr), 'logical OR').to.equal('(#someTag||#anotherTag)')

        const logicalNot = { ruleName: 'NOT', name: 'NOT', operand: tag1 }
        expect(convert(logicalNot), 'logical OR').to.equal('(!#someTag)')

        const logicalEquals = { ruleName: 'LOGICEQUAL', name: 'LOGICEQUAL', leftOperand: tag1, rightOperand: tag2 }
        expect(convert(logicalEquals), 'logical equals').to.equal('(#someTag=#anotherTag)')
    })

    it('numeric to boolean connectives', () => {
        const tag1 = new SemanticFilterTag()
        tag1.tag = 'someTag'
        tag1.num = 1

        const tag2 = new SemanticFilterTag()
        tag2.tag = 'anotherTag'
        tag2.num = 2

        const lessThan = { ruleName: 'LESSTHAN', name: 'LESSTHAN', leftOperand: tag1, rightOperand: tag2 }
        expect(convert(lessThan), 'less than').to.equal('($someTag<$anotherTag)')

        const greaterThan = { ruleName: 'GREATERTHAN', name: 'GREATERTHAN', leftOperand: tag1, rightOperand: tag2 }
        expect(convert(greaterThan), 'greater than').to.equal('($someTag>$anotherTag)')

        const lessEquals = { ruleName: 'LESSEQUALS', name: 'LESSEQUALS', leftOperand: tag1, rightOperand: tag2 }
        expect(convert(lessEquals), 'less equals').to.equal('($someTag<=$anotherTag)')

        const greaterEquals = {
            ruleName: 'GREATEREQUALS',
            name: 'GREATEREQUALS',
            leftOperand: tag1,
            rightOperand: tag2,
        }
        expect(convert(greaterEquals), 'greater equals').to.equal('($someTag>=$anotherTag)')

        const numericEquals = { ruleName: 'NUMERICEQUAL', name: 'NUMERICEQUAL', leftOperand: tag1, rightOperand: tag2 }
        expect(convert(numericEquals), 'numeric equals').to.equal('($someTag=$anotherTag)')
    })

    it('numeric constants', () => {
        const tag1 = new SemanticFilterTag()
        tag1.tag = 'someTag'
        tag1.num = 1

        const numericConstant = { ruleName: 'numeric constant', name: 'CONST', num: 5 }
        // the converter expects consts and numeric tags to be nested in numeric-to-boolean constructs
        const containerExpression = {
            ruleName: 'containerExpression',
            name: 'LESSTHAN',
            leftOperand: tag1,
            rightOperand: numericConstant,
        }
        expect(convert(containerExpression), 'numeric constant and numeric tag').to.equal('($someTag<5)')
    })

    it('numeric connectives', () => {
        const tag1 = new SemanticFilterTag()
        tag1.tag = 'someTag'
        tag1.num = 1

        const tag2 = new SemanticFilterTag()
        tag2.tag = 'anotherTag'
        tag2.num = 2

        // numeric connectives need to be wrapped in something that converts their type to a boolean so that they represent a valid formula
        const addition = { ruleName: 'NUMERICADDITION', name: 'NUMERICADDITION', leftOperand: tag1, rightOperand: tag2 }
        const wrapper = { ruleName: 'wrapper', name: 'NUMERICEQUAL', leftOperand: tag1, rightOperand: addition }
        expect(convert(wrapper), 'addition').to.equal('($someTag=($someTag+$anotherTag))')

        const subtraction = {
            ruleName: 'NUMERICSUBTRACTION',
            name: 'NUMERICSUBTRACTION',
            leftOperand: tag1,
            rightOperand: tag2,
        }
        wrapper.rightOperand = subtraction
        expect(convert(wrapper), 'subtraction').to.equal('($someTag=($someTag-$anotherTag))')

        const multiplication = {
            ruleName: 'NUMERICMULTIPLICATION',
            name: 'NUMERICMULTIPLICATION',
            leftOperand: tag1,
            rightOperand: tag2,
        }
        wrapper.rightOperand = multiplication
        expect(convert(wrapper), 'multiplication').to.equal('($someTag=($someTag*$anotherTag))')

        const division = {
            ruleName: 'NUMERICDIVISION',
            name: 'NUMERICDIVISION',
            leftOperand: tag1,
            rightOperand: tag2,
        }
        wrapper.rightOperand = division
        // test not equal here as well
        wrapper.name = 'NUMERICNOTEQUAL'
        expect(convert(wrapper), 'division').to.equal('($someTag!=($someTag/$anotherTag))')
    })
})
