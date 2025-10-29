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

import { ParseTree, RuleNode, TerminalNode, ErrorNode } from 'antlr4'
import { SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes'
import { toArray } from 'sprotty/lib/utils/iterable'
import { SChildElementImpl, SParentElementImpl } from 'sprotty'
import SemanticFilteringParser, {
    SemanticFilterRuleContext,
    OrExprContext,
    AndExprContext,
    NotExprContext,
    EqualsExprContext,
    ComparisonExprContext,
    MultExprContext,
    AddExprContext,
    BoolAtomContext,
    NumAtomContext,
    ExistsExprContext,
    ForallExprContext,
    ListExprContext,
    ListContext,
    VarExprContext,
    TagExprContext,
    NumtagExprContext,
    ListComprehensionContext,
} from './generated/SemanticFilteringParser'
import SemanticFilteringVisitor from './generated/SemanticFilteringVisitor'
import { evaluateReservedNumericTag, evaluateReservedStructuralTag } from './reserved-structural-tags'
import { getSemanticFilterTags, SemanticFilterTag } from './util'
import { SKNode } from '../skgraph-models'
import { Pair } from '../options/option-models'

function hasProperties(elem: any): elem is SKGraphElement {
    return elem.properties !== undefined
}

function typeFilter<T>(list: any[], callback: (elem: any) => elem is T): T[] {
    return list.filter((el) => callback(el)).map((el) => el as T)
}

export class SemanticFilterRuleVisitor implements SemanticFilteringVisitor<boolean> {
    private symbolTableStack: Pair<string, SKGraphElement>[] = []

    private lookupVariable(varSymbol: string): SKGraphElement {
        for (let i = this.symbolTableStack.length - 1; i >= 0; i--) {
            const symbol = this.symbolTableStack[i]
            if (symbol.k === varSymbol) {
                return symbol.v
            }
        }
        throw new Error(
            `Variable '${varSymbol}' is undefined. Available variables: ${this.symbolTableStack
                .map((s) => s.k)
                .join(', ')}`
        )
    }

    private getCurrentElement(): SKGraphElement {
        const top = this.symbolTableStack[this.symbolTableStack.length - 1]
        if (!top || !top.v) throw new Error('No current element in symbol table.')
        return top.v
    }

    evaluateFilterForElement(ctx: SemanticFilterRuleContext, element: SKGraphElement): boolean {
        this.symbolTableStack.push({ k: 'this', v: element })
        try {
            return this.visitSemanticFilterRule(ctx)
        } finally {
            this.symbolTableStack.pop()
        }
    }

    /**
     * A semanticFilterRule always has a top-level or expression followed by an EOF.
     * orExpr EOF
     */
    visitSemanticFilterRule: (ctx: SemanticFilterRuleContext) => boolean = (ctx: SemanticFilterRuleContext) =>
        this.visitOrExpr(ctx.orExpr())

    /**
     * An orExpression is the entry point for boolean expressions.
     * It can contain one ore more andExpressions, each of these is evaluated and the results are then combined with a
     * logical or.
     */
    visitOrExpr: (ctx: OrExprContext) => boolean = (ctx: OrExprContext) => {
        const operands = ctx.andExpr_list().map((expr) => this.visitAndExpr(expr))

        let result = operands[0]

        for (let i = 1; i < operands.length; i++) {
            const rightValue = operands[i]
            result ||= rightValue
        }
        return result
    }

    /**
     * An andExpression can contain one or more notExpressions. They are evaluated individually and combined using
     * a logical and.
     */
    visitAndExpr: (ctx: AndExprContext) => boolean = (ctx: AndExprContext) => {
        const operands = ctx.notExpr_list().map((expr) => this.visitNotExpr(expr))

        let result = operands[0]

        for (let i = 1; i < operands.length; i++) {
            const rightValue = operands[i]
            result &&= rightValue
        }
        return result
    }

    /**
     * A notExpression either contains a NOT or just an equalsExpr.
     * An equals expression is simply evaluated, whereas a NOT is evaluated and then negated.
     */
    visitNotExpr: (ctx: NotExprContext) => boolean = (ctx: NotExprContext) => {
        if (ctx.NOT()) {
            return !this.visitNotExpr(ctx.notExpr())
        }
        return this.visitEqualsExpr(ctx.equalsExpr())
    }

    /**
     * An equalsExpression can contain a boolean atom, a boolean equality, or a numeric
     * equality.
     * A boolean atom or a single comparison is simply evaluated.
     * In case of a boolean equality (comparionExpr (EQ | NEQ) comparisonExpr) each comparison is evaluated and then the
     * equality is checked.
     * In case of a numeric equality (addExpr (EQ | NEQ) addExpr) each addition is evaluated and then the
     * equality is checked.
     */
    visitEqualsExpr: (ctx: EqualsExprContext) => boolean = (ctx: EqualsExprContext) => {
        if (ctx.boolAtom()) {
            // No EQ or NEQ, just a single boolAtom
            return this.visitBoolAtom(ctx.boolAtom())
        }

        if (ctx.comparisonExpr_list().length === 1) {
            // Only a single boolean comparison
            return this.visitComparisonExpr(ctx.comparisonExpr(0))
        }

        if (ctx.comparisonExpr(0) && ctx.comparisonExpr(1)) {
            const left = this.visitComparisonExpr(ctx.comparisonExpr(0))
            const right = this.visitComparisonExpr(ctx.comparisonExpr(1))
            const opNode = ctx.getChild(1) as TerminalNode
            const opType = opNode.symbol.type

            switch (opType) {
                case SemanticFilteringParser.EQ:
                    return left === right
                case SemanticFilteringParser.NEQ:
                    return left !== right
                default:
                    throw new Error(`Unknown equality operator: ${opType}`)
            }
        }

        if (ctx.addExpr(0) && ctx.addExpr(1)) {
            const left = this.evaluateAddExpr(ctx.addExpr(0))
            const right = this.evaluateAddExpr(ctx.addExpr(1))
            const opNode = ctx.getChild(1) as TerminalNode
            const opType = opNode.symbol.type

            switch (opType) {
                case SemanticFilteringParser.EQ:
                    return left === right
                case SemanticFilteringParser.NEQ:
                    return left !== right
                default:
                    throw new Error(`Unknown equality operator: ${opType}`)
            }
        }

        if (ctx.ID(0) && ctx.ID(1)) {
            const left = ctx.ID(0).getText()
            const right = ctx.ID(1).getText()

            const opNode = ctx.getChild(1) as TerminalNode
            const opType = opNode.symbol.type

            const symbolLeft = this.lookupVariable(left)
            const symbolRight = this.lookupVariable(right)

            switch (opType) {
                case SemanticFilteringParser.EQ:
                    return symbolLeft === symbolRight
                case SemanticFilteringParser.NEQ:
                    return symbolLeft !== symbolRight
                default:
                    throw new Error(`Unknown equality operator: ${opType}`)
            }
        }

        throw new Error('Invalid EqualsExprContext structure.')
    }

    /**
     * A comparisonExpr contains two addExpressions that are evaluated and their results checked with one of the four
     * comparison relations: >=, >, <=, <
     */
    visitComparisonExpr: (ctx: ComparisonExprContext) => boolean = (ctx: ComparisonExprContext) => {
        // there must always be two sides in a comparison
        const left = this.evaluateAddExpr(ctx.addExpr(0))
        const right = this.evaluateAddExpr(ctx.addExpr(1))
        const opNode = ctx.getChild(1) as TerminalNode
        const opType = opNode.symbol.type

        switch (opType) {
            case SemanticFilteringParser.GEQ:
                return left >= right
            case SemanticFilteringParser.GT:
                return left > right
            case SemanticFilteringParser.LEQ:
                return left <= right
            case SemanticFilteringParser.LT:
                return left < right
            default:
                throw new Error(`Unknown operator token type in comparisonExpr: ${opType}`)
        }
    }

    visitAddExpr: (ctx: AddExprContext) => boolean = (_: AddExprContext) => {
        throw new Error('visitAddEXpr should not be called directly.')
    }

    /** An addExpression contains one more multExpressions which are evaluated and then summed up using + or -. */
    private evaluateAddExpr(ctx: AddExprContext): number {
        const operandFns = ctx.multExpr_list().map((expr) => this.evaluateMultExpr(expr))

        const operators: TerminalNode[] = []
        for (let i = 0; i < ctx.getChildCount(); i++) {
            const child = ctx.getChild(i)
            if (child instanceof TerminalNode) {
                if (
                    child.symbol.type === SemanticFilteringParser.ADD ||
                    child.symbol.type === SemanticFilteringParser.SUB
                ) {
                    operators.push(child)
                }
            }
        }

        let result = operandFns[0]

        for (let i = 1; i < operandFns.length; i++) {
            const opType = operators[i - 1].symbol.type
            const rightVal = operandFns[i]

            switch (opType) {
                case SemanticFilteringParser.ADD:
                    result += rightVal
                    break
                case SemanticFilteringParser.SUB:
                    result -= rightVal
                    break
                default:
                    throw new Error(`Unknown operator token type in addExpr: ${opType}`)
            }
        }
        return result
    }

    visitMultExpr: (ctx: MultExprContext) => boolean = (_: MultExprContext) => {
        throw new Error('visitMultExpr should not be called directly.')
    }

    /**
     * A multExpression contains one or more numeric atoms combined using multiplication, division and modulo operators.
     * Each numeric atom is evaluated first and the results are then combined using the given operators.
     */
    private evaluateMultExpr(ctx: MultExprContext): number {
        const operands = ctx.numAtom_list().map((expr) => this.evaluateNumAtom(expr))

        const operators: TerminalNode[] = []
        for (let i = 0; i < ctx.getChildCount(); i++) {
            const child = ctx.getChild(i)
            if (child instanceof TerminalNode) {
                if (
                    child.symbol.type === SemanticFilteringParser.MULT ||
                    child.symbol.type === SemanticFilteringParser.DIV ||
                    child.symbol.type === SemanticFilteringParser.MOD
                ) {
                    operators.push(child)
                }
            }
        }

        let result = operands[0]

        for (let i = 1; i < operands.length; i++) {
            const opType = operators[i - 1].symbol.type
            const rightValue = operands[i]

            switch (opType) {
                case SemanticFilteringParser.MULT:
                    result *= rightValue
                    break
                case SemanticFilteringParser.DIV:
                    result /= rightValue
                    break
                case SemanticFilteringParser.MOD:
                    result %= rightValue
                    break
                default:
                    throw new Error(`Unknown operator token type in multExpr: ${opType}`)
            }
        }
        return result
    }

    /**
     * A boolAtom contains either a tag, which returns true if it is present in an element,
     * or a boolean constant true/false,
     * or a list -> boolean comprehension
     * or a parenthesized quantifiedExpression
     */
    visitBoolAtom: (ctx: BoolAtomContext) => boolean = (ctx: BoolAtomContext) => {
        if (ctx.tagExpr()) {
            return this.visitTagExpr(ctx.tagExpr())
        }
        if (ctx.TRUE()) {
            return true
        }
        if (ctx.FALSE()) {
            return false
        }
        if (ctx.existsExpr()) {
            return this.visitExistsExpr(ctx.existsExpr())
        }
        if (ctx.forallExpr()) {
            return this.visitForallExpr(ctx.forallExpr())
        }
        if (ctx.orExpr()) {
            return this.visitOrExpr(ctx.orExpr())
        }
        throw new Error('Invalid BoolAtom.')
    }

    visitNumAtom: (ctx: NumAtomContext) => boolean = (_: NumAtomContext) => {
        throw new Error('visitNumAtom should not be called directly.')
    }

    /**
     * A numeric atom contains either a numeric tag, which returns the number written on the tag if it is present or 0
     * if there is no number or the tag is not present,
     * or a double,
     * or a list -> number comprehension
     * or a nested parenthesized addExpression.
     */
    private evaluateNumAtom(ctx: NumAtomContext): number {
        if (ctx.numtagExpr()) {
            return this.evaluateNumtagExpr(ctx.numtagExpr())
        }
        if (ctx.DOUBLE()) {
            const baseValue = parseFloat(ctx.DOUBLE().getText())
            return ctx.SUB() ? -baseValue : baseValue
        }
        if (ctx.addExpr()) {
            return this.evaluateAddExpr(ctx.addExpr())
        }
        throw new Error('Invalid NumAtom.')
    }

    visitExistsExpr: (ctx: ExistsExprContext) => boolean = (ctx: ExistsExprContext) => {
        const listExpr = this.evaluateListExpr(ctx.listComprehension().listExpr())
        const varSymbol = ctx.listComprehension().ID().getText()

        return listExpr.some((element: SKGraphElement) => {
            this.symbolTableStack.push({ k: varSymbol, v: element })
            try {
                return this.visitVarExpr(ctx.listComprehension().varExpr())
            } finally {
                this.symbolTableStack.pop()
            }
        })
    }

    visitForallExpr: (ctx: ForallExprContext) => boolean = (ctx: ForallExprContext) => {
        const listExpr = this.evaluateListExpr(ctx.listComprehension().listExpr())
        const varSymbol = ctx.listComprehension().ID().getText()

        return listExpr.every((element: SKGraphElement) => {
            this.symbolTableStack.push({ k: varSymbol, v: element })
            try {
                return this.visitVarExpr(ctx.listComprehension().varExpr())
            } finally {
                this.symbolTableStack.pop()
            }
        })
    }

    visitTagExpr: (ctx: TagExprContext) => boolean = (ctx: TagExprContext) => {
        if (ctx.ID()) {
            const name = ctx.ID().getText()
            const element = this.getCurrentElement()
            const tags: SemanticFilterTag[] = getSemanticFilterTags(element)
            let result = tags.some((tag: SemanticFilterTag) => tag.tag === name)
            if (!result) {
                result = evaluateReservedStructuralTag(name, element) ?? false
            }
            return result
        }
        if (ctx.listExpr()) {
            return this.evaluateListExpr(ctx.listExpr()).length > 0
        }
        throw new Error('Invalid TagExpr')
    }

    visitNumtagExpr: (ctx: NumtagExprContext) => boolean = (_: NumtagExprContext) => {
        throw new Error('visitNumtagExpr should not be called directly.')
    }

    evaluateNumtagExpr(ctx: NumtagExprContext): number {
        if (ctx.ID()) {
            const name = ctx.ID().getText()
            const element = this.getCurrentElement()
            const tags: SemanticFilterTag[] = getSemanticFilterTags(element)
            const nodeTag = tags.find((tag: SemanticFilterTag) => tag.tag === name)
            if (nodeTag !== undefined) {
                return nodeTag.num
            }
            return evaluateReservedNumericTag(name, element) ?? 0
        }
        if (ctx.listExpr()) {
            const list = this.evaluateListExpr(ctx.listExpr())
            return list.length
        }
        throw new Error('Invalid NumtagExpr')
    }

    visitListExpr: (ctx: ListExprContext) => boolean = (_: ListExprContext) => {
        throw new Error('visitListExpr should not be called directly.')
    }

    private evaluateListExpr(ctx: ListExprContext): SKGraphElement[] {
        if (ctx.list()) {
            return this.evaluateList(ctx.list())
        }
        if (ctx.listComprehension()) {
            return this.evaluateListComprehension(ctx.listComprehension())
        }
        throw new Error('Invalid ListExpr.')
    }

    visitList: (ctx: ListContext) => boolean = (_: ListContext) => {
        throw new Error('visitList should not be called directly.')
    }

    private evaluateList(ctx: ListContext): SKGraphElement[] {
        const element = this.getCurrentElement()

        switch (ctx.start.type) {
            case SemanticFilteringParser.SELF:
                return [element]

            case SemanticFilteringParser.PARENT:
                if (element instanceof SChildElementImpl) {
                    const parentElem = element.parent
                    if (parentElem !== undefined && parentElem !== null) {
                        return [parentElem as SKGraphElement]
                    }
                }
                return []

            case SemanticFilteringParser.CHILDREN:
                if (element instanceof SParentElementImpl) {
                    return typeFilter(toArray(element.children), hasProperties)
                }
                return []

            case SemanticFilteringParser.SIBLINGS:
                if (element instanceof SChildElementImpl) {
                    const parentElem = element.parent
                    const siblings = parentElem?.children
                    const others = siblings.filter((sib) => sib !== element)
                    return typeFilter(others, hasProperties)
                }
                return []

            case SemanticFilteringParser.ADJACENTS:
                if (element instanceof SKNode) {
                    const adjacents = Array.from(
                        new Set([
                            ...element.incomingEdges.map((edge) => edge.source),
                            ...element.outgoingEdges.map((edge) => edge.target),
                        ])
                    )
                    return typeFilter(adjacents, hasProperties)
                }
                return []

            default:
                throw new Error(`Unknown list: ${ctx.start.text}`)
        }
    }

    visitListComprehension: (ctx: ListComprehensionContext) => boolean = (_: ListComprehensionContext) => {
        throw new Error('visitListComprehension should not be called directly.')
    }

    evaluateListComprehension(ctx: ListComprehensionContext): SKGraphElement[] {
        const varSymbol = ctx.ID().getText()
        const list = this.evaluateListExpr(ctx.listExpr())
        return list.filter((element: SKGraphElement) => {
            this.symbolTableStack.push({ k: varSymbol, v: element })
            try {
                return this.visitVarExpr(ctx.varExpr())
            } finally {
                this.symbolTableStack.pop()
            }
        })
    }

    visitVarExpr: (ctx: VarExprContext) => boolean = (ctx: VarExprContext) => {
        if (ctx.ID()) {
            const varSymbol = ctx.ID().getText()
            const varElem = this.lookupVariable(varSymbol)
            // push found var back on to stack for execution of subexpression
            this.symbolTableStack.push({ k: varSymbol, v: varElem })
            const result = this.visitOrExpr(ctx.orExpr())
            this.symbolTableStack.pop()
            return result
        }
        // evaluate with current scope
        return this.visitOrExpr(ctx.orExpr())
    }

    visit(_tree: ParseTree): boolean {
        throw new Error('Method not implemented.')
    }

    visitChildren(_node: RuleNode): boolean {
        throw new Error('Method not implemented.')
    }

    visitTerminal(_node: TerminalNode): boolean {
        throw new Error('Method not implemented.')
    }

    visitErrorNode(_node: ErrorNode): boolean {
        throw new Error('Method not implemented.')
    }
}
