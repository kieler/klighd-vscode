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
import { SGraphImpl } from 'sprotty'
import { parse } from '../../src/filtering/parser'
import { createFilter } from '../../src/filtering/semantic-filtering-util'
import { SKEdge, SKLabel, SKNode, SKPort } from '../../src/skgraph-models'

describe('tag expression parsing', () => {
    it('rule: #someTag && #anotherTag', () => {
        const ruleString = '#someTag && #anotherTag'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        const node = new SKNode()
        node.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'someTag' }, { tag: 'anotherTag' }],
        }
        expect(filter.filterFun(node), 'node with exactly matching tags').to.equal(true)

        const nodeOneTag = new SKNode()
        nodeOneTag.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'differentTag' }, { tag: 'anotherTag' }],
        }
        expect(filter.filterFun(nodeOneTag), 'node with only one matching tag').to.equal(false)

        const nodeMoreTags = new SKNode()
        nodeMoreTags.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'differentTag' },
                { tag: 'anotherTag' },
                { tag: 'someTag' },
            ],
        }
        expect(filter.filterFun(nodeMoreTags), 'node with matching tags and an additional tag').to.equal(true)
    })

    it('rule: #visible && ! #hidden', () => {
        const ruleString = '#visible && ! #hidden'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        const visibleNode = new SKNode()
        visibleNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'visible' }],
        }
        expect(filter.filterFun(visibleNode), 'visible and not hidden').to.equal(true)

        const hiddenNode = new SKNode()
        hiddenNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'visible' }, { tag: 'hidden' }],
        }
        expect(filter.filterFun(hiddenNode), 'visible but also hidden').to.equal(false)

        const irrelevantNode = new SKNode()
        irrelevantNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [],
        }
        expect(filter.filterFun(irrelevantNode), 'node with no relevant tags').to.equal(false)
    })

    it('rule: $number = 1', () => {
        const ruleString = '$number = 1'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        const matchingNode = new SKNode()
        matchingNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'number', num: 1 }],
        }
        expect(filter.filterFun(matchingNode), 'node with number = 1').to.equal(true)

        const nonMatchingNode = new SKNode()
        nonMatchingNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'number', num: 2 }],
        }
        expect(filter.filterFun(nonMatchingNode), 'node with number != 1').to.equal(false)

        const missingValueNode = new SKNode()
        missingValueNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [],
        }
        expect(filter.filterFun(missingValueNode), 'node with no number tag').to.equal(false)
    })

    it('rule: $priority >= 5', () => {
        const ruleString = '$priority >= 5'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        const node = new SKNode()
        node.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'priority', num: 7 }],
        }
        expect(filter.filterFun(node), 'node with priority >= 5').to.equal(true)

        const lowPriorityNode = new SKNode()
        lowPriorityNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'priority', num: 3 }],
        }
        expect(filter.filterFun(lowPriorityNode), 'node with priority < 5').to.equal(false)
    })

    it('rule: $score + 2 > 10', () => {
        const ruleString = '$score + 2 > 10'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        const node = new SKNode()
        node.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'score', num: 9 }],
        }
        expect(filter.filterFun(node), 'node where score + 2 > 10').to.equal(true)

        const nodeTooLow = new SKNode()
        nodeTooLow.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'score', num: 7 }],
        }
        expect(filter.filterFun(nodeTooLow), 'node where score + 2 <= 10').to.equal(false)
    })

    it('rule: #active || ( $load < 0.5 && ! #error )', () => {
        const ruleString = '#active || ( $load < 0.5 && ! $error )'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        const activeNode = new SKNode()
        activeNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'active' }],
        }
        expect(filter.filterFun(activeNode), 'active node').to.equal(true)

        const efficientNode = new SKNode()
        efficientNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'load', num: 0.3 }],
        }
        expect(filter.filterFun(efficientNode), 'efficient and not erroring').to.equal(true)

        const failingNode = new SKNode()
        failingNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'load', num: 0.3 }, { tag: 'error' }],
        }
        expect(filter.filterFun(failingNode), 'low load but with error').to.equal(false)
    })

    it('rule: ! #archived && ( $version = 2 || $version > 3 )', () => {
        const ruleString = '! #archived && ( $version = 2 || $version > 3 )'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        const matchingNode = new SKNode()
        matchingNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'version', num: 4 }],
        }
        expect(filter.filterFun(matchingNode), 'node not archived and version > 3').to.equal(true)

        const archivedNode = new SKNode()
        archivedNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'archived' }, { tag: 'version', num: 4 }],
        }
        expect(filter.filterFun(archivedNode), 'archived node').to.equal(false)

        const oldNode = new SKNode()
        oldNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'version', num: 1 }],
        }
        expect(filter.filterFun(oldNode), 'node with version < 2 and not archived').to.equal(false)
    })

    it('complex rule with all operators', () => {
        const ruleString =
            '(#active && !$disabled) || (($load + 2 * $scale - 1) / 3 >= 4 && $version != 0 && $version = 2)'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        // Matches via first part: #active && !$disabled
        const activeNode = new SKNode()
        activeNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'active' }],
        }
        expect(filter.filterFun(activeNode), 'matches first part with #active and no #disabled').to.equal(true)

        // Matches via second part (complex arithmetic/comparison)
        const numericMatchNode = new SKNode()
        numericMatchNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'load', num: 4 },
                { tag: 'scale', num: 3 }, // (4 + 2*3 - 1) / 3 = (4 + 6 - 1)/3 = 9/3 = 3 => 3 >= 4 is false
                { tag: 'version', num: 2 },
            ],
        }
        expect(filter.filterFun(numericMatchNode), 'arithmetic computes to 3, which is < 4').to.equal(false)

        const strongMatchNode = new SKNode()
        strongMatchNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'load', num: 5 },
                { tag: 'scale', num: 3 }, // (5 + 6 - 1)/3 = 10/3 ≈ 3.33 -> still < 4
                { tag: 'version', num: 2 },
            ],
        }
        expect(filter.filterFun(strongMatchNode), 'arithmetic computes to ~3.33, still < 4').to.equal(false)

        const passNode = new SKNode()
        passNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'load', num: 7 }, // 7 + 6 - 1 = 12 / 3 = 4
                { tag: 'scale', num: 3 },
                { tag: 'version', num: 2 },
            ],
        }
        expect(filter.filterFun(passNode), 'numeric expression evaluates to >= 4 and version = 2').to.equal(true)

        const negatedNode = new SKNode()
        negatedNode.properties = {
            'de.cau.cs.kieler.klighd.semanticFilter.tags': [
                { tag: 'active' },
                { tag: 'disabled' }, // this should negate the first clause
            ],
        }
        expect(filter.filterFun(negatedNode), 'has both #active and #disabled, so !#disabled fails').to.equal(false)
    })

    it('structural tag: $children and #children', () => {
        const ruleString = '$children >= 2'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        const node = new SKNode()
        node.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        const child1 = new SKNode()
        child1.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        const child2 = new SKNode()
        child2.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        node.children = [child1, child2]
        expect(filter.filterFun(node), 'node with 2 children').to.equal(true)
        expect(filter.filterFun(child1), 'node with 0 children').to.equal(false)

        const ruleString2 = '#children'
        const rule2 = parse(ruleString2)
        const filter2 = createFilter(rule2)
        expect(filter2.filterFun(node), 'node with 2 children').to.equal(true)
        expect(filter2.filterFun(child1), 'node with 0 children').to.equal(false)
    })

    it('structural tags: #isNode, #isEdge, #isPort, #isLabel', () => {
        const isNodeFilter = createFilter(parse('#isNode'))
        const isEdgeFilter = createFilter(parse('#isEdge'))
        const isPortFilter = createFilter(parse('#isPort'))
        const isLabelFilter = createFilter(parse('#isLabel'))

        const node = new SKNode()
        node.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        expect(isNodeFilter.filterFun(node), 'node is node').to.equal(true)

        const edge = new SKEdge()
        edge.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        expect(isEdgeFilter.filterFun(edge), 'edge is edge').to.equal(true)

        const port = new SKPort()
        port.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        expect(isPortFilter.filterFun(port), 'port is port').to.equal(true)

        const label = new SKLabel()
        label.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        expect(isLabelFilter.filterFun(label), 'label is label').to.equal(true)

        expect(isNodeFilter.filterFun(edge), 'node is not edge').to.equal(false)
        expect(isNodeFilter.filterFun(port), 'node is not port').to.equal(false)
        expect(isNodeFilter.filterFun(label), 'node is not label').to.equal(false)

        expect(isEdgeFilter.filterFun(node), 'edge is not node').to.equal(false)
        expect(isEdgeFilter.filterFun(port), 'edge is not port').to.equal(false)
        expect(isEdgeFilter.filterFun(label), 'edge is not label').to.equal(false)

        expect(isPortFilter.filterFun(node), 'port is not node').to.equal(false)
        expect(isPortFilter.filterFun(edge), 'port is not edge').to.equal(false)
        expect(isPortFilter.filterFun(label), 'port is not label').to.equal(false)

        expect(isLabelFilter.filterFun(node), 'label is not node').to.equal(false)
        expect(isLabelFilter.filterFun(edge), 'label is not edge').to.equal(false)
        expect(isLabelFilter.filterFun(port), 'label is not port').to.equal(false)
    })

    it('structural tag: $edgeDegree and #edgeDegree', () => {
        const ruleString = '$edgeDegree >= 1'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        const node = new SGraphImpl()
        node.type = 'graph'
        node.id = 'root'
        const child1 = new SKNode()
        child1.id = 'n1'
        child1.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        const child2 = new SKNode()
        child2.id = 'n2'
        child2.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        const edge = new SKEdge()
        edge.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        edge.targetId = 'n2'
        edge.sourceId = 'n1'
        node.add(child1)
        node.add(child2)
        child1.add(edge)

        const child3 = new SKNode()
        child3.id = 'n3'
        child3.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        node.add(child3)

        expect(filter.filterFun(child1), 'node with outgoing edge').to.equal(true)
        expect(filter.filterFun(child2), 'node with incoming edge').to.equal(true)
        expect(filter.filterFun(child3), 'node with no edges').to.equal(false)

        const ruleString2 = '#edgeDegree'
        const rule2 = parse(ruleString2)
        const filter2 = createFilter(rule2)
        expect(filter2.filterFun(child1), 'node with outgoing edge').to.equal(true)
        expect(filter2.filterFun(child2), 'node with incoming edge').to.equal(true)
        expect(filter2.filterFun(child3), 'node with no edges').to.equal(false)
    })

    it('structural tag: $inDegree and #inDegree', () => {
        const ruleString = '$inDegree >= 1'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        const node = new SGraphImpl()
        node.type = 'graph'
        node.id = 'root'
        const child1 = new SKNode()
        child1.id = 'n1'
        child1.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        const child2 = new SKNode()
        child2.id = 'n2'
        child2.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        const edge = new SKEdge()
        edge.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        edge.targetId = 'n2'
        edge.sourceId = 'n1'
        node.add(child1)
        node.add(child2)
        child1.add(edge)

        const child3 = new SKNode()
        child3.id = 'n3'
        child3.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        node.add(child3)

        expect(filter.filterFun(child1), 'node with outgoing edge').to.equal(false)
        expect(filter.filterFun(child2), 'node with incoming edge').to.equal(true)
        expect(filter.filterFun(child3), 'node with no edges').to.equal(false)

        const ruleString2 = '#inDegree'
        const rule2 = parse(ruleString2)
        const filter2 = createFilter(rule2)
        expect(filter2.filterFun(child1), 'node with outgoing edge').to.equal(false)
        expect(filter2.filterFun(child2), 'node with incoming edge').to.equal(true)
        expect(filter2.filterFun(child3), 'node with no edges').to.equal(false)
    })

    it('structural tag: $outDegree and #outDegree', () => {
        const ruleString = '$outDegree >= 1'
        const rule = parse(ruleString)
        const filter = createFilter(rule)

        const node = new SGraphImpl()
        node.type = 'graph'
        node.id = 'root'
        const child1 = new SKNode()
        child1.id = 'n1'
        child1.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        const child2 = new SKNode()
        child2.id = 'n2'
        child2.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        const edge = new SKEdge()
        edge.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        edge.targetId = 'n2'
        edge.sourceId = 'n1'
        node.add(child1)
        node.add(child2)
        child1.add(edge)

        const child3 = new SKNode()
        child3.id = 'n3'
        child3.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        node.add(child3)

        expect(filter.filterFun(child1), 'node with outgoing edge').to.equal(true)
        expect(filter.filterFun(child2), 'node with incoming edge').to.equal(false)
        expect(filter.filterFun(child3), 'node with no edges').to.equal(false)

        const ruleString2 = '#outDegree'
        const rule2 = parse(ruleString2)
        const filter2 = createFilter(rule2)
        expect(filter2.filterFun(child1), 'node with outgoing edge').to.equal(true)
        expect(filter2.filterFun(child2), 'node with incoming edge').to.equal(false)
        expect(filter2.filterFun(child3), 'node with no edges').to.equal(false)
    })
})
