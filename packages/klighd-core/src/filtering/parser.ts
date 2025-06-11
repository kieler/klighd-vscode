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

import {
    AndConnective,
    BinaryConnective,
    FalseConnective,
    GreaterEqualsConnective,
    GreaterThanConnective,
    LessEqualsConnective,
    LessThanConnective,
    LogicEqualConnective,
    NegationConnective,
    NumericAdditionConnective,
    NumericConstantConnective,
    NumericDivisionConnective,
    NumericEqualConnective,
    NumericMultiplicationConnective,
    NumericNotEqualConnective,
    NumericSubtractionConnective,
    OrConnective,
    SemanticFilterRule,
    SemanticFilterTag,
    TrueConnective,
} from './semantic-filtering-util'

/**
 * Provides a parser for the semantic filter language. The syntax is of the form
 * &lt;rule&gt; &lt;operator&gt; &lt;rule&gt; for all binary operators. The most basic rule is a tag
 * #&lt;tag&gt; that evaluates to true if an element has that tag and false otherwise.
 * Tags may also contain numeric values in which case they  are written as $&lt;tag&gt;.
 * Constant values can be expressed as true, false or a number. Brackets may be used
 * to override precedences. The full list of available operators is given in the table
 * below.
 * <pre>{@code
 * | Operator       |  Syntax                |  Input          | Output  | Precedence |
 * |----------------|------------------------|-----------------|---------|------------|
 * | And            | \<expr\> && \<expr\>   | boolean         | boolean | 4          |
 * | Or             | \<expr\> \|\| \<expr\> | boolean         | boolean | 3          |
 * | Not            | ! \<expr\>             | boolean         | boolean | 6          |
 * | Addition       | \<expr\> + \<expr\>    | numeric         | numeric | 9          |
 * | Subtraction    | \<expr\> - \<expr\>    | numeric         | numeric | 9          |
 * | Multiplication | \<expr\> * \<expr\>    | numeric         | numeric | 10         |
 * | Division       | \<expr\> / \<expr\>    | numeric         | numeric | 10         |
 * | GreaterEquals  | \<expr\> >= \<expr\>   | numeric         | boolean | 8          |
 * | GreaterThan    | \<expr\> > \<expr\>    | numeric         | boolean | 8          |
 * | LessEquals     | \<expr\> <= \<expr\>   | numeric         | boolean | 8          |
 * | LessThan       | \<expr\> < \<expr\>    | numeric         | boolean | 8          |
 * | Equals         | \<expr\> = \<expr\>    | numeric/boolean | boolean | 7          |
 * | NotEqual       | \<expr\> != \<expr\>   | numeric/boolean | boolean | 7          |
 * }</pre>
 *
 */

const OPERATORS: Array<string> = ['*', '/', '+', '-', '=', '!=', '>=', '>', '<=', '<', '||', '&&', '!']

const PRECEDENCES: Map<string, number> = new Map([
    ['*', 10],
    ['/', 10],
    ['+', 9],
    ['-', 9],
    ['=', 7],
    ['!=', 7],
    ['>=', 8],
    ['>', 8],
    ['<=', 8],
    ['<', 8],
    ['||', 3],
    ['&&', 4],
    ['!', 6],
])

export class FilterRuleSyntaxError extends SyntaxError {
    constructor(message: string) {
        super(message)
    }
}

export function parse(ruleString: string): SemanticFilterRule {
    const tokens = ruleString.match(/(\|\||&&|!=|>=|<=|[()!*/+\-<>=]|[^\s()!*/+\-<>=]+)/g) || []
    const operatorStack: Array<OperatorNode> = []
    const outputStack: Array<Node> = []

    tokens.forEach((token: string, _index, _array) => {
        if (OPERATORS.includes(token)) {
            while (
                !(operatorStack.length === 0) &&
                !(operatorStack[operatorStack.length - 1].token === '(') &&
                (PRECEDENCES.get(operatorStack[operatorStack.length - 1].token)! > PRECEDENCES.get(token)! ||
                    (PRECEDENCES.get(operatorStack[operatorStack.length - 1].token) === PRECEDENCES.get(token) &&
                        !(token === '!')))
            ) {
                popOperator(operatorStack, outputStack)
            }
            operatorStack.push(new OperatorNode(token, -1))
        } else if (token === '(') {
            operatorStack.push(new OperatorNode(token, -1))
        } else if (token === ')') {
            if (operatorStack.length === 0) {
                throw new FilterRuleSyntaxError('Mismatched parentheses.')
            }
            while (!(operatorStack[operatorStack.length - 1].token === '(')) {
                if (operatorStack.length === 0) {
                    throw new FilterRuleSyntaxError('Mismatched parentheses.')
                }
                popOperator(operatorStack, outputStack)
            }
            // discard final '('
            operatorStack.pop()
        } else if (token.startsWith('#') || token === 'true' || token === 'false') {
            // Boolean const or variable beginning with #
            outputStack.push(new OperandNode(token, 0))
        } else {
            // Number or variable beginning with $
            outputStack.push(new OperandNode(token, 1))
        }
    })
    // pop remaining operators
    while (!(operatorStack.length === 0)) {
        popOperator(operatorStack, outputStack)
    }
    return convertAST(outputStack.pop()!)
}

abstract class Node {
    token: string

    /**
     * current return type of AST
     * -1: unknown
     * 0: boolean
     * 1: numeric
     */
    type: number

    constructor(token: string, type: number) {
        this.token = token
        this.type = type
    }
}

class OperatorNode extends Node {
    private children: Array<Node>

    getChildren(): Array<Node> {
        return this.children
    }

    constructor(token: string, type: number, children?: Array<Node>) {
        super(token, type)
        this.children = children ?? []
    }

    addChild(child: Node) {
        this.children.push(child)
    }
}

class OperandNode extends Node {
    constructor(token: string, type: number) {
        super(token, type)
    }
}

function convertAST(ast: Node): SemanticFilterRule {
    try {
        let result = <SemanticFilterRule>{}
        let conn = <BinaryConnective>{}
        switch (ast.token) {
            case '*':
                conn = new NumericMultiplicationConnective()
                conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                result = conn
                break
            case '/':
                conn = new NumericDivisionConnective()
                conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                result = conn
                break
            case '+':
                conn = new NumericAdditionConnective()
                conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                result = conn
                break
            case '-':
                conn = new NumericSubtractionConnective()
                conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                result = conn
                break
            // NUMERIC-TO-BOOLEAN
            case '=':
                if ((ast as OperatorNode).getChildren()[0].type === 0) {
                    conn = new LogicEqualConnective()
                    conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                    conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                    result = conn
                } else {
                    conn = new NumericEqualConnective()
                    conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                    conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                    result = conn
                }
                break
            case '!=':
                conn = new NumericNotEqualConnective()
                conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                result = conn
                break
            case '>=':
                conn = new GreaterEqualsConnective()
                conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                result = conn
                break
            case '>':
                conn = new GreaterThanConnective()
                conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                result = conn
                break
            case '<=':
                conn = new LessEqualsConnective()
                conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                result = conn
                break
            case '<':
                conn = new LessThanConnective()
                conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                result = conn
                break
            // BOOLEAN-TO-BOOLEAN
            case '||':
                conn = new OrConnective()
                conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                result = conn
                break
            case '&&':
                conn = new AndConnective()
                conn.leftOperand = convertAST((ast as OperatorNode).getChildren()[0])
                conn.rightOperand = convertAST((ast as OperatorNode).getChildren()[1])
                result = conn
                break
            case '!': {
                const unconn = new NegationConnective()
                unconn.operand = convertAST((ast as OperatorNode).getChildren()[0])
                result = unconn
                break
            }
            case 'true':
                result = new TrueConnective()
                break
            case 'false':
                result = new FalseConnective()
                break
            default:
                // variable or number
                if (ast.token.charAt(0) === '$' || ast.token.charAt(0) === '#') {
                    const semtag = new SemanticFilterTag()
                    semtag.tag = ast.token.substring(1)
                    result = semtag
                } else {
                    const numtag = new NumericConstantConnective()
                    numtag.num = Number(ast.token)
                    if (isNaN(numtag.num)) {
                        throw new FilterRuleSyntaxError(`${ast.token} is not a number.`)
                    }
                    result = numtag
                }
        }
        return result
    } catch {
        throw new FilterRuleSyntaxError('Syntax error.')
    }
}

function popOperator(operatorStack: Array<OperatorNode>, outputStack: Array<Node>): void {
    const operator = operatorStack.pop()!
    if (operator.token === '(' || operator.token === ')') {
        throw new FilterRuleSyntaxError('Mismatched parentheses.')
    }
    if (operator.token === '!') {
        const operand = outputStack.pop()!
        operator.addChild(operand)
        operator.type = 0
        outputStack.push(operator)
    } else {
        // all other operators are binary
        const operand1 = outputStack.pop()!
        const operand2 = outputStack.pop()!
        // reverse order to get correct final order
        operator.addChild(operand2)
        operator.addChild(operand1)
        if (operand1.type !== operand2.type) {
            throw new FilterRuleSyntaxError(`Mixed use of boolean and numeric types in operator ${operator.token}.`)
        }
        // numeric-to-boolean operators
        switch (operator.token) {
            case '>=':
            case '>':
            case '<=':
            case '<':
            case '=':
            case '!=':
                operator.type = 0
                break
            default:
                operator.type = operand1.type
                break
        }
        outputStack.push(operator)
    }
}
