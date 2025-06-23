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
import { describe, it } from 'mocha'
import { createSemanticFilter } from '../../src/filtering/util'
import { SKNode } from '../../src/skgraph-models'

describe('tag expression parsing', () => {
    it('rule: #someTag && #anotherTag', () => {
        const ruleString = '#someTag && #anotherTag'
        const filter = createSemanticFilter(ruleString)

        const node = new SKNode()
        node.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'someTag' }, { tag: 'anotherTag' }],
        }
        expect(filter(node), 'node with exactly matching tags').to.equal(true)

        const nodeOneTag = new SKNode()
        nodeOneTag.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'differentTag' }, { tag: 'anotherTag' }],
        }
        expect(filter(nodeOneTag), 'node with only one matching tag').to.equal(false)

        const nodeMoreTags = new SKNode()
        nodeMoreTags.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'differentTag' },
                { tag: 'anotherTag' },
                { tag: 'someTag' },
            ],
        }
        expect(filter(nodeMoreTags), 'node with matching tags and an additional tag').to.equal(true)
    })

    it('rule: #visible && ! #hidden', () => {
        const ruleString = '#visible && ! #hidden'
        const filter = createSemanticFilter(ruleString)

        const visibleNode = new SKNode()
        visibleNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'visible' }],
        }
        expect(filter(visibleNode), 'visible and not hidden').to.equal(true)

        const hiddenNode = new SKNode()
        hiddenNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'visible' }, { tag: 'hidden' }],
        }
        expect(filter(hiddenNode), 'visible but also hidden').to.equal(false)

        const irrelevantNode = new SKNode()
        irrelevantNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [],
        }
        expect(filter(irrelevantNode), 'node with no relevant tags').to.equal(false)
    })

    it('rule: $number = 1', () => {
        const ruleString = '$number = 1'
        const filter = createSemanticFilter(ruleString)

        const matchingNode = new SKNode()
        matchingNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'number', num: 1 }],
        }
        expect(filter(matchingNode), 'node with number = 1').to.equal(true)

        const nonMatchingNode = new SKNode()
        nonMatchingNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'number', num: 2 }],
        }
        expect(filter(nonMatchingNode), 'node with number != 1').to.equal(false)

        const missingValueNode = new SKNode()
        missingValueNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [],
        }
        expect(filter(missingValueNode), 'node with no number tag').to.equal(false)
    })

    it('rule: $priority >= 5', () => {
        const ruleString = '$priority >= 5'
        const filter = createSemanticFilter(ruleString)

        const node = new SKNode()
        node.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'priority', num: 7 }],
        }
        expect(filter(node), 'node with priority >= 5').to.equal(true)

        const lowPriorityNode = new SKNode()
        lowPriorityNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'priority', num: 3 }],
        }
        expect(filter(lowPriorityNode), 'node with priority < 5').to.equal(false)
    })

    it('rule: $score + 2 > 10', () => {
        const ruleString = '$score + 2 > 10'
        const filter = createSemanticFilter(ruleString)

        const node = new SKNode()
        node.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'score', num: 9 }],
        }
        expect(filter(node), 'node where score + 2 > 10').to.equal(true)

        const nodeTooLow = new SKNode()
        nodeTooLow.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'score', num: 7 }],
        }
        expect(filter(nodeTooLow), 'node where score + 2 <= 10').to.equal(false)
    })

    it('rule: #active || ( $load < 0.5 && ! #error )', () => {
        const ruleString = '#active || ( $load < 0.5 && ! #error )'
        const filter = createSemanticFilter(ruleString)

        const activeNode = new SKNode()
        activeNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'active' }],
        }
        expect(filter(activeNode), 'active node').to.equal(true)

        const efficientNode = new SKNode()
        efficientNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'load', num: 0.3 }],
        }
        expect(filter(efficientNode), 'efficient and not erroring').to.equal(true)

        const failingNode = new SKNode()
        failingNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'load', num: 0.3 }, { tag: 'error' }],
        }
        expect(filter(failingNode), 'low load but with error').to.equal(false)
    })

    it('rule: ! #archived && ( $version = 2 || $version > 3 )', () => {
        const ruleString = '! #archived && ( $version = 2 || $version > 3 )'
        const filter = createSemanticFilter(ruleString)

        const matchingNode = new SKNode()
        matchingNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'version', num: 4 }],
        }
        expect(filter(matchingNode), 'node not archived and version > 3').to.equal(true)

        const archivedNode = new SKNode()
        archivedNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'archived' }, { tag: 'version', num: 4 }],
        }
        expect(filter(archivedNode), 'archived node').to.equal(false)

        const oldNode = new SKNode()
        oldNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'version', num: 1 }],
        }
        expect(filter(oldNode), 'node with version < 2 and not archived').to.equal(false)
    })

    it('complex rule with all operators', () => {
        const ruleString =
            '(#active && !#disabled) || (($load + 2 * $scale - 1) / 3 >= 4 && $version != 0 && $version = 2)'
        const filter = createSemanticFilter(ruleString)

        // Matches via first part: #active && !$disabled
        const activeNode = new SKNode()
        activeNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'active' }],
        }
        expect(filter(activeNode), 'matches first part with #active and no #disabled').to.equal(true)

        // Matches via second part (complex arithmetic/comparison)
        const numericMatchNode = new SKNode()
        numericMatchNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'load', num: 4 },
                { tag: 'scale', num: 3 }, // (4 + 2*3 - 1) / 3 = (4 + 6 - 1)/3 = 9/3 = 3 => 3 >= 4 is false
                { tag: 'version', num: 2 },
            ],
        }
        expect(filter(numericMatchNode), 'arithmetic computes to 3, which is < 4').to.equal(false)

        const strongMatchNode = new SKNode()
        strongMatchNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'load', num: 5 },
                { tag: 'scale', num: 3 }, // (5 + 6 - 1)/3 = 10/3 ≈ 3.33 -> still < 4
                { tag: 'version', num: 2 },
            ],
        }
        expect(filter(strongMatchNode), 'arithmetic computes to ~3.33, still < 4').to.equal(false)

        const passNode = new SKNode()
        passNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'load', num: 7 }, // 7 + 6 - 1 = 12 / 3 = 4
                { tag: 'scale', num: 3 },
                { tag: 'version', num: 2 },
            ],
        }
        expect(filter(passNode), 'numeric expression evaluates to >= 4 and version = 2').to.equal(true)

        const negatedNode = new SKNode()
        negatedNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'active' },
                { tag: 'disabled' }, // this should negate the first clause
            ],
        }
        expect(filter(negatedNode), 'has both #active and #disabled, so !#disabled fails').to.equal(false)
    })
})
