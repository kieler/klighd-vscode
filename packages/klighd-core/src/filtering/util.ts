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

import { CharStream, CommonTokenStream } from 'antlr4'
import { SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes'
import SemanticFilteringLexer from './generated/SemanticFilteringLexer'
import SemanticFilteringParser from './generated/SemanticFilteringParser'
import { SemanticFilterRuleVisitor } from './SemanticFilterRuleVisitor'
import { convert } from './legacy/converter'

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

/** Extracts the semantic filter tags defined for an element. */
export function getSemanticFilterTags(element: SKGraphElement) {
    let tags: SemanticFilterTag[] = []
    if (element.properties['de.cau.cs.kieler.klighd.semanticFilter.tags'] !== undefined) {
        tags = element.properties['de.cau.cs.kieler.klighd.semanticFilter.tags'] as SemanticFilterTag[]
    }
    return tags
}

/**
 * Attempts to parse a string as a semantic filter rule and if successful, returns a filter function that can be applied
 * to SKGraphElements
 * @param rule A string following the Semantic Filter Rule language syntax
 * @returns a function of shape (element: SKGraphElement) => boolean that returns true if the element passes the filter
 *          defined by the rule
 */
export function createSemanticFilter(rule: string): (element: SKGraphElement) => boolean {
    const stream = new CharStream(rule)
    const lexer = new SemanticFilteringLexer(stream)
    const tokenStream = new CommonTokenStream(lexer)
    const parser = new SemanticFilteringParser(tokenStream)

    const tree = parser.semanticFilterRule()

    const visitor = new SemanticFilterRuleVisitor()
    return visitor.visitSemanticFilterRule(tree)
}

// LEGACY SUPPORT

/**
 * A filter is used to apply a filter rule as a boolean function on a graph element. The function
 * returns true if the element fulfils the filter rule and false otherwise.
 */
export interface Filter {
    name?: string
    defaultValue?: boolean
    filterFun(el: SKGraphElement): boolean
}

/** Type narrowing function to check whether a semantic filter rule is a tag. */
export function isTag(rule: SemanticFilterTag | SemanticFilterRule): rule is SemanticFilterTag {
    return (rule as SemanticFilterTag).tag !== undefined
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

    const ruleString = convert(rule)
    return {
        name: ruleName,
        defaultValue: rule.defaultValue,
        filterFun: createSemanticFilter(ruleString),
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
