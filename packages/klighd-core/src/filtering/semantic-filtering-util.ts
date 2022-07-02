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
 * Base interface for semantic filter rules.
 */
export interface SemanticFilterRule {
    ruleName?: string
}

/**
 * A semantic filter tag is used as a filter rule that evaluates to true iff the tag is present
 * on a graph element.
 */
export class SemanticFilterTag implements SemanticFilterRule {
    ruleName?: string
    tag: string
    /** Not defining num defaults it to 0. */
    num?: number
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

//// Functions ////

/**
 * A filter is used to apply a filter rule as a boolean function on a graph element. The function
 * returns true if the element fulfils the filter rule and false otherwise.
 */
export interface Filter {
    name?: string
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
        filterFun: (el) => {
            let tags = Array<SemanticFilterTag>();
            if (el.properties['de.cau.cs.kieler.klighd.semanticFilter.tags'] !== undefined) {
                tags = el.properties['de.cau.cs.kieler.klighd.semanticFilter.tags'] as Array<SemanticFilterTag>;
            }

            return evaluateRule(rule, tags);
        }
    }

}

function evaluateRule(rule: SemanticFilterRule, tags: Array<SemanticFilterTag>): boolean {
    if ((rule as SemanticFilterTag).tag !== undefined) {
        return tags.some((tag: SemanticFilterTag) => tag.tag === (rule as SemanticFilterTag).tag);
    }

    // Rule is a Connective
    const unary = rule as UnaryConnective;
    const binary = rule as BinaryConnective;
    const ternary = rule as TernaryConnective;
    let correspondingTag;
    switch ((rule as Connective).name) {
        // Logic Connectives
        case NegationConnective.NAME:
            return !(evaluateRule(unary.operand, tags));
        case AndConnective.NAME:
            return evaluateRule(binary.leftOperand, tags)
                && evaluateRule(binary.rightOperand, tags);
        case OrConnective.NAME:
            return evaluateRule(binary.leftOperand, tags)
                || evaluateRule(binary.rightOperand, tags);
        case IfThenConnective.NAME:
            return !evaluateRule(binary.leftOperand, tags)
                || evaluateRule(binary.rightOperand, tags);
        case LogicEqualConnective.NAME:
            return evaluateRule(binary.leftOperand, tags)
                === evaluateRule(binary.rightOperand, tags);
        case IfThenElseConnective.NAME:
            return evaluateRule(ternary.firstOperand, tags)
                ? evaluateRule(ternary.secondOperand, tags)
                : evaluateRule(ternary.thirdOperand, tags);
        // Numeric Connectives
        case LessThanConnective.NAME:
            correspondingTag = tags.find(tag => tag.tag === (unary as LessThanConnective).operand.tag);
            return ((unary as LessThanConnective).operand.num ?? 0) < (correspondingTag?.num ?? 0);
        case GreaterThanConnective.NAME:
            correspondingTag = tags.find(tag => tag.tag === (unary as GreaterThanConnective).operand.tag);
            return ((unary as GreaterThanConnective).operand.num ?? 0) > (correspondingTag?.num ?? 0);
        case NumericEqualConnective.NAME:
            correspondingTag = tags.find(tag => tag.tag === (unary as NumericEqualConnective).operand.tag);
            return ((unary as NumericEqualConnective).operand.num ?? 0) === (correspondingTag?.num ?? 0);
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