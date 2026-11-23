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
    CHILD_AREA_POSITION,
    ESTIMATED_GRID_DATA,
    estimateGridSize,
    evaluateGridPlacement,
} from '../../src/micro-layout/gridplacement-util'
import { KContainerRendering, KRendering } from '../../src/skgraph-models'
import {
    bounds,
    bottomRightPosition,
    childArea,
    gridPlacement,
    gridPlacementData,
    rectangle,
    text,
    topLeftPosition,
} from './util/fixtures'
import { expectBounds, expectBoundsArray } from './util/assertions'

function gridContainer(
    numColumns: number,
    children: KRendering[],
    topLeft = topLeftPosition(0, 0),
    bottomRight = bottomRightPosition(0, 0)
): KContainerRendering {
    return rectangle({ children, childPlacement: gridPlacement(numColumns, topLeft, bottomRight) })
}

describe('Micro Layout - Grid placement', () => {
    function fourTextChildren(): KRendering[] {
        return [text('abcd'), text('ab'), text('abcdefgh'), text('mnop')]
    }

    it('estimates a 2x2 grid from the largest cell widths and heights', () => {
        const container = gridContainer(2, fourTextChildren())

        expectBounds(estimateGridSize(container, bounds(0, 0, 100, 40)), bounds(0, 0, 75, 40))
        expect(container.properties[ESTIMATED_GRID_DATA]).to.deep.equal({
            calculatedColumnWidths: [50, 25],
            calculatedRowHeights: [20, 20],
        })
        expect(container.properties[CHILD_AREA_POSITION]).to.deep.equal({ colId: -1, rowId: -1 })
    })

    it('distributes additional width equally over flexible columns', () => {
        const container = gridContainer(2, fourTextChildren())
        estimateGridSize(container, bounds(0, 0, 100, 40))

        const placed = evaluateGridPlacement(
            container.childPlacement as ReturnType<typeof gridPlacement>,
            container.children,
            bounds(0, 0, 100, 40)
        )

        expectBoundsArray(placed, [
            bounds(0, 0, 62.5, 20),
            bounds(62.5, 0, 37.5, 20),
            bounds(0, 20, 62.5, 20),
            bounds(62.5, 20, 37.5, 20),
        ])
    })

    it('does not distribute additional width to inflexible columns', () => {
        const children = [
            text('abcd'),
            rectangle({ children: [text('ab')], placementData: gridPlacementData({ flexibleWidth: false }) }),
            text('abcdefgh'),
            rectangle({ children: [text('mnop')], placementData: gridPlacementData({ flexibleWidth: false }) }),
        ]
        const container = gridContainer(2, children)
        estimateGridSize(container, bounds(0, 0, 100, 40))

        const placed = evaluateGridPlacement(
            container.childPlacement as ReturnType<typeof gridPlacement>,
            container.children,
            bounds(0, 0, 100, 40)
        )

        expectBounds(placed[1], bounds(75, 0, 25, 20))
        expectBounds(placed[3], bounds(75, 20, 25, 20))
    })

    it('uses the largest width for a single-column grid', () => {
        const container = gridContainer(0, [text('ab'), text('abcd'), text('abcdefgh')])

        expectBounds(estimateGridSize(container, bounds(0, 0, 0, 0)), bounds(0, 0, 50, 60))
    })

    it('uses a single row if the column count is -1', () => {
        const container = gridContainer(-1, [text('ab'), text('abcd'), text('abcdefgh')])

        expectBounds(estimateGridSize(container, bounds(0, 0, 0, 0)), bounds(0, 0, 87.5, 20))
        expect(container.properties[ESTIMATED_GRID_DATA]).to.deep.equal({
            calculatedColumnWidths: [12.5, 25, 50],
            calculatedRowHeights: [20],
        })
    })

    it('gives additional space to the child area cell', () => {
        const area = childArea()
        const container = gridContainer(2, [area, text('abcd')])

        expectBounds(estimateGridSize(container, bounds(0, 0, 0, 0)), bounds(0, 0, 25, 20))
        expect(container.properties[CHILD_AREA_POSITION]).to.deep.equal({ colId: 0, rowId: 0 })

        const placed = evaluateGridPlacement(
            container.childPlacement as ReturnType<typeof gridPlacement>,
            container.children,
            bounds(0, 0, 100, 50)
        )

        expectBounds(placed[0], bounds(0, 0, 75, 50))
        expectBounds(placed[1], bounds(75, 0, 25, 50))
    })

    it('applies cell placement data inside the calculated cell bounds', () => {
        const child = rectangle({
            children: [text('abcd')],
            placementData: gridPlacementData({
                topLeft: topLeftPosition(5, 5),
                bottomRight: bottomRightPosition(5, 5),
            }),
        })
        const container = gridContainer(2, [child, text('ab')])

        estimateGridSize(container, bounds(0, 0, 100, 50))
        const placed = evaluateGridPlacement(
            container.childPlacement as ReturnType<typeof gridPlacement>,
            container.children,
            bounds(0, 0, 100, 50)
        )

        expectBounds(placed[0], bounds(5, 5, 51.25, 40))
    })

    it('applies grid placement insets during size estimation', () => {
        const container = gridContainer(2, fourTextChildren(), topLeftPosition(10, 5), bottomRightPosition(10, 5))

        expectBounds(estimateGridSize(container, bounds(0, 0, 0, 0)), bounds(0, 0, 95, 50))
    })

    it('returns zero bounds if the parent has no space', () => {
        const container = gridContainer(2, [text('abcd'), text('ab')])
        expectBoundsArray(
            evaluateGridPlacement(
                container.childPlacement as ReturnType<typeof gridPlacement>,
                container.children,
                bounds(0, 0, 0, 50)
            ),
            [bounds(0, 0, 0, 0), bounds(0, 0, 0, 0)]
        )
    })

    it('can evaluate a grid without a preceding size estimation call', () => {
        const container = gridContainer(2, [text('abcd'), text('ab')])

        const placed = evaluateGridPlacement(
            container.childPlacement as ReturnType<typeof gridPlacement>,
            container.children,
            bounds(0, 0, 37.5, 20),
            container
        )

        expectBoundsArray(placed, [bounds(0, 0, 25, 20), bounds(25, 0, 12.5, 20)])
        expect(container.properties[ESTIMATED_GRID_DATA]).to.not.equal(undefined)
    })

    it('keeps the child count when there are no children', () => {
        const container = gridContainer(2, [])
        expect(estimateGridSize(container, bounds(0, 0, 10, 10))).to.deep.equal(bounds(0, 0, 0, 0))
        expect(
            evaluateGridPlacement(
                container.childPlacement as ReturnType<typeof gridPlacement>,
                container.children,
                bounds(0, 0, 10, 10)
            )
        ).to.deep.equal([])
    })
})
