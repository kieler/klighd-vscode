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

export interface SemanticFilterRule {
    ruleName?: String
}

export interface Connective extends SemanticFilterRule {
    name: String
}

export interface UnaryConnective extends Connective {
    operand: SemanticFilterRule
}

export interface BinaryConnective extends Connective {
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
}

export class SemanticFilterTag implements SemanticFilterRule {
    ruleName?: String
    tag: String
}

export class NegationConnective implements UnaryConnective {
    name: String = "NOT"
    operand: SemanticFilterRule
    ruleName?: String
}

export class AndConnective implements BinaryConnective {
    name: String = "AND"
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
    ruleName?: String | undefined
}

export class OrConnective implements BinaryConnective {
    name: String = "OR"
    leftOperand: SemanticFilterRule
    rightOperand: SemanticFilterRule
    ruleName?: String | undefined
}

export interface Filter {
    name?: String
    filterFun(el: SKGraphElement):boolean
}

export function createFilter(rule: SemanticFilterRule): Filter {

    var ruleName;
    if (rule instanceof SemanticFilterTag) {
        ruleName = rule.tag;
    } else {
        ruleName = rule.ruleName;
    }
    return {
        name: ruleName,
        filterFun: (el) => {
            var tags = Array<SemanticFilterTag>();
            if (el.properties['de.cau.cs.kieler.klighd.semanticFilter.tags'] != undefined) {
                tags = el.properties['de.cau.cs.kieler.klighd.semanticFilter.tags'] as Array<SemanticFilterTag>;
            }

            return evaluateRule(rule, tags);
        }
    }

}

function evaluateRule(rule: SemanticFilterRule, tags: Array<SemanticFilterTag>): boolean {
    
    
    if ((rule as SemanticFilterTag).tag != undefined) {
        return tags.some((tag: SemanticFilterTag) => {
            return tag.tag == (rule as SemanticFilterTag).tag
        });
    } else {
        // rule is a connective
        switch ((rule as Connective).name) {
            case "NOT":
                return !(evaluateRule((rule as NegationConnective).operand, tags));
            case "AND":
                return evaluateRule((rule as AndConnective).leftOperand, tags) 
                    && evaluateRule((rule as AndConnective).rightOperand, tags);
            case "OR":
                return evaluateRule((rule as OrConnective).leftOperand, tags) 
                    || evaluateRule((rule as OrConnective).rightOperand, tags);
            default:
                return true;
        }
    }
}

export function getFilters(graph:SKGraphElement): Array<Filter> {
    if (graph.properties['de.cau.cs.kieler.klighd.semanticFilter.rules'] != undefined) {
        var filters:Array<Filter> = [];
        (graph.properties['de.cau.cs.kieler.klighd.semanticFilter.rules'] as Array<SemanticFilterRule>)
            .forEach((rule) => {
                filters.push(createFilter(rule));
            });
        return filters;
    } else {
        return []
    }
}