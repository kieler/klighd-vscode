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

import { describe, it } from 'mocha'
import { expect } from 'chai'
import {
    boundsMax,
    boundsMin,
    boundsOf,
    compare,
    emptyBounds,
    immutableCopy,
    isEmpty,
    moveBounds,
} from '../../src/micro-layout/bounds-util'
import { bounds } from './util/fixtures'

describe('Micro Layout - Bounds', () => {
    const first = bounds(1, 2, 10, 20)
    const second = bounds(3, 4, 15, 5)

    it('finds the component-wise maximum while keeping the first position', () => {
        expect(boundsMax(first, second)).to.deep.equal(bounds(1, 2, 15, 20))
    })

    it('finds the component-wise minimum while keeping the first position', () => {
        expect(boundsMin(first, second)).to.deep.equal(bounds(1, 2, 10, 5))
    })

    it('creates bounds from four values, two values, or another bounds object', () => {
        expect(boundsOf(1, 2, 3, 4)).to.deep.equal(bounds(1, 2, 3, 4))
        expect(boundsOf(3, 4)).to.deep.equal(bounds(0, 0, 3, 4))
        expect(boundsOf(first)).to.deep.equal(first)
    })

    it('compares widths and heights with an optional tolerance', () => {
        expect(compare(first, bounds(0, 0, 10, 20))).to.deep.equal({
            widthEqual: true,
            heightEqual: true,
        })
        expect(compare(first, bounds(0, 0, 10.05, 19.95), 0.1)).to.deep.equal({
            widthEqual: true,
            heightEqual: true,
        })
        expect(compare(first, bounds(0, 0, 11, 20))).to.deep.equal({
            widthEqual: false,
            heightEqual: true,
        })
    })

    it('detects empty bounds and moves bounds without mutating the input', () => {
        expect(isEmpty(emptyBounds())).to.equal(true)
        expect(isEmpty(bounds(0, 0, 1, 0))).to.equal(false)

        const moved = moveBounds(first, 5, -3)
        expect(moved).to.deep.equal(bounds(6, -1, 10, 20))
        expect(first).to.deep.equal(bounds(1, 2, 10, 20))
    })

    it('creates an immutable copy', () => {
        const copy = immutableCopy(first)
        expect(copy).to.deep.equal(first)
        expect(copy).to.not.equal(first)
        expect(Object.isFrozen(copy)).to.equal(true)
    })
})
