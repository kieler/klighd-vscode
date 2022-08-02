/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

import { SKGraphElement } from "../skgraph-models"

//// Base constructs ////

/**
 * 
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

//// Connectives ////

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

//// Logic Connectives ////

/**
 * A True Connective always evaluates to true.
 */
export class TrueConnective implements Connective {
    static NAME = "TRUE"
    name = TrueConnective.NAME
    ruleName?: string
}

export namespace TrueConnective {
    export function evaluate(conn: TrueConnective, tags: Array<SemanticFilterTag>): boolean {
        return true;
    }
}

/**
 * A False Connective always evaluates to false.
 */
export class FalseConnective implements Connective {
    static NAME = "FALSE"
    name = TrueConnective.NAME
    ruleName?: string
}

export namespace FalseConnective {
    export function evaluate(conn: FalseConnective, tags: Array<SemanticFilterTag>): boolean {
        return false;
    }
}

/**
 * An Identity Connective evaluates to its operand i.e. ID (R) is equivalent to R.
 */
export class IdentityConnective implements UnaryConnective {
    static NAME = "ID"
    name = IdentityConnective.NAME
    operand: SemanticFilterRule
    ruleName?: string
}

export namespace IdentityConnective {
    export function evaluate(conn: IdentityConnective, tags: Array<SemanticFilterTag>): boolean {
        return evaluateRule(conn.operand, tags);
    }
}

/**
 * A Not Connective takes a rule R and evaluates to true
 * iff
 * R evaluates to false.
 * @example !R
 */
export class NegationConnective implements UnaryConnective {
    static NAME = "NOT"
    name = NegationConnective.NAME
    operand: SemanticFilterRule
    ruleName?: string
}

export namespace NegationConnective {
    export function evaluate(conn: NegationConnective, tags: Array<SemanticFilterTag>): boolean {
        return !evaluateRule(conn.operand, tags);
    }
}

/**
 * An And Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 and R2 evaluate to true.
 * @example R1 && R2
 */
export class AndConnective implements BinaryConnective {
    static NAME = "AND"
    name = AndConnective.NAME
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
    ruleName?: string
}

export namespace AndConnective {
    export function evaluate(conn: AndConnective, tags: Array<SemanticFilterTag>): boolean {
        return evaluateRule(conn.leftOperand, tags) && evaluateRule(conn.rightOperand, tags);
    }
}

/**
 * An Or Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 or R2 evaluate to true.
 * @example R1 || R2
 */
export class OrConnective implements BinaryConnective {
    static NAME = "OR"
    name = OrConnective.NAME
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
    ruleName?: string
}

export namespace OrConnective {
    export function evaluate(conn: OrConnective, tags: Array<SemanticFilterTag>): boolean {
        return evaluateRule(conn.leftOperand, tags) || evaluateRule(conn.rightOperand, tags);
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
    static NAME = "IFTHEN"
    name = IfThenConnective.NAME
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
    ruleName?: string
}

export namespace IfThenConnective {
    export function evaluate(conn: IfThenConnective, tags: Array<SemanticFilterTag>): boolean {
        return !evaluateRule(conn.leftOperand, tags) || evaluateRule(conn.rightOperand, tags);
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
    static NAME = "LOGICEQUAL"
    name = LogicEqualConnective.NAME
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
    ruleName?: string
}

export namespace LogicEqualConnective {
    export function evaluate(conn: LogicEqualConnective, tags: Array<SemanticFilterTag>): boolean {
        return evaluateRule(conn.leftOperand, tags) === evaluateRule(conn.rightOperand, tags);
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
    static NAME = "IFTHENELSE"
    name = IfThenElseConnective.NAME
    firstOperand: SemanticFilterRule
    secondOperand: SemanticFilterRule
    thirdOperand: SemanticFilterRule
    ruleName?: string
}

export namespace IfThenElseConnective {
    export function evaluate(conn: IfThenElseConnective, tags: Array<SemanticFilterTag>): boolean {
        return evaluateRule(conn.firstOperand, tags)
                ? evaluateRule(conn.secondOperand, tags)
                : evaluateRule(conn.thirdOperand, tags);
    }
}

//// Numeric Connectives ////

/**
 * A LessThan Connective takes one rule R and evaluates to true
 * iff
 * R.num < correspondingTag.num.
 * @example R.num < correspondingTag.num
 */
export class LessThanConnective implements UnaryConnective {
    static NAME = "LESSTHAN"
    name = LessThanConnective.NAME
    operand: SemanticFilterTag
    ruleName?: string
}

export namespace LessThanConnective {
    export function evaluate(conn: LessThanConnective, tags: Array<SemanticFilterTag>): boolean {
        const correspondingTag = tags.find(tag => tag.tag === conn.operand.tag);
        return (conn.operand.num ?? 0) < (correspondingTag?.num ?? 0);
    }
}

/**
 * A GreaterThan Connective takes one rule R and evaluates to true
 * iff
 * R.num > correspondingTag.num.
 * @example R.num > correspondingTag.num
 */
export class GreaterThanConnective implements UnaryConnective {
    static NAME = "GREATERTHAN"
    name = GreaterThanConnective.NAME
    operand: SemanticFilterTag
    ruleName?: string
}

export namespace GreaterThanConnective {
    export function evaluate(conn: GreaterThanConnective, tags: Array<SemanticFilterTag>): boolean {
        const correspondingTag = tags.find(tag => tag.tag === conn.operand.tag);
        return (conn.operand.num ?? 0) > (correspondingTag?.num ?? 0);
    }
}

/**
 * A NumericEqual Connective takes one rule R and evaluates to true
 * iff
 * R.num === correspondingTag.num.
 * @example R.num === correspondingTag.num
 */
export class NumericEqualConnective implements UnaryConnective {
    static NAME = "NUMERICEQUAL"
    name = NumericEqualConnective.NAME
    operand: SemanticFilterTag
    ruleName?: string
}

export namespace NumericEqualConnective {
    export function evaluate(conn: NumericEqualConnective, tags: Array<SemanticFilterTag>): boolean {
        const correspondingTag = tags.find(tag => tag.tag === conn.operand.tag);
        return (conn.operand.num ?? 0) === (correspondingTag?.num ?? 0);
    }
}

/**
 * A GreaterEquals Connective takes one rule R and evaluates to true
 * iff
 * @example R.num >= correspondingTag.num.
 */
export class GreaterEqualsConnective implements UnaryConnective {
    static NAME = "GREATEREQUALS"
    name = GreaterEqualsConnective.NAME
    operand: SemanticFilterTag
    ruleName?: string
}

export namespace GreaterEqualsConnective {
    export function evaluate(conn: GreaterEqualsConnective, tags: Array<SemanticFilterTag>): boolean {
        const correspondingTag = tags.find(tag => tag.tag === conn.operand.tag);
        return (conn.operand.num ?? 0) >= (correspondingTag?.num ?? 0);
    }
}

/**
 * A LessEquals Connective takes one rule R and evaluates to true
 * iff
 * @example R.num <= correspondingTag.num.
 */
 export class LessEqualsConnective implements UnaryConnective {
    static NAME = "LESSEQUALS"
    name = GreaterEqualsConnective.NAME
    operand: SemanticFilterTag
    ruleName?: string
}

export namespace LessEqualsConnective {
    export function evaluate(conn: LessEqualsConnective, tags: Array<SemanticFilterTag>): boolean {
        const correspondingTag = tags.find(tag => tag.tag === conn.operand.tag);
        return (conn.operand.num ?? 0) <= (correspondingTag?.num ?? 0);
    }
}

/**
 * A NumericNotEqual Connective takes one rule R and evaluates to true
 * iff
 * @example R.num != correspondingTag.num.
 */
 export class NumericNotEqualConnective implements UnaryConnective {
    static NAME = "NUMERICNOTEQUAL"
    name = GreaterEqualsConnective.NAME
    operand: SemanticFilterTag
    ruleName?: string
}

export namespace NumericNotEqualConnective {
    export function evaluate(conn: NumericNotEqualConnective, tags: Array<SemanticFilterTag>): boolean {
        const correspondingTag = tags.find(tag => tag.tag === conn.operand.tag);
        return (conn.operand.num ?? 0) !== (correspondingTag?.num ?? 0);
    }
}

/**
 * A Numeric Addition Connective takes two numeric operands and evaluates
 * to their sum.
 */
export class NumericAdditionConnective implements BinaryConnective {
    static NAME = "NUMERICAddition"
    name = NumericAdditionConnective.NAME
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
}

export namespace NumericAdditionConnective {
    export function evaluate(conn: NumericAdditionConnective): number {
        return evaluateNumeric(conn.leftOperand) + evaluateNumeric(conn.rightOperand);
    }
}

/**
 * A Numeric Subtraction Connective takes two numeric operands and evaluates
 * to their difference.
 */
export class NumericSubtractionConnective implements BinaryConnective {
    static NAME = "NUMERICSubtraction"
    name = NumericSubtractionConnective.NAME
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
}

export namespace NumericSubtractionConnective {
    export function evaluate(conn: NumericSubtractionConnective): number {
        return evaluateNumeric(conn.leftOperand) - evaluateNumeric(conn.rightOperand);
    }
}

/**
 * A Numeric Multiplication Connective takes two numeric operands and evaluates
 * to their product.
 */
 export class NumericMultiplicationConnective implements BinaryConnective {
    static NAME = "NUMERICMultiplication"
    name = NumericMultiplicationConnective.NAME
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
}

export namespace NumericMultiplicationConnective {
    export function evaluate(conn: NumericMultiplicationConnective): number {
        return evaluateNumeric(conn.leftOperand) * evaluateNumeric(conn.rightOperand);
    }
}

/**
 * A Numeric Division Connective takes two numeric operands and evaluates
 * to their product.
 */
 export class NumericDivisionConnective implements BinaryConnective {
    static NAME = "NUMERICDivision"
    name = NumericDivisionConnective.NAME
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
}

export namespace NumericDivisionConnective {
    export function evaluate(conn: NumericDivisionConnective): number {
        return evaluateNumeric(conn.leftOperand) / evaluateNumeric(conn.rightOperand);
    }
}

//// Functions ////

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

    let ruleName;
    if (rule instanceof SemanticFilterTag) {
        ruleName = rule.tag;
    } else {
        ruleName = rule.ruleName;
    }
    return {
        name: ruleName,
        defaultValue: rule.defaultValue,
        filterFun: (el) => {
            let tags = Array<SemanticFilterTag>();
            if (el.properties['de.cau.cs.kieler.klighd.semanticFilter.tags'] !== undefined) {
                tags = el.properties['de.cau.cs.kieler.klighd.semanticFilter.tags'] as Array<SemanticFilterTag>;
            }

            return evaluateRule(rule, tags);
        }
    }

}

function evaluateNumeric(rule: SemanticFilterRule): number {
    // Rule is a Tag
    if ((rule as SemanticFilterTag).tag !== undefined) {
        return (rule as SemanticFilterTag).num;
    } else {
        switch  ((rule as Connective).name) {
            case NumericAdditionConnective.NAME:
                return NumericAdditionConnective.evaluate(rule as NumericAdditionConnective);
            case NumericSubtractionConnective.NAME:
                return NumericSubtractionConnective.evaluate(rule as NumericSubtractionConnective);
            case NumericMultiplicationConnective.NAME:
                return NumericMultiplicationConnective.evaluate(rule as NumericMultiplicationConnective);
            case NumericDivisionConnective.NAME:
                return NumericDivisionConnective.evaluate(rule as NumericDivisionConnective);
            default:
                return 0
        }
    }
}

/** Evaluates `rule` using `tags`. See Connectives for further explanation on evaluation. */
function evaluateRule(rule: SemanticFilterRule, tags: Array<SemanticFilterTag>): boolean {
    
    // Rule is a Tag
    if ((rule as SemanticFilterTag).tag !== undefined) {
        return tags.some((tag: SemanticFilterTag) => tag.tag === (rule as SemanticFilterTag).tag);
    }

    // Rule is a Connective
    switch ((rule as Connective).name) {
        // Logic Connectives
        case TrueConnective.NAME:
            return TrueConnective.evaluate(rule as TrueConnective, tags);
        case FalseConnective.NAME:
            return false;
        case IdentityConnective.NAME:
            return IdentityConnective.evaluate(rule as IdentityConnective, tags);
        case NegationConnective.NAME:
            return NegationConnective.evaluate(rule as NegationConnective, tags);
        case AndConnective.NAME:
            return AndConnective.evaluate(rule as AndConnective, tags);
        case OrConnective.NAME:
            return OrConnective.evaluate(rule as OrConnective, tags);
        case IfThenConnective.NAME:
            return IfThenConnective.evaluate(rule as IfThenConnective, tags);
        case LogicEqualConnective.NAME:
            return LogicEqualConnective.evaluate(rule as LogicEqualConnective, tags);
        case IfThenElseConnective.NAME:
            return IfThenElseConnective.evaluate(rule as IfThenElseConnective, tags);
        // Numeric Connectives
        /*
        For now, these are defined by an unset corresponding tag being treated as if its num was 0. TODO:
        There is potential to redefine this so that an unset tag corresponding tag would automatically
        be evaluated to false. However, this may result in three-valued logic which can be very dangerous
        as some two-values logic laws may not hold.
        Should this redefined, make sure to check all cases, e.g. !(x < y) === x >= y, de morgan, etc.
        */
        case LessThanConnective.NAME:
            return LessThanConnective.evaluate(rule as LessThanConnective, tags);
        case GreaterThanConnective.NAME:
            return GreaterThanConnective.evaluate(rule as GreaterThanConnective, tags);
        case NumericEqualConnective.NAME:
            return NumericEqualConnective.evaluate(rule as NumericEqualConnective, tags);
        case GreaterEqualsConnective.NAME:
            return GreaterEqualsConnective.evaluate(rule as GreaterEqualsConnective, tags);
        case LessEqualsConnective.NAME:
            return LessEqualsConnective.evaluate(rule as LessEqualsConnective, tags);
        case NumericNotEqualConnective.NAME:
            return NumericNotEqualConnective.evaluate(rule as NumericNotEqualConnective, tags);    
        default:
            return true;
    }
}

/**
 * Gets all filters defined as filter rules on a given graph element.
 * @param graph the graph element to check
 * @returns array of filters
 */
export function getFilters(graph: SKGraphElement): Array<Filter> {
    const filters: Array<Filter> = [];
    if (graph.properties['de.cau.cs.kieler.klighd.semanticFilter.rules'] !== undefined) {
        (graph.properties['de.cau.cs.kieler.klighd.semanticFilter.rules'] as Array<SemanticFilterRule>)
            .forEach((rule) => {
                filters.push(createFilter(rule));
            });
    }
    return filters;
}