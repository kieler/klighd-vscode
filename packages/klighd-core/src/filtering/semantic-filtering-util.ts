/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2025 by
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
import {
    evaluateReservedNumericTag,
    evaluateReservedStructuralTag,
    isReservedNumericTag,
    isReservedStructuralTag,
} from './reserved-structural-tags'

/// / Base constructs ////

/**
 * Base interface for numeric intermediate results.
 */
export interface NumericResult {
    num: number
}

/**
 * Base interface for semantic filter rules.
 */
export interface SemanticFilterRule {
    /** The rule name is used to identify rules and distinguish them from one another. */
    ruleName?: string
    /** The default value is used to indicate whether the semantic filter should be on or off by default. */
    defaultValue?: boolean
}

/**
 * A semantic filter tag is used as a filter rule that evaluates to true iff the tag is present
 * on a graph element.
 */
export class SemanticFilterTag implements SemanticFilterRule, NumericResult {
    ruleName?: string

    tag: string

    /** If num is not defined, the server will set the value 0 by default. */
    num: number
}

/**
 * Base interface for connectives. Connectives take one or more filter rules as operands and
 * construct a new rule.
 */
export interface Connective extends SemanticFilterRule {
    name: string
}

/// / Connectives ////

/**
 * Base interface for unary connectives. Unary Connectives take exactly one operand.
 */
export interface UnaryConnective extends Connective {
    operand: SemanticFilterRule
}

/**
 * Base interface for binary connectives. Binary Connectives take exactly two operands.
 */
export interface BinaryConnective extends Connective {
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
}

/**
 * Base interface for ternary connectives. Ternary Connectives take exactly three operands.
 */
export interface TernaryConnective extends Connective {
    firstOperand: SemanticFilterRule
    secondOperand: SemanticFilterRule
    thirdOperand: SemanticFilterRule
}

/// / Logic Connectives ////

/**
 * A True Connective always evaluates to true.
 */
export class TrueConnective implements Connective {
    static NAME = 'TRUE'

    name = TrueConnective.NAME

    ruleName?: string
}

export namespace TrueConnective {
    export function evaluate(_conn: TrueConnective, _element: SKGraphElement): boolean {
        return true
    }
}

/**
 * A False Connective always evaluates to false.
 */
export class FalseConnective implements Connective {
    static NAME = 'FALSE'

    name = FalseConnective.NAME

    ruleName?: string
}

export namespace FalseConnective {
    export function evaluate(_conn: FalseConnective, _element: SKGraphElement): boolean {
        return false
    }
}

/**
 * An Identity Connective evaluates to its operand i.e. ID (R) is equivalent to R.
 */
export class IdentityConnective implements UnaryConnective {
    static NAME = 'ID'

    name = IdentityConnective.NAME

    operand: SemanticFilterRule

    ruleName?: string
}

export namespace IdentityConnective {
    export function evaluate(conn: IdentityConnective, element: SKGraphElement): boolean {
        return evaluateRule(conn.operand, element)
    }
}

/**
 * A Not Connective takes a rule R and evaluates to true
 * iff
 * R evaluates to false.
 * @example !R
 */
export class NegationConnective implements UnaryConnective {
    static NAME = 'NOT'

    name = NegationConnective.NAME

    operand: SemanticFilterRule

    ruleName?: string
}

export namespace NegationConnective {
    export function evaluate(conn: NegationConnective, element: SKGraphElement): boolean {
        return !evaluateRule(conn.operand, element)
    }
}

/**
 * An And Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 and R2 evaluate to true.
 * @example R1 && R2
 */
export class AndConnective implements BinaryConnective {
    static NAME = 'AND'

    name = AndConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace AndConnective {
    export function evaluate(conn: AndConnective, element: SKGraphElement): boolean {
        return evaluateRule(conn.leftOperand, element) && evaluateRule(conn.rightOperand, element)
    }
}

/**
 * An Or Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 or R2 evaluate to true.
 * @example R1 || R2
 */
export class OrConnective implements BinaryConnective {
    static NAME = 'OR'

    name = OrConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace OrConnective {
    export function evaluate(conn: OrConnective, element: SKGraphElement): boolean {
        return evaluateRule(conn.leftOperand, element) || evaluateRule(conn.rightOperand, element)
    }
}

/**
 * An IfThen Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 evaluates to false or R2 evaluates to true.
 * @example R1 ? R2 : true
 * @example !R1 || R2
 */
export class IfThenConnective implements BinaryConnective {
    static NAME = 'IFTHEN'

    name = IfThenConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace IfThenConnective {
    export function evaluate(conn: IfThenConnective, element: SKGraphElement): boolean {
        return !evaluateRule(conn.leftOperand, element) || evaluateRule(conn.rightOperand, element)
    }
}

/**
 * A LogicEqual Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 and R2 evaluate to true or R1 and R2 evaluate to false.
 * @example R1 === R2
 * @example R1 && R2 || !R1 && !R2
 */
export class LogicEqualConnective implements BinaryConnective {
    static NAME = 'LOGICEQUAL'

    name = LogicEqualConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace LogicEqualConnective {
    export function evaluate(conn: LogicEqualConnective, element: SKGraphElement): boolean {
        return evaluateRule(conn.leftOperand, element) === evaluateRule(conn.rightOperand, element)
    }
}

/**
 * An IfThenElse Connective takes three rules R1, R2 and R3 and evaluates to true
 * iff
 * R1 and R2 evaluate to true or R1 evaluates to false and R3 evaluates to true.
 * @example R1 ? R2 : R3
 * @example R1 && R2 || !R1 && R3
 */
export class IfThenElseConnective implements TernaryConnective {
    static NAME = 'IFTHENELSE'

    name = IfThenElseConnective.NAME

    firstOperand: SemanticFilterRule

    secondOperand: SemanticFilterRule

    thirdOperand: SemanticFilterRule

    ruleName?: string
}

export namespace IfThenElseConnective {
    export function evaluate(conn: IfThenElseConnective, element: SKGraphElement): boolean {
        return evaluateRule(conn.firstOperand, element)
            ? evaluateRule(conn.secondOperand, element)
            : evaluateRule(conn.thirdOperand, element)
    }
}

/// / Numeric Connectives ////

/**
 * A LessThan Connective takes two numeric rules R1 and R2 and evaluates to true
 * iff
 * R1 < R2
 */
export class LessThanConnective implements BinaryConnective {
    static NAME = 'LESSTHAN'

    name = LessThanConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace LessThanConnective {
    export function evaluate(conn: LessThanConnective, element: SKGraphElement): boolean {
        return evaluateNumeric(conn.leftOperand, element) < evaluateNumeric(conn.rightOperand, element)
    }
}

/**
 * A GreaterThan Connective takes two numeric rules R1 and R2 and evaluates to true
 * iff
 * R1 > R2
 */
export class GreaterThanConnective implements BinaryConnective {
    static NAME = 'GREATERTHAN'

    name = GreaterThanConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace GreaterThanConnective {
    export function evaluate(conn: GreaterThanConnective, element: SKGraphElement): boolean {
        return evaluateNumeric(conn.leftOperand, element) > evaluateNumeric(conn.rightOperand, element)
    }
}

/**
 * A NumericEqual Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 === R2
 */
export class NumericEqualConnective implements BinaryConnective {
    static NAME = 'NUMERICEQUAL'

    name = NumericEqualConnective.NAME

    leftOperand: SemanticFilterTag

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace NumericEqualConnective {
    export function evaluate(conn: NumericEqualConnective, element: SKGraphElement): boolean {
        return evaluateNumeric(conn.leftOperand, element) === evaluateNumeric(conn.rightOperand, element)
    }
}

/**
 * A GreaterEquals Connective takes two numeric rules R1 and R2 and evaluates to true
 * iff
 */
export class GreaterEqualsConnective implements BinaryConnective {
    static NAME = 'GREATEREQUALS'

    name = GreaterEqualsConnective.NAME

    leftOperand: SemanticFilterTag

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace GreaterEqualsConnective {
    export function evaluate(conn: GreaterEqualsConnective, element: SKGraphElement): boolean {
        return evaluateNumeric(conn.leftOperand, element) >= evaluateNumeric(conn.rightOperand, element)
    }
}

/**
 * A LessEquals Connective takes two numeric rules R1 and R2 and evaluates to true
 * iff
 * R1 <= R2
 */
export class LessEqualsConnective implements BinaryConnective {
    static NAME = 'LESSEQUALS'

    name = GreaterEqualsConnective.NAME

    leftOperand: SemanticFilterTag

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace LessEqualsConnective {
    export function evaluate(conn: LessEqualsConnective, element: SKGraphElement): boolean {
        return evaluateNumeric(conn.leftOperand, element) <= evaluateNumeric(conn.rightOperand, element)
    }
}

/**
 * A NumericNotEqual Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 != R2
 */
export class NumericNotEqualConnective implements BinaryConnective {
    static NAME = 'NUMERICNOTEQUAL'

    name = GreaterEqualsConnective.NAME

    leftOperand: SemanticFilterTag

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace NumericNotEqualConnective {
    export function evaluate(conn: NumericNotEqualConnective, element: SKGraphElement): boolean {
        return evaluateNumeric(conn.leftOperand, element) !== evaluateNumeric(conn.rightOperand, element)
    }
}

/**
 * A Numeric Addition Connective takes two numeric operands and evaluates
 * to their sum.
 */
export class NumericAdditionConnective implements BinaryConnective {
    static NAME = 'NUMERICADDITION'

    name = NumericAdditionConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace NumericAdditionConnective {
    export function evaluate(conn: NumericAdditionConnective, element: SKGraphElement): number {
        return evaluateNumeric(conn.leftOperand, element) + evaluateNumeric(conn.rightOperand, element)
    }
}

/**
 * A Numeric Subtraction Connective takes two numeric operands and evaluates
 * to their difference.
 */
export class NumericSubtractionConnective implements BinaryConnective {
    static NAME = 'NUMERICSUBBTRACTION'

    name = NumericSubtractionConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace NumericSubtractionConnective {
    export function evaluate(conn: NumericSubtractionConnective, element: SKGraphElement): number {
        return evaluateNumeric(conn.leftOperand, element) - evaluateNumeric(conn.rightOperand, element)
    }
}

/**
 * A Numeric Multiplication Connective takes two numeric operands and evaluates
 * to their product.
 */
export class NumericMultiplicationConnective implements BinaryConnective {
    static NAME = 'NUMERICMULTIPLICATION'

    name = NumericMultiplicationConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace NumericMultiplicationConnective {
    export function evaluate(conn: NumericMultiplicationConnective, element: SKGraphElement): number {
        return evaluateNumeric(conn.leftOperand, element) * evaluateNumeric(conn.rightOperand, element)
    }
}

/**
 * A Numeric Division Connective takes two numeric operands and evaluates
 * to their quotient.
 */
export class NumericDivisionConnective implements BinaryConnective {
    static NAME = 'NUMERICDIVISION'

    name = NumericDivisionConnective.NAME

    leftOperand: SemanticFilterRule

    rightOperand: SemanticFilterRule

    ruleName?: string
}

export namespace NumericDivisionConnective {
    export function evaluate(conn: NumericDivisionConnective, element: SKGraphElement): number {
        return evaluateNumeric(conn.leftOperand, element) / evaluateNumeric(conn.rightOperand, element)
    }
}

/**
 * A Numeric Constant Connective returns a constant value.
 */
export class NumericConstantConnective implements Connective {
    static NAME = 'CONST'

    name = NumericConstantConnective.NAME

    num: number

    ruleName?: string
}

export namespace NumericConstantConnective {
    export function evaluate(conn: NumericConstantConnective): number {
        return conn.num
    }
}

/// / Functions ////

/**
 * A filter is used to apply a filter rule as a boolean function on a graph element. The function
 * returns true if the element fulfils the filter rule and false otherwise.
 */
export interface Filter {
    name?: string
    defaultValue?: boolean
    filterFun(el: SKGraphElement): boolean
}

/**
 * Creates a new filter with a function that can be applied to graph elements when given
 * a filter rule.
 * @param rule the rule to construct the filter from
 * @returns a new filter
 */
export function createFilter(rule: SemanticFilterRule): Filter {
    let ruleName
    if (isTag(rule)) {
        ruleName = rule.tag
    } else {
        ruleName = rule.ruleName
    }
    return {
        name: ruleName,
        defaultValue: rule.defaultValue,
        filterFun: (el) => evaluateRule(rule, el),
    }
}

/** Type narrowing function to check whether a semantic filter rule is a tag. */
function isTag(rule: SemanticFilterTag | SemanticFilterRule): rule is SemanticFilterTag {
    return (rule as SemanticFilterTag).tag !== undefined
}

/** Type assertion function to assert that a semantic filter rule is a connective. */
function assertIsConnective(rule: Connective | SemanticFilterRule): asserts rule is Connective {
    if ((rule as Connective).name === undefined) {
        throw new Error('Rule is not a Connective.')
    }
}

/** Extracts the semantic filter tags defined for an element. */
function getSemanticFilterTags(element: SKGraphElement) {
    let tags: SemanticFilterTag[] = []
    if (element.properties['de.cau.cs.kieler.klighd.semanticFilter.tags'] !== undefined) {
        tags = element.properties['de.cau.cs.kieler.klighd.semanticFilter.tags'] as SemanticFilterTag[]
    }
    return tags
}

/** Evaluates a rule that returns a numeric result. */
function evaluateNumeric(rule: SemanticFilterRule, element: SKGraphElement): number {
    const tags: SemanticFilterTag[] = getSemanticFilterTags(element)
    // Rule is a Tag
    if (isTag(rule)) {
        const nodeTag = tags.find((tag: SemanticFilterTag) => tag.tag === rule.tag)
        if (nodeTag !== undefined) {
            return nodeTag.num
        }
        if (isReservedNumericTag(rule.tag)) {
            return evaluateReservedNumericTag(rule.tag, element)
        }
        return 0
    }
    assertIsConnective(rule)
    switch (rule.name) {
        case NumericConstantConnective.NAME:
            return NumericConstantConnective.evaluate(rule as NumericConstantConnective)
        case NumericAdditionConnective.NAME:
            return NumericAdditionConnective.evaluate(rule as NumericAdditionConnective, element)
        case NumericSubtractionConnective.NAME:
            return NumericSubtractionConnective.evaluate(rule as NumericSubtractionConnective, element)
        case NumericMultiplicationConnective.NAME:
            return NumericMultiplicationConnective.evaluate(rule as NumericMultiplicationConnective, element)
        case NumericDivisionConnective.NAME:
            return NumericDivisionConnective.evaluate(rule as NumericDivisionConnective, element)
        default:
            return 0
    }
}

/** Evaluates `rule` using `tags`. See Connectives for further explanation on evaluation. */
function evaluateRule(rule: SemanticFilterRule, element: SKGraphElement): boolean {
    const tags: SemanticFilterTag[] = getSemanticFilterTags(element)
    // Rule is a Tag
    if (isTag(rule)) {
        let result = tags.some((tag: SemanticFilterTag) => tag.tag === rule.tag)
        if (!result && isReservedStructuralTag(rule.tag)) {
            result = evaluateReservedStructuralTag(rule.tag, element)
        }
        return result
    }

    // Rule is a Connective
    assertIsConnective(rule)
    switch (rule.name) {
        // Logic Connectives
        case TrueConnective.NAME:
            return TrueConnective.evaluate(rule as TrueConnective, element)
        case FalseConnective.NAME:
            return FalseConnective.evaluate(rule as FalseConnective, element)
        case IdentityConnective.NAME:
            return IdentityConnective.evaluate(rule as IdentityConnective, element)
        case NegationConnective.NAME:
            return NegationConnective.evaluate(rule as NegationConnective, element)
        case AndConnective.NAME:
            return AndConnective.evaluate(rule as AndConnective, element)
        case OrConnective.NAME:
            return OrConnective.evaluate(rule as OrConnective, element)
        case IfThenConnective.NAME:
            return IfThenConnective.evaluate(rule as IfThenConnective, element)
        case LogicEqualConnective.NAME:
            return LogicEqualConnective.evaluate(rule as LogicEqualConnective, element)
        case IfThenElseConnective.NAME:
            return IfThenElseConnective.evaluate(rule as IfThenElseConnective, element)
        // Numeric Connectives
        /*
        For now, these are defined by an unset corresponding tag being treated as if its num was 0. TODO:
        There is potential to redefine this so that an unset tag corresponding tag would automatically
        be evaluated to false. However, this may result in three-valued logic which can be very dangerous
        as some two-values logic laws may not hold.
        Should this redefined, make sure to check all cases, e.g. !(x < y) === x >= y, de morgan, etc.
        */
        case LessThanConnective.NAME:
            return LessThanConnective.evaluate(rule as LessThanConnective, element)
        case GreaterThanConnective.NAME:
            return GreaterThanConnective.evaluate(rule as GreaterThanConnective, element)
        case NumericEqualConnective.NAME:
            return NumericEqualConnective.evaluate(rule as NumericEqualConnective, element)
        case GreaterEqualsConnective.NAME:
            return GreaterEqualsConnective.evaluate(rule as GreaterEqualsConnective, element)
        case LessEqualsConnective.NAME:
            return LessEqualsConnective.evaluate(rule as LessEqualsConnective, element)
        case NumericNotEqualConnective.NAME:
            return NumericNotEqualConnective.evaluate(rule as NumericNotEqualConnective, element)
        default:
            return true
    }
}

/**
 * Gets all filters defined as filter rules on a given graph element.
 * @param graph the graph element to check
 * @returns array of filters
 */
export function getFilters(graph: SKGraphElement): Array<Filter> {
    const filters: Array<Filter> = []
    if (graph.properties['de.cau.cs.kieler.klighd.semanticFilter.rules'] !== undefined) {
        ;(graph.properties['de.cau.cs.kieler.klighd.semanticFilter.rules'] as Array<SemanticFilterRule>).forEach(
            (rule) => {
                filters.push(createFilter(rule))
            }
        )
    }
    return filters
}
