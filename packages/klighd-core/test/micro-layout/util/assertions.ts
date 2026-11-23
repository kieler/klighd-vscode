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

import { expect } from 'chai'
import { Bounds, Point } from 'sprotty-protocol'

export const EPSILON = 1e-6

export function expectPoint(actual: Point, expected: Point, delta = EPSILON): void {
    expect(actual.x, 'x').to.be.closeTo(expected.x, delta)
    expect(actual.y, 'y').to.be.closeTo(expected.y, delta)
}

export function expectBounds(actual: Bounds, expected: Bounds, delta = EPSILON): void {
    expect(actual.x, 'x').to.be.closeTo(expected.x, delta)
    expect(actual.y, 'y').to.be.closeTo(expected.y, delta)
    expect(actual.width, 'width').to.be.closeTo(expected.width, delta)
    expect(actual.height, 'height').to.be.closeTo(expected.height, delta)
}

export function expectBoundsArray(actual: Bounds[], expected: Bounds[], delta = EPSILON): void {
    expect(actual).to.have.length(expected.length)
    for (let i = 0; i < expected.length; i++) {
        expectBounds(actual[i], expected[i], delta)
    }
}
