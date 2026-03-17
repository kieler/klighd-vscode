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
 * terms of the Eclipse Public License 2.0 which is available at:
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { describe, it } from 'mocha'
import { expect } from 'chai'
import { KRectangle, KText } from '../../src/skgraph-models'
import { estimateSize } from '../../src/micro-layout/placement-util'
import { Bounds } from 'sprotty-protocol'

import { karealayout_pre } from './json/karealayout'
import { KNode } from '../../../klighd-interactive/src/constraint-classes'

const root = karealayout_pre.children[0] as unknown as KNode
const ktext = root.children[0] as unknown as KText
const knode = root.children[1] as unknown as KNode
const rendering_1 = knode.data[0] as unknown as KRectangle
const rendering_11 = rendering_1.children[0] as unknown as KRectangle
const rendering_12 = rendering_1.children[1] as unknown as KRectangle

describe('Micro Layout - Pointplaced & Areaplaced Children', () => {
    const RESULT1 = { width: 30, height: 40, x: 0, y: 0 }
    it('Evaluates estimated bounds of `rendering_1`', () => {
        let estimatedBounds = estimateSize(rendering_1, root.size as Bounds)
        expect(estimatedBounds.width, 'should match with server-calculated estimation bounds width').to.equal(
            RESULT1.width
        )
        expect(estimatedBounds.height, 'should match with server-calculated estimation bounds height').to.equal(
            RESULT1.height
        )
    })
})
