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
import { HorizontalAlignment, VerticalAlignment } from '../../src/skgraph-models'
import {
    basicEstimateSize,
    estimatePointPlacedChildSize,
    evaluateAreaPlacement,
    evaluateKPosition,
    evaluatePointPlacement,
    evaluatePolylinePlacement,
    findChildArea,
    inverselyApplyBoundingBoxKPositions,
} from '../../src/micro-layout/placement-util'
import {
    asAreaPlacementData,
    asGridPlacement,
    asGridPlacementData,
    asPointPlacementData,
    getPlacementData,
    toNonNullBottomPosition,
    toNonNullLeftPosition,
    toNonNullRightPosition,
    toNonNullTopPosition,
} from '../../src/micro-layout/krendering-util'
import {
    areaPlacementData,
    bottom,
    bottomRightPosition,
    bounds,
    childArea,
    gridPlacement,
    gridPlacementData,
    left,
    point,
    pointPlacementData,
    polyline,
    position,
    rectangle,
    renderingRef,
    right,
    text,
    top,
    topLeftPosition,
} from './util/fixtures'
import { expectBounds, expectPoint } from './util/assertions'

describe('Micro Layout - Positions and area placement', () => {
    const parentBounds = bounds(0, 0, 100, 50)

    it('uses top-left positions as defaults for missing position components', () => {
        expect(toNonNullLeftPosition(undefined)).to.deep.equal(left(0, 0))
        expect(toNonNullTopPosition(undefined)).to.deep.equal(top(0, 0))
        expect(toNonNullRightPosition(undefined)).to.deep.equal(right(0, 0))
        expect(toNonNullBottomPosition(undefined)).to.deep.equal(bottom(0, 0))
    })

    it('evaluates absolute and relative left/top positions', () => {
        expectPoint(evaluateKPosition(position(left(10, 0.25), top(20, 0.5)), parentBounds, true), point(35, 45))
    })

    it('evaluates absolute and relative right/bottom positions', () => {
        expectPoint(
            evaluateKPosition(position(right(10, 0.1), bottom(5, 0.2)), parentBounds, false),
            point(100 - 10 - 10, 50 - 5 - 10)
        )
    })

    it('evaluates area placement with explicit and default positions', () => {
        expectBounds(
            evaluateAreaPlacement(
                areaPlacementData(topLeftPosition(10, 10), bottomRightPosition(10, 10)),
                parentBounds
            ),
            bounds(10, 10, 80, 30)
        )
        expectBounds(evaluateAreaPlacement(areaPlacementData(), parentBounds), bounds(0, 0, 100, 50))
        expectBounds(evaluateAreaPlacement(null, parentBounds), bounds(0, 0, 100, 50))
    })

    it('evaluates point placement using the requested alignment', () => {
        const ppd = pointPlacementData({
            referencePoint: topLeftPosition(50, 25),
            horizontalAlignment: HorizontalAlignment.CENTER,
            verticalAlignment: VerticalAlignment.CENTER,
        })
        expectBounds(evaluatePointPlacement(ppd, bounds(0, 0, 10, 10), parentBounds), bounds(45, 20, 10, 10))

        const rightBottomPpd = pointPlacementData({
            referencePoint: topLeftPosition(50, 25),
            horizontalAlignment: HorizontalAlignment.RIGHT,
            verticalAlignment: VerticalAlignment.BOTTOM,
        })
        expectBounds(evaluatePointPlacement(rightBottomPpd, bounds(0, 0, 10, 10), parentBounds), bounds(40, 15, 10, 10))
    })

    it('assumes the top-left corner if a point placement has no reference point', () => {
        const ppd = {
            ...pointPlacementData(),
            referencePoint: undefined,
        } as unknown as ReturnType<typeof pointPlacementData>
        expectBounds(evaluatePointPlacement(ppd, bounds(0, 0, 10, 10), parentBounds), bounds(0, 0, 10, 10))
    })

    it('estimates point placed child sizes including margins', () => {
        const child = text('abcd')
        const ppd = pointPlacementData({
            referencePoint: topLeftPosition(20, 30),
            horizontalAlignment: HorizontalAlignment.LEFT,
            verticalAlignment: VerticalAlignment.TOP,
            horizontalMargin: 5,
            verticalMargin: 5,
        })
        expectBounds(estimatePointPlacedChildSize(child, ppd), bounds(0, 0, 50, 55))

        const centered = pointPlacementData({
            referencePoint: topLeftPosition(100, 100),
            horizontalAlignment: HorizontalAlignment.CENTER,
            verticalAlignment: VerticalAlignment.CENTER,
            horizontalMargin: 4,
            verticalMargin: 4,
        })
        expectBounds(estimatePointPlacedChildSize(child, centered), bounds(0, 0, 116.5, 114))
    })

    it('evaluates polyline points in parent bounds', () => {
        const line = polyline([topLeftPosition(10, 10), topLeftPosition(10, 10, 0.5, 0.8), bottomRightPosition(5, 5)])
        const points = evaluatePolylinePlacement(line, parentBounds)
        expect(points).to.have.length(3)
        expectPoint(points[0], point(10, 10))
        expectPoint(points[1], point(60, 50))
        expectPoint(points[2], point(95, 45))
    })

    it('uses polyline points as additional minimal bounds', () => {
        const line = polyline([topLeftPosition(0, 0), topLeftPosition(120, 70)])
        expectBounds(basicEstimateSize(line, bounds(0, 0, 0, 0)), bounds(0, 0, 120, 70))
    })

    it('inversely applies the area passe-partout', () => {
        expectBounds(
            inverselyApplyBoundingBoxKPositions(
                bounds(0, 0, 80, 80),
                topLeftPosition(10, 10),
                bottomRightPosition(10, 10)
            ),
            bounds(0, 0, 100, 100)
        )
    })

    it('finds child areas through nested renderings and rendering references', () => {
        const area = childArea()
        const ref = renderingRef(area)
        const root = rectangle({ children: [text('nothing'), ref] })
        const path: ReturnType<typeof rectangle>[] = []
        expect(findChildArea(root, path)).to.equal(true)
        expect(path).to.deep.equal([root, ref, area])
    })

    it('reveals placement data through rendering references and typed helpers', () => {
        const area = areaPlacementData()
        const ppd = pointPlacementData()
        const gridData = gridPlacementData()
        const grid = gridPlacement(2)

        expect(getPlacementData(renderingRef(rectangle({ placementData: area })))).to.equal(area)
        expect(asAreaPlacementData(area)).to.equal(area)
        expect(asPointPlacementData(ppd)).to.equal(ppd)
        expect(asGridPlacementData(gridData)).to.equal(gridData)
        expect(asGridPlacement(grid)).to.equal(grid)
        expect(asPointPlacementData(area)).to.equal(null)
    })
})
