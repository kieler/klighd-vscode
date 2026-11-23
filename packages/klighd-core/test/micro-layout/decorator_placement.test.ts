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
    asDecoratorPlacementData,
    evaluateDecoratorPlacement,
    getDecoratorPlacementData,
} from '../../src/micro-layout/decorator-placement-util'
import { decoratorPlacementData, point, rectangle, renderingRef } from './util/fixtures'
import { expectBounds, expectPoint } from './util/assertions'

const PATH = [point(0, 0), point(100, 0), point(100, 100)]

describe('Micro Layout - Decorator placement', () => {
    it('uses a default decoration and path if no placement data is given', () => {
        const decoration = evaluateDecoratorPlacement(null, PATH)

        expectPoint(decoration.origin, point(0, 0))
        expectBounds(decoration.bounds, { x: 0, y: 0, width: 0, height: 0 })
        expect(decoration.rotation).to.equal(0)
    })

    it('uses a zero-length default path for missing path data', () => {
        const decoration = evaluateDecoratorPlacement(decoratorPlacementData({ xOffset: 3, yOffset: 4 }), null)

        expectPoint(decoration.origin, point(0, 0))
        expectBounds(decoration.bounds, { x: 3, y: 4, width: 0, height: 0 })
    })

    it('places a decorator at an absolute location', () => {
        const decoration = evaluateDecoratorPlacement(
            decoratorPlacementData({ absolute: 10, xOffset: 1, yOffset: 2, width: 3, height: 4 }),
            PATH
        )

        expectPoint(decoration.origin, point(10, 0))
        expectBounds(decoration.bounds, { x: 1, y: 2, width: 3, height: 4 })
        expect(decoration.rotation).to.equal(0)
    })

    it('places a decorator at a relative location and rotates it with the line', () => {
        const decoration = evaluateDecoratorPlacement(
            decoratorPlacementData({ relative: 0.75, rotateWithLine: true }),
            PATH
        )

        expectPoint(decoration.origin, point(100, 50))
        expect(decoration.rotation).to.be.closeTo(Math.PI / 2, 1e-9)
    })

    it('does not rotate a decorator if rotateWithLine is disabled', () => {
        const decoration = evaluateDecoratorPlacement(
            decoratorPlacementData({ relative: 0.75, rotateWithLine: false }),
            PATH
        )

        expect(decoration.rotation).to.equal(0)
    })

    it('handles a single-point path without rotation', () => {
        const decoration = evaluateDecoratorPlacement(decoratorPlacementData({ relative: 0.5, rotateWithLine: true }), [
            point(7, 8),
        ])

        expectPoint(decoration.origin, point(7, 8))
        expect(decoration.rotation).to.equal(0)
    })

    it('reveals decorator placement data directly and through references', () => {
        const data = decoratorPlacementData({ xOffset: 5 })
        expect(asDecoratorPlacementData(data)).to.equal(data)
        expect(getDecoratorPlacementData(rectangle({ placementData: data }))).to.equal(data)
        expect(getDecoratorPlacementData(renderingRef(rectangle({ placementData: data })))).to.equal(data)
    })
})
