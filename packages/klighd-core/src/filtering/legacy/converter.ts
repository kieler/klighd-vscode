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
import { isTag, SemanticFilterRule, SemanticFilterTag } from '../util'

/// / Base constructs ////

/**
 * Base interface for connectives. Connectives take one or more filter rules as operands and
 * construct a new rule.
 */
interface Connective extends SemanticFilterRule {
    name: string
}

/// / Connectives ////

/**
 * Base interface for unary connectives. Unary Connectives take exactly one operand.
 */
interface UnaryConnective extends Connective {
    operand: SemanticFilterRule
}

/**
 * Base interface for binary connectives. Binary Connectives take exactly two operands.
 */
interface BinaryConnective extends Connective {
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
}

/**
 * Base interface for ternary connectives. Ternary Connectives take exactly three operands.
 */
interface TernaryConnective extends Connective {
    firstOperand: SemanticFilterRule
    secondOperand: SemanticFilterRule
    thirdOperand: SemanticFilterRule
}

/// / Logic Connectives ////

/**
 * A True Connective always evaluates to true.
 */
class TrueConnective implements Connective {
    static NAME = 'TRUE'

    name = TrueConnective.NAME

    ruleName?: string
}

namespace TrueConnective {
    export function toString(_conn: TrueConnective): string {
        return 'true'
    }
}

/**
 * A False Connective always evaluates to false.
 */
class FalseConnective implements Connective {
    static NAME = 'FALSE'

    name = FalseConnective.NAME

    ruleName?: string
}

namespace FalseConnective {
    export function toString(_conn: FalseConnective): string {
        return 'false'
    }
}

/**
 * An Identity Connective evaluates to its operand i.e. ID (R) is equivalent to R.
 */
class IdentityConnective implements UnaryConnective {
    static NAME = 'ID'

    name = IdentityConnective.NAME

    operand: SemanticFilterRule

    ruleName?: string
}

namespace IdentityConnective {
    export function toString(conn: IdentityConnective): string {
        return convert(conn.operand)
    }
}

/**
 * A Not Connective takes a rule R and evaluates to true
 * iff
 * R evaluates to false.
 * @example !R
 */
class NegationConnective implements UnaryConnective {
    static NAME = 'NOT'

    name = NegationConnective.NAME

    operand: SemanticFilterRule

    ruleName?: string
}

namespace NegationConnective {
    export function toString(conn: NegationConnective): string {
        return `!${convert(conn.operand)}`
    }
}

/**
 * An And Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 and R2 evaluate to true.
 * @example R1 && R2
 */
class AndConnective implements BinaryConnective {
    static NAME = 'AND'

    name = AndConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace AndConnective {
    export function toString(conn: AndConnective): string {
        return `${convert(conn.leftOperand)}&&${convert(conn.rightOperand)}`
    }
}

/**
 * An Or Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 or R2 evaluate to true.
 * @example R1 || R2
 */
class OrConnective implements BinaryConnective {
    static NAME = 'OR'

    name = OrConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace OrConnective {
    export function toString(conn: OrConnective): string {
        return `${convert(conn.leftOperand)}||${convert(conn.rightOperand)}`
    }
}

/**
 * An IfThen Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 evaluates to false or R2 evaluates to true.
 * @example R1 ? R2 : true
 * @example !R1 || R2
 */
class IfThenConnective implements BinaryConnective {
    static NAME = 'IFTHEN'

    name = IfThenConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace IfThenConnective {
    export function toString(conn: IfThenConnective): string {
        return `!${convert(conn.leftOperand)}||${convert(conn.rightOperand)}`
    }
}

/**
 * A LogicEqual Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 and R2 evaluate to true or R1 and R2 evaluate to false.
 * @example R1 === R2
 * @example R1 && R2 || !R1 && !R2
 */
class LogicEqualConnective implements BinaryConnective {
    static NAME = 'LOGICEQUAL'

    name = LogicEqualConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace LogicEqualConnective {
    export function toString(conn: LogicEqualConnective): string {
        return `${convert(conn.leftOperand)}=${convert(conn.rightOperand)}`
    }
}

/**
 * An IfThenElse Connective takes three rules R1, R2 and R3 and evaluates to true
 * iff
 * R1 and R2 evaluate to true or R1 evaluates to false and R3 evaluates to true.
 * @example R1 ? R2 : R3
 * @example R1 && R2 || !R1 && R3
 */
class IfThenElseConnective implements TernaryConnective {
    static NAME = 'IFTHENELSE'

    name = IfThenElseConnective.NAME

    firstOperand: SemanticFilterRule

    secondOperand: SemanticFilterRule

    thirdOperand: SemanticFilterRule

    ruleName?: string
}

namespace IfThenElseConnective {
    export function toString(conn: IfThenElseConnective): string {
        return (
            `${convert(conn.firstOperand)}&&${convert(conn.secondOperand)}||` +
            `!${convert(conn.firstOperand)}&&${convert(conn.thirdOperand)}`
        )
    }
}

/// / Numeric Connectives ////

/**
 * A LessThan Connective takes two numeric rules R1 and R2 and evaluates to true
 * iff
 * R1 < R2
 */
class LessThanConnective implements BinaryConnective {
    static NAME = 'LESSTHAN'

    name = LessThanConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace LessThanConnective {
    export function toString(conn: LessThanConnective): string {
        return `${convertNumeric(conn.leftOperand)}<${convertNumeric(conn.rightOperand)}`
    }
}

/**
 * A GreaterThan Connective takes two numeric rules R1 and R2 and evaluates to true
 * iff
 * R1 > R2
 */
class GreaterThanConnective implements BinaryConnective {
    static NAME = 'GREATERTHAN'

    name = GreaterThanConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace GreaterThanConnective {
    export function toString(conn: GreaterThanConnective): string {
        return `${convertNumeric(conn.leftOperand)}>${convertNumeric(conn.rightOperand)}`
    }
}

/**
 * A NumericEqual Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 === R2
 */
class NumericEqualConnective implements BinaryConnective {
    static NAME = 'NUMERICEQUAL'

    name = NumericEqualConnective.NAME

    leftOperand: SemanticFilterTag

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace NumericEqualConnective {
    export function toString(conn: NumericEqualConnective): string {
        return `${convertNumeric(conn.leftOperand)}=${convertNumeric(conn.rightOperand)}`
    }
}

/**
 * A GreaterEquals Connective takes two numeric rules R1 and R2 and evaluates to true
 * iff
 */
class GreaterEqualsConnective implements BinaryConnective {
    static NAME = 'GREATEREQUALS'

    name = GreaterEqualsConnective.NAME

    leftOperand: SemanticFilterTag

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace GreaterEqualsConnective {
    export function toString(conn: GreaterEqualsConnective): string {
        return `${convertNumeric(conn.leftOperand)}>=${convertNumeric(conn.rightOperand)}`
    }
}

/**
 * A LessEquals Connective takes two numeric rules R1 and R2 and evaluates to true
 * iff
 * R1 <= R2
 */
class LessEqualsConnective implements BinaryConnective {
    static NAME = 'LESSEQUALS'

    name = GreaterEqualsConnective.NAME

    leftOperand: SemanticFilterTag

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace LessEqualsConnective {
    export function toString(conn: LessEqualsConnective): string {
        return `${convertNumeric(conn.leftOperand)}<=${convertNumeric(conn.rightOperand)}`
    }
}

/**
 * A NumericNotEqual Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 != R2
 */
class NumericNotEqualConnective implements BinaryConnective {
    static NAME = 'NUMERICNOTEQUAL'

    name = GreaterEqualsConnective.NAME

    leftOperand: SemanticFilterTag

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace NumericNotEqualConnective {
    export function toString(conn: NumericNotEqualConnective): string {
        return `${convertNumeric(conn.leftOperand)}!=${convertNumeric(conn.rightOperand)}`
    }
}

/**
 * A Numeric Addition Connective takes two numeric operands and evaluates
 * to their sum.
 */
class NumericAdditionConnective implements BinaryConnective {
    static NAME = 'NUMERICADDITION'

    name = NumericAdditionConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace NumericAdditionConnective {
    export function toString(conn: NumericAdditionConnective): string {
        return `${convertNumeric(conn.leftOperand)}+${convertNumeric(conn.rightOperand)}`
    }
}

/**
 * A Numeric Subtraction Connective takes two numeric operands and evaluates
 * to their difference.
 */
class NumericSubtractionConnective implements BinaryConnective {
    static NAME = 'NUMERICSUBTRACTION'

    name = NumericSubtractionConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace NumericSubtractionConnective {
    export function toString(conn: NumericSubtractionConnective): string {
        return `${convertNumeric(conn.leftOperand)}-${convertNumeric(conn.rightOperand)}`
    }
}

/**
 * A Numeric Multiplication Connective takes two numeric operands and evaluates
 * to their product.
 */
class NumericMultiplicationConnective implements BinaryConnective {
    static NAME = 'NUMERICMULTIPLICATION'

    name = NumericMultiplicationConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace NumericMultiplicationConnective {
    export function toString(conn: NumericMultiplicationConnective): string {
        return `${convertNumeric(conn.leftOperand)}*${convertNumeric(conn.rightOperand)}`
    }
}

/**
 * A Numeric Division Connective takes two numeric operands and evaluates
 * to their quotient.
 */
class NumericDivisionConnective implements BinaryConnective {
    static NAME = 'NUMERICDIVISION'

    name = NumericDivisionConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

namespace NumericDivisionConnective {
    export function toString(conn: NumericDivisionConnective): string {
        return `${convertNumeric(conn.leftOperand)}/${convertNumeric(conn.rightOperand)}`
    }
}

/**
 * A Numeric Constant Connective returns a constant value.
 */
class NumericConstantConnective implements Connective {
    static NAME = 'CONST'

    name = NumericConstantConnective.NAME

    num: number

    ruleName?: string
}

namespace NumericConstantConnective {
    export function toString(conn: NumericConstantConnective): string {
        return conn.num.toString()
    }
}

/// / Functions ////

/** Type assertion function to assert that a semantic filter rule is a connective. */
function assertIsConnective(rule: Connective | SemanticFilterRule): asserts rule is Connective {
    if ((rule as Connective).name === undefined) {
        throw new Error('Rule is not a Connective.')
    }
}

/** Converts a rule that returns a numeric result into text. */
function convertNumeric(rule: SemanticFilterRule): string {
    // Rule is a Tag
    if (isTag(rule)) {
        return `$${rule.tag}`
    }
    assertIsConnective(rule)
    switch (rule.name) {
        case NumericConstantConnective.NAME:
            return NumericConstantConnective.toString(rule as NumericConstantConnective)
        case NumericAdditionConnective.NAME:
            return `(${NumericAdditionConnective.toString(rule as NumericAdditionConnective)})`
        case NumericSubtractionConnective.NAME:
            return `(${NumericSubtractionConnective.toString(rule as NumericSubtractionConnective)})`
        case NumericMultiplicationConnective.NAME:
            return `(${NumericMultiplicationConnective.toString(rule as NumericMultiplicationConnective)})`
        case NumericDivisionConnective.NAME:
            return `(${NumericDivisionConnective.toString(rule as NumericDivisionConnective)})`
        default:
            return '0'
    }
}

/**
 * Converts a legacy semantic filter rule sent from the server to a string that can be understood and reparsed by
 * the antlr parser.
 * @param rule a semantic filter rule object
 * @returns a rulestring that can be parsed
 */
export function convert(rule: SemanticFilterRule): string {
    // Rule is a Tag
    if (isTag(rule)) {
        return `#${rule.tag}`
    }

    // Rule is a Connective
    assertIsConnective(rule)
    switch (rule.name) {
        // Logic Connectives
        case TrueConnective.NAME:
            return TrueConnective.toString(rule as TrueConnective)
        case FalseConnective.NAME:
            return FalseConnective.toString(rule as FalseConnective)
        case IdentityConnective.NAME:
            return `(${IdentityConnective.toString(rule as IdentityConnective)})`
        case NegationConnective.NAME:
            return `(${NegationConnective.toString(rule as NegationConnective)})`
        case AndConnective.NAME:
            return `(${AndConnective.toString(rule as AndConnective)})`
        case OrConnective.NAME:
            return `(${OrConnective.toString(rule as OrConnective)})`
        case IfThenConnective.NAME:
            return `(${IfThenConnective.toString(rule as IfThenConnective)})`
        case LogicEqualConnective.NAME:
            return `(${LogicEqualConnective.toString(rule as LogicEqualConnective)})`
        case IfThenElseConnective.NAME:
            return `(${IfThenElseConnective.toString(rule as IfThenElseConnective)})`
        // Numeric Connectives
        case LessThanConnective.NAME:
            return `(${LessThanConnective.toString(rule as LessThanConnective)})`
        case GreaterThanConnective.NAME:
            return `(${GreaterThanConnective.toString(rule as GreaterThanConnective)})`
        case NumericEqualConnective.NAME:
            return `(${NumericEqualConnective.toString(rule as NumericEqualConnective)})`
        case GreaterEqualsConnective.NAME:
            return `(${GreaterEqualsConnective.toString(rule as GreaterEqualsConnective)})`
        case LessEqualsConnective.NAME:
            return `(${LessEqualsConnective.toString(rule as LessEqualsConnective)})`
        case NumericNotEqualConnective.NAME:
            return `(${NumericNotEqualConnective.toString(rule as NumericNotEqualConnective)})`
        default:
            return 'true'
    }
}
