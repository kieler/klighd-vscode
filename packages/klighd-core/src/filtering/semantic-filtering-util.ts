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

/**
 * Base interface for semantic filter rules.
 */
export interface SemanticFilterRule {
    ruleName?: string
}

/**
 * Base interface for connectives. Connectives take one or more filter rules as operands and 
 * construct a new rule.
 */
export interface Connective extends SemanticFilterRule {
    name: string
}

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

/**
 * A semantic filter tag is used as a filter rule that evaluates to true iff the tag is present
 * on a graph element.
 */
export class SemanticFilterTag implements SemanticFilterRule {
    ruleName?: string
    tag: string
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
 * An Equal Connective takes two rules R1 and R2 and evaluates to true
 * iff
 * R1 and R2 evaluate to true or R1 and R2 evaluate to false.
 * @example R1 === R2
 * @example R1 && R2 || !R1 && !R2
 */
export class EqualConnective implements BinaryConnective {
    static NAME = "EQUAL"
    name = EqualConnective.NAME
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
    switch ((rule as Connective).name) {
        case NegationConnective.NAME:
            return !(evaluateRule((rule as NegationConnective).operand, tags));
        case AndConnective.NAME:
            return evaluateRule((rule as AndConnective).leftOperand, tags)
                && evaluateRule((rule as AndConnective).rightOperand, tags);
        case OrConnective.NAME:
            return evaluateRule((rule as OrConnective).leftOperand, tags)
                || evaluateRule((rule as OrConnective).rightOperand, tags);
        case IfThenConnective.NAME:
            return !evaluateRule((rule as IfThenConnective).leftOperand, tags)
                || evaluateRule((rule as IfThenConnective).rightOperand, tags);
        case EqualConnective.NAME:
            return evaluateRule((rule as EqualConnective).leftOperand, tags)
                === evaluateRule((rule as EqualConnective).rightOperand, tags);
        case IfThenElseConnective.NAME:
            return evaluateRule((rule as IfThenElseConnective).firstOperand, tags)
                ? evaluateRule((rule as IfThenElseConnective).secondOperand, tags)
                : evaluateRule((rule as IfThenElseConnective).thirdOperand, tags);
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