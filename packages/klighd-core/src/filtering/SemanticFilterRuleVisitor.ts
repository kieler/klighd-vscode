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
    PositionalFilterRuleContext,
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
} from './generated/SemanticFilteringParser'
import SemanticFilteringVisitor from './generated/SemanticFilteringVisitor'
import { evaluateReservedNumericTag, evaluateReservedStructuralTag } from './reserved-structural-tags'
import { getSemanticFilterTags, SemanticFilterTag } from './util'
import { SKNode } from '../skgraph-models'

export class SemanticFilterRuleVisitor implements SemanticFilteringVisitor<(element: SKGraphElement) => boolean> {
    visitSemanticFilterRule: (ctx: SemanticFilterRuleContext) => (element: SKGraphElement) => boolean = (
        ctx: SemanticFilterRuleContext
    ) => this.visitPositionalFilterRule(ctx.positionalFilterRule())

    visitPositionalFilterRule: (ctx: PositionalFilterRuleContext) => (element: SKGraphElement) => boolean = (
        ctx: PositionalFilterRuleContext
    ) => {
        const predicate = this.visitOrExpr(ctx.orExpr())
        if (!ctx.positionalQuantifier()) {
            return predicate
        }
        const positionalQuantifierType = ctx.positionalQuantifier().start.type

        switch (positionalQuantifierType) {
            case SemanticFilteringParser.SELF:
                return predicate

            case SemanticFilteringParser.PARENT:
                return (element: SKGraphElement) => {
                    const parentElem = (element as unknown as SChildElementImpl).parent ?? undefined
                    if (parentElem !== undefined && parentElem !== null) {
                        return predicate(parentElem as SKGraphElement)
                    }
                    return false
                }

            case SemanticFilteringParser.CHILD:
                return (element: SKGraphElement) => {
                    const children = (element as SParentElementImpl).children ?? []
                    return children.map((child) => child as unknown as SKGraphElement).some(predicate)
                }

            case SemanticFilteringParser.CHILDREN:
                return (element: SKGraphElement) => {
                    const children = (element as SParentElementImpl).children ?? []
                    return children.map((child) => child as unknown as SKGraphElement).every(predicate)
                }

            case SemanticFilteringParser.SIBLING:
                return (element: SKGraphElement) => {
                    const parentElem = (element as unknown as SChildElementImpl).parent ?? undefined
                    const siblings = parentElem?.children ?? []
                    const others = siblings.filter((sib) => (sib as unknown as SKGraphElement) !== element)
                    return others.map((sib) => sib as unknown as SKGraphElement).some(predicate)
                }

            case SemanticFilteringParser.SIBLINGS:
                return (element: SKGraphElement) => {
                    const parentElem = (element as unknown as SChildElementImpl).parent ?? undefined
                    const siblings = parentElem?.children ?? []
                    const others = siblings.filter((sib) => (sib as unknown as SKGraphElement) !== element)
                    return others.map((sib) => sib as unknown as SKGraphElement).every(predicate)
                }

            case SemanticFilteringParser.ADJACENT:
                return (element: SKGraphElement) => {
                    if (element instanceof SKNode) {
                        const adjacents = toArray(element.incomingEdges.map((edge) => edge.source)).concat(
                            toArray(element.outgoingEdges.map((edge) => edge.target))
                        )
                        return adjacents.map((adj) => adj as unknown as SKGraphElement).some(predicate)
                    }
                    return false
                }

            case SemanticFilteringParser.ADJACENTS:
                return (element: SKGraphElement) => {
                    if (element instanceof SKNode) {
                        const adjacents = toArray(element.incomingEdges.map((edge) => edge.source)).concat(
                            toArray(element.outgoingEdges.map((edge) => edge.target))
                        )
                        return adjacents.map((adj) => adj as unknown as SKGraphElement).every(predicate)
                    }
                    return false
                }

            default:
                throw new Error(`Unknown operator token type in positionalFilterRule: ${positionalQuantifierType}`)
        }
    }

    visitOrExpr: (ctx: OrExprContext) => (element: SKGraphElement) => boolean = (ctx: OrExprContext) => {
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

    visitAndExpr: (ctx: AndExprContext) => (element: SKGraphElement) => boolean = (ctx: AndExprContext) => {
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

    visitNotExpr: (ctx: NotExprContext) => (element: SKGraphElement) => boolean = (ctx: NotExprContext) => {
        if (ctx.NOT()) {
            const nestedNot = this.visitNotExpr(ctx.notExpr())
            return (element: SKGraphElement) => !nestedNot(element)
        }
        return this.visitEqualsExpr(ctx.equalsExpr())
    }

    visitEqualsExpr: (ctx: EqualsExprContext) => (element: SKGraphElement) => boolean = (ctx: EqualsExprContext) => {
        if (ctx.boolAtom()) {
            // No EQ or NEQ, just a single boolAtom — fallback
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

        throw new Error('Invalid EqualsExprContext structure.')
    }

    visitComparisonExpr: (ctx: ComparisonExprContext) => (element: SKGraphElement) => boolean = (
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

    visitAddExpr: (ctx: AddExprContext) => (element: SKGraphElement) => boolean = (_: AddExprContext) => {
        throw new Error('visitAddEXpr should not be called directly.')
    }

    private evaluateAddExpr(ctx: AddExprContext): (element: SKGraphElement) => number {
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

    visitMultExpr: (ctx: MultExprContext) => (element: SKGraphElement) => boolean = (_: MultExprContext) => {
        throw new Error('visitMultExpr should not be called directly.')
    }

    private evaluateMultExpr(ctx: MultExprContext): (element: SKGraphElement) => number {
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

    visitBoolAtom: (ctx: BoolAtomContext) => (element: SKGraphElement) => boolean = (ctx: BoolAtomContext) => {
        if (ctx.tag()) {
            const name = ctx.tag().ID().getText()
            return (element: SKGraphElement) => {
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
        if (ctx.orExpr()) {
            return this.visitOrExpr(ctx.orExpr())
        }
        throw new Error('Invalid BoolAtom.')
    }

    visitNumAtom: (ctx: NumAtomContext) => (element: SKGraphElement) => boolean = (_: NumAtomContext) => {
        throw new Error('visitNumAtom should not be called directly.')
    }

    private evaluateNumAtom(ctx: NumAtomContext): (element: SKGraphElement) => number {
        if (ctx.numtag()) {
            const name = ctx.numtag().ID().getText()
            return (element: SKGraphElement) => {
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
        if (ctx.addExpr()) {
            return this.evaluateAddExpr(ctx.addExpr())
        }
        throw new Error('Invalid NumAtom.')
    }

    visitTag: (ctx: TagContext) => (element: SKGraphElement) => boolean = (_: TagContext) => {
        throw new Error('visitTag should not be called directly.')
    }

    visitNumtag: (ctx: NumtagContext) => (element: SKGraphElement) => boolean = (_: NumtagContext) => {
        throw new Error('visitNumtag should not be called directly.')
    }

    visit(_tree: ParseTree): (element: SKGraphElement) => boolean {
        throw new Error('Method not implemented.')
    }

    visitChildren(_node: RuleNode): (element: SKGraphElement) => boolean {
        throw new Error('Method not implemented.')
    }

    visitTerminal(_node: TerminalNode): (element: SKGraphElement) => boolean {
        throw new Error('Method not implemented.')
    }

    visitErrorNode(_node: ErrorNode): (element: SKGraphElement) => boolean {
        throw new Error('Method not implemented.')
    }
}
