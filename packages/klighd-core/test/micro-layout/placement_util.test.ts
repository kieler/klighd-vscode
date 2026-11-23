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
    CALCULATED_TEXT_BOUNDS,
    CALCULATED_TEXT_LINE_HEIGHTS,
    CALCULATED_TEXT_LINE_WIDTHS,
    calculateInsets,
    estimateSize,
    estimateSizeForLabel,
    estimateSizeForNode,
    estimateTextSizeForText,
    KInsets,
    LABELS_TEXT_OVERRIDE,
} from '../../src/micro-layout/placement-util'
import {
    areaPlacementData,
    bottomRightPosition,
    bounds,
    childArea,
    gridPlacement,
    image,
    kTextSizeProperties,
    rectangle,
    renderingRef,
    text,
    topLeftPosition,
} from './util/fixtures'
import { expectBounds } from './util/assertions'

describe('Micro Layout - Size estimation and insets', () => {
    it('estimates single-line and multi-line text sizes', () => {
        expectBounds(estimateSize(text('abcd'), bounds(0, 0, 0, 0)), bounds(0, 0, 25, 20))
        expectBounds(estimateSize(text('ab\ncdef'), bounds(0, 0, 0, 0)), bounds(0, 0, 25, 40))
        expectBounds(estimateTextSizeForText('ab'), bounds(0, 0, 12.5, 20))
    })

    it('prefers testing text sizes over the heuristic', () => {
        expectBounds(
            estimateSize(text('anything', kTextSizeProperties(77, 11)), bounds(0, 0, 0, 0)),
            bounds(0, 0, 77, 11)
        )
    })

    it('uses text overrides when the text is missing', () => {
        const overridden = text(undefined as unknown as string, {
            [LABELS_TEXT_OVERRIDE]: 'abcdefgh',
        })
        expectBounds(estimateSize(overridden, bounds(0, 0, 0, 0)), bounds(0, 0, 50, 20))

        const legacyOverride = text(undefined as unknown as string, {
            'klighd.labels.textOverride': 'abcd',
        })
        expectBounds(estimateSize(legacyOverride, bounds(0, 0, 0, 0)), bounds(0, 0, 25, 20))
    })

    it('persists calculated text bounds and line sizes', () => {
        const kText = text('ab\ncdef')
        estimateSize(kText, bounds(0, 0, 0, 0))
        expectBounds(kText.properties[CALCULATED_TEXT_BOUNDS] as ReturnType<typeof bounds>, bounds(0, 0, 25, 40))
        expect(kText.properties[CALCULATED_TEXT_LINE_WIDTHS]).to.deep.equal([12.5, 25])
        expect(kText.properties[CALCULATED_TEXT_LINE_HEIGHTS]).to.deep.equal([20, 20])
    })

    it('estimates the maximum size of non-grid containers', () => {
        const root = rectangle({ children: [text('abcd'), text('abcdefgh')] })
        expectBounds(estimateSize(root, bounds(0, 0, 0, 0)), bounds(0, 0, 50, 20))
    })

    it('estimates rendering references by estimating the referenced rendering', () => {
        const ref = renderingRef(text('abcd'))
        expectBounds(estimateSize(ref, bounds(0, 0, 0, 0)), bounds(0, 0, 25, 20))
    })

    it('returns empty bounds for child areas', () => {
        expectBounds(estimateSize(childArea(), bounds(0, 0, 10, 10)), bounds(0, 0, 0, 0))
    })

    it('estimates area placed children by inversely applying their placement', () => {
        const child = rectangle({
            placementData: areaPlacementData(topLeftPosition(10, 10), bottomRightPosition(10, 10)),
        })
        expectBounds(estimateSize(child, bounds(0, 0, 100, 100)), bounds(10, 10, 100, 100))
    })

    it('keeps the given size for images without a clip shape', () => {
        const img = image({ placementData: areaPlacementData() })
        expectBounds(estimateSize(img, bounds(0, 0, 100, 50)), bounds(0, 0, 100, 50))
    })

    it('estimates node and label sizes from their renderings', () => {
        const node = { data: [rectangle({ children: [text('abcd')] })], size: bounds(0, 0, 0, 0) }
        expectBounds(estimateSizeForNode(node), bounds(0, 0, 25, 20))

        const label = { data: [text('abcd')], size: bounds(0, 0, 0, 0) }
        expectBounds(estimateSizeForLabel(label), bounds(0, 0, 25, 20))

        const textOnlyLabel = { data: [], text: 'ab' }
        expectBounds(estimateSizeForLabel(textOnlyLabel), bounds(0, 0, 12.5, 20))
    })

    it('calculates insets from the path to the child area', () => {
        const area = childArea({
            placementData: areaPlacementData(topLeftPosition(10, 10), bottomRightPosition(10, 10)),
        })
        const root = rectangle({ children: [area] })
        const insets: KInsets = { left: 0, right: 0, top: 0, bottom: 0 }

        calculateInsets(root, insets, bounds(0, 0, 100, 50))

        expect(insets.left).to.equal(10)
        expect(insets.right).to.equal(10)
        expect(insets.top).to.equal(10)
        expect(insets.bottom).to.equal(10)
    })

    it('calculates insets through a grid child placement', () => {
        const area = childArea()
        const root = rectangle({
            children: [text('ab'), area],
            childPlacement: gridPlacement(2),
        })
        const insets: KInsets = { left: 0, right: 0, top: 0, bottom: 0 }

        calculateInsets(root, insets, bounds(0, 0, 50, 20))

        expect(insets.left).to.equal(12.5)
        expect(insets.right).to.equal(0)
        expect(insets.top).to.equal(0)
        expect(insets.bottom).to.equal(0)
    })
})
