/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2026 by
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

import { SemanticFilterTag } from '../../../src/filtering/util'

export function tag(name: string, num?: number): SemanticFilterTag {
    const result = new SemanticFilterTag()
    result.tag = name

    if (num !== undefined) {
        result.num = num
    }

    return result
}

export function binaryRule(ruleName: string, leftOperand: unknown, rightOperand: unknown): unknown {
    return {
        ruleName,
        name: ruleName,
        leftOperand,
        rightOperand,
    }
}

export function unaryRule(ruleName: string, operand: unknown): unknown {
    return {
        ruleName,
        name: ruleName,
        operand,
    }
}

export function constant(value: number): unknown {
    return {
        ruleName: 'numeric constant',
        name: 'CONST',
        num: value,
    }
}

export function numericWrapper(ruleName: string, leftOperand: unknown, rightOperand: unknown): unknown {
    return {
        ruleName: 'wrapper',
        name: ruleName,
        leftOperand,
        rightOperand,
    }
}
