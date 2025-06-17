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
