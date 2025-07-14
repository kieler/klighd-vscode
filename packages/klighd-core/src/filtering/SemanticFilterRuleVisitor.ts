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

import { ParseTree, RuleNode, TerminalNode, ErrorNode, Token } from 'antlr4'
import { SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes'
import { FluentIterable, toArray } from 'sprotty/lib/utils/iterable'
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
    TagContext,
    NumtagContext,
    ExistsExprContext,
    ForallExprContext,
    ListExprContext,
    ListContext,
    VarExprContext,
} from './generated/SemanticFilteringParser'
import SemanticFilteringVisitor from './generated/SemanticFilteringVisitor'
import { evaluateReservedNumericTag, evaluateReservedStructuralTag } from './reserved-structural-tags'
import { getSemanticFilterTags, SemanticFilterTag } from './util'
import { SKNode } from '../skgraph-models'
import { Pair } from '../options/option-models'

function hasProperties(elem: any): elem is SKGraphElement {
    return elem.properties !== undefined
}

// TODO: with scoping I don't think we need this functional signature and it might be helpful to remove it
export class SemanticFilterRuleVisitor implements SemanticFilteringVisitor<(element: SKGraphElement) => boolean> {

    private const symbolTableStack: Pair<string, SKGraphElement>[]

    private lookupVariable(varSymbol: string): SKGraphElement {
        const result = this.symbolTableStack.findLast((symbol) => symbol.k === varSymbol)
        if (result) {
            return result.v
        }
        else {
            throw new Error('Variable ' + varSymbol + ' is undefined.')
        }
    }
    /**
     * A semanticFilterRule always has a top-level or expression followed by an EOF.
     * orExpr EOF
     */
    visitSemanticFilterRule: (ctx: SemanticFilterRuleContext) => (_: SKGraphElement) => boolean = (
        ctx: SemanticFilterRuleContext
    ) => this.visitOrExpr(ctx.orExpr())

    /**
     * An orExpression is the entry point for boolean expressions.
     * It can contain one ore more andExpressions, each of these is evaluated and the results are then combined with a
     * logical or.
     */
    visitOrExpr: (ctx: OrExprContext) => (_: SKGraphElement) => boolean = (ctx: OrExprContext) => {
        const operands = ctx.andExpr_list().map((expr) => this.visitAndExpr(expr))

        return (element: SKGraphElement) => {
            let result = operands[0](element)

            for (let i = 1; i < operands.length; i++) {
                const rightValue = operands[i](element)
                result ||= rightValue
            }
            return result
        }
    }

    /**
     * An andExpression can contain one or more notExpressions. They are evaluated individually and combined using
     * a logical and.
     */
    visitAndExpr: (ctx: AndExprContext) => (_: SKGraphElement) => boolean = (ctx: AndExprContext) => {
        const operands = ctx.notExpr_list().map((expr) => this.visitNotExpr(expr))

        return (element: SKGraphElement) => {
            let result = operands[0](element)

            for (let i = 1; i < operands.length; i++) {
                const rightValue = operands[i](element)
                result &&= rightValue
            }
            return result
        }
    }

    /**
     * A notExpression either contains a NOT or just an equalsExpr.
     * An equals expression is simply evaluated, whereas a NOT is evaluated and then negated.
     */
    visitNotExpr: (ctx: NotExprContext) => (_: SKGraphElement) => boolean = (ctx: NotExprContext) => {
        if (ctx.NOT()) {
            const nestedNot = this.visitNotExpr(ctx.notExpr())
            return (element: SKGraphElement) => !nestedNot(element)
        }
        return this.visitEqualsExpr(ctx.equalsExpr())
    }

    /**
     * An equalsExpression can contain a boolean atom, a single comparisonExpression, a boolean equality, or a numeric
     * equality.
     * A boolean atom or a single comparison are simply evaluated.
     * In case of a boolean equality (comparionExpr (EQ | NEQ) comparisonExpr) each comparison is evaluated and then the
     * equality is checked.
     * In case of a numeric equality (addExpr (EQ | NEQ) addExpr) each addition is evaluated and then the
     * equality is checked.
     */
    visitEqualsExpr: (ctx: EqualsExprContext) => (_: SKGraphElement) => boolean = (ctx: EqualsExprContext) => {
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
                    return (element) => left(element) === right(element)
                case SemanticFilteringParser.NEQ:
                    return (element) => left(element) !== right(element)
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
                    return (element) => left(element) === right(element)
                case SemanticFilteringParser.NEQ:
                    return (element) => left(element) !== right(element)
                default:
                    throw new Error(`Unknown equality operator: ${opType}`)
            }
        }

        if (ctx.VAR(0) && ctx.VAR(1)) {
            const left = ctx.VAR(0).getText()
            const right = ctx.VAR(1).getText()

            const opNode = ctx.getChild(1) as TerminalNode
            const opType = opNode.symbol.type
            switch (opType) {
                case SemanticFilteringParser.EQ:
                    return (_) => {
                        const symbolLeft = this.lookupVariable(left)
                        const symbolRight = this.lookupVariable(right)
                        return symbolLeft === symbolRight
                    }
                case SemanticFilteringParser.NEQ:
                    return (_) => {
                        const symbolLeft = this.lookupVariable(left)
                        const symbolRight = this.lookupVariable(right)
                        return symbolLeft !== symbolRight
                    }
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
    visitComparisonExpr: (ctx: ComparisonExprContext) => (_: SKGraphElement) => boolean = (
        ctx: ComparisonExprContext
    ) => {
        // there must always be two sides in a comparison
        const left = this.evaluateAddExpr(ctx.addExpr(0))
        const right = this.evaluateAddExpr(ctx.addExpr(1))
        const opNode = ctx.getChild(1) as TerminalNode
        const opType = opNode.symbol.type

        switch (opType) {
            case SemanticFilteringParser.GEQ:
                return (element) => left(element) >= right(element)
            case SemanticFilteringParser.GT:
                return (element) => left(element) > right(element)
            case SemanticFilteringParser.LEQ:
                return (element) => left(element) <= right(element)
            case SemanticFilteringParser.LT:
                return (element) => left(element) < right(element)
            default:
                throw new Error(`Unknown operator token type in comparisonExpr: ${opType}`)
        }
    }

    visitAddExpr: (ctx: AddExprContext) => (_: SKGraphElement) => boolean = (_: AddExprContext) => {
        throw new Error('visitAddEXpr should not be called directly.')
    }

    /** An addExpression contains one more multExpressions which are evaluated and then summed up using + or -. */
    private evaluateAddExpr(ctx: AddExprContext): (_: SKGraphElement) => number {
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

        return (element: SKGraphElement) => {
            let result = operandFns[0](element)

            for (let i = 1; i < operandFns.length; i++) {
                const opType = operators[i - 1].symbol.type
                const rightVal = operandFns[i](element)

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
    }

    visitMultExpr: (ctx: MultExprContext) => (_: SKGraphElement) => boolean = (_: MultExprContext) => {
        throw new Error('visitMultExpr should not be called directly.')
    }

    /**
     * A multExpression contains one or more numeric atoms combined using multiplication, division and modulo operators.
     * Each numeric atom is evaluated first and the results are then combined using the given operators.
     */
    private evaluateMultExpr(ctx: MultExprContext): (_: SKGraphElement) => number {
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

        return (element: SKGraphElement) => {
            let result = operands[0](element)

            for (let i = 1; i < operands.length; i++) {
                const opType = operators[i - 1].symbol.type
                const rightValue = operands[i](element)

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
    }

    /**
     * A boolAtom contains either a tag, which returns true if it is present in an element,
     * or a boolean constant true/false,
     * or a list -> boolean comprehension
     * or a parenthesized quantifiedExpression
     */
    visitBoolAtom: (ctx: BoolAtomContext) => (_: SKGraphElement) => boolean = (ctx: BoolAtomContext) => {
        if (ctx.tag()) {
            const name = ctx.tag().ID().getText()
            return (_: SKGraphElement) => {
                const element = this.symbolTableStack[-1].v
                const tags: SemanticFilterTag[] = getSemanticFilterTags(element)
                let result = tags.some((tag: SemanticFilterTag) => tag.tag === name)
                if (!result) {
                    result = evaluateReservedStructuralTag(name, element) ?? false
                }
                return result
            }
        }
        if (ctx.TRUE()) {
            return (_) => true
        }
        if (ctx.FALSE()) {
            return (_) => false
        }
        if (ctx.listExpr()) {
            const list = this.evaluateListExpr(ctx.listExpr())
            return (_) => {
                return toArray(list(_)).length > 0
            }
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

    visitNumAtom: (ctx: NumAtomContext) => (element: SKGraphElement) => boolean = (_: NumAtomContext) => {
        throw new Error('visitNumAtom should not be called directly.')
    }

    /**
     * A numeric atom contains either a numeric tag, which returns the number written on the tag if it is present or 0
     * if there is no number or the tag is not present,
     * or a double,
     * or a list -> number comprehension
     * or a nested parenthesized addExpression.
     */
    private evaluateNumAtom(ctx: NumAtomContext): (element: SKGraphElement) => number {
        if (ctx.numtag()) {
            const name = ctx.numtag().ID().getText()
            return (_: SKGraphElement) => {
                const element = this.symbolTableStack[-1].v
                const tags: SemanticFilterTag[] = getSemanticFilterTags(element)
                const nodeTag = tags.find((tag: SemanticFilterTag) => tag.tag === name)
                if (nodeTag !== undefined) {
                    return nodeTag.num
                }
                return evaluateReservedNumericTag(name, element) ?? 0
            }
        }
        if (ctx.DOUBLE()) {
            const baseValue = parseFloat(ctx.DOUBLE().getText())
            return (_: SKGraphElement) => (ctx.SUB() ? -baseValue : baseValue)
        }
        if (ctx.listExpr()) {
            const list = this.evaluateListExpr(ctx.listExpr())
            return (_) => {
                return toArray(list(_)).length
            }
        }
        if (ctx.addExpr()) {
            return this.evaluateAddExpr(ctx.addExpr())
        }
        throw new Error('Invalid NumAtom.')
    }

    visitExistsExpr: (ctx: ExistsExprContext) => (element: SKGraphElement) => boolean  = (_: ExistsExprContext) => {
        // TODO: desugar exists quantifier
    }

    visitForallExpr: (ctx: ForallExprContext) => (element: SKGraphElement) => boolean = (_: ForallExprContext) => {
        // TODO: desugar forall quantifier
    }

    visitListExpr: (ctx: ListExprContext) => (element: SKGraphElement) => boolean = (_: ListExprContext) {
        throw new Error('visitListExpr should not be called directly.')
    }

    private evaluateListExpr(ctx: ListExprContext): (element: SKGraphElement) => FluentIterable<SKGraphElement> {
        if (ctx.list()) {
            return this.evaluateList(ctx.list())
        }
        if (ctx.listExpr()) {
            const varSymbol = ctx.VAR().getText()
            const list = this.evaluateListExpr(ctx.listExpr())
            return (_: SKGraphElement) => {
                return list(_).filter((element: SKGraphElement) => {
                    this.symbolTableStack.push({ k: varSymbol, v: element })
                    try {
                        const varExpr = this.visitVarExpr(ctx.varExpr())
                        return varExpr(element)
                    } finally {
                        this.symbolTableStack.pop()
                    }
                })
            }
        }
        throw new Error('Invalid ListExpr.')
    }

    visitList: (ctx: ListContext) => (element: SKGraphElement) => boolean = (_: ListContext) {
        throw new Error('visitList should not be called directly.')
    }

    private evaluateList(ctx: ListContext): (_: SKGraphElement) => FluentIterable<SKGraphElement> {
        switch(ctx.start.type) {
            case SemanticFilteringParser.SELF:
                return (element: SKGraphElement) => [element]

            case SemanticFilteringParser.PARENT:
                return (element: SKGraphElement) => {
                    if (element instanceof SChildElementImpl) {
                        const parentElem = element.parent
                        if (parentElem !== undefined && parentElem !== null) {
                            return [parentElem as SKGraphElement]
                        }
                    }
                    return []
                }

            case SemanticFilteringParser.CHILDREN:
                return (element: SKGraphElement) => {
                    if (element instanceof SParentElementImpl) {
                        return element.children.filter((child) => hasProperties(child))
                    }
                    return []
                }

            case SemanticFilteringParser.SIBLINGS:
                return (element: SKGraphElement) => {
                    if (element instanceof SChildElementImpl) {
                        const parentElem = element.parent
                        const siblings = parentElem?.children
                        const others = siblings.filter((sib) => sib !== element)
                        return others.filter((sib) => hasProperties(sib))
                    }
                    return []
                }
            
            case SemanticFilteringParser.ADJACENTS:
                return (element: SKGraphElement) => {
                    if (element instanceof SKNode) {
                        const adjacents = toArray(element.incomingEdges.map((edge) => edge.source)).concat(
                            toArray(element.outgoingEdges.map((edge) => edge.target))
                        )
                        return adjacents.filter((adj) => hasProperties(adj))
                    }
                    return []
                }
            
            default:
                throw new Error(`Unknown list: ${ctx.start.text}`)
            }
    }

    visitVarExpr: (ctx: VarExprContext) => (_: SKGraphElement) => boolean = (ctx: VarExprContext) => {
        if (ctx.VAR()) {
            const inner = this.visitOrExpr(ctx.orExpr())
            const varSymbol = ctx.VAR().getText()
            return (_: SKGraphElement) => { 
                const varElem = this.lookupVariable(varSymbol)
                return inner(varElem)
            }
        }
        else {
            return this.visitOrExpr(ctx.orExpr())
        }
    }

    visitTag: (ctx: TagContext) => (_: SKGraphElement) => boolean = (_: TagContext) => {
        throw new Error('visitTag should not be called directly.')
    }

    visitNumtag: (ctx: NumtagContext) => (_: SKGraphElement) => boolean = (_: NumtagContext) => {
        throw new Error('visitNumtag should not be called directly.')
    }

    visit(_tree: ParseTree): (_: SKGraphElement) => boolean {
        throw new Error('Method not implemented.')
    }

    visitChildren(_node: RuleNode): (_: SKGraphElement) => boolean {
        throw new Error('Method not implemented.')
    }

    visitTerminal(_node: TerminalNode): (_: SKGraphElement) => boolean {
        throw new Error('Method not implemented.')
    }

    visitErrorNode(_node: ErrorNode): (_: SKGraphElement) => boolean {
        throw new Error('Method not implemented.')
    }
}
