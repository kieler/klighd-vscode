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
import { createSemanticFilter } from '../../src/filtering/util'
import { SKEdge, SKLabel, SKNode, SKPort } from '../../src/skgraph-models'

describe('reserved tags and lists tests', () => {
    it('$children and #children list evaluation', () => {
        const ruleString = '$children >= 2'
        const filter = createSemanticFilter(ruleString)

        const root = new SGraphImpl()
        root.type = 'graph'
        root.id = 'root'
        const node = new SKNode()
        node.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        const child1 = new SKNode()
        child1.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        const child2 = new SKNode()
        child2.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        root.add(node)
        node.add(child1)
        node.add(child2)
        expect(filter(node), 'node with 2 children').to.equal(true)
        expect(filter(child1), 'node with 0 children').to.equal(false)

        const ruleString2 = '#children'
        const filter2 = createSemanticFilter(ruleString2)
        expect(filter2(node), 'node with 2 children').to.equal(true)
        expect(filter2(child1), 'node with 0 children').to.equal(false)
    })

    it('#isNode, #isEdge, #isPort, #isLabel', () => {
        const isNodeFilter = createSemanticFilter('#isNode')
        const isEdgeFilter = createSemanticFilter('#isEdge')
        const isPortFilter = createSemanticFilter('#isPort')
        const isLabelFilter = createSemanticFilter('#isLabel')

        const node = new SKNode()
        node.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        expect(isNodeFilter(node), 'node is node').to.equal(true)

        const edge = new SKEdge()
        edge.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        expect(isEdgeFilter(edge), 'edge is edge').to.equal(true)

        const port = new SKPort()
        port.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        expect(isPortFilter(port), 'port is port').to.equal(true)

        const label = new SKLabel()
        label.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
        expect(isLabelFilter(label), 'label is label').to.equal(true)

        expect(isNodeFilter(edge), 'node is not edge').to.equal(false)
        expect(isNodeFilter(port), 'node is not port').to.equal(false)
        expect(isNodeFilter(label), 'node is not label').to.equal(false)

        expect(isEdgeFilter(node), 'edge is not node').to.equal(false)
        expect(isEdgeFilter(port), 'edge is not port').to.equal(false)
        expect(isEdgeFilter(label), 'edge is not label').to.equal(false)

        expect(isPortFilter(node), 'port is not node').to.equal(false)
        expect(isPortFilter(edge), 'port is not edge').to.equal(false)
        expect(isPortFilter(label), 'port is not label').to.equal(false)

        expect(isLabelFilter(node), 'label is not node').to.equal(false)
        expect(isLabelFilter(edge), 'label is not edge').to.equal(false)
        expect(isLabelFilter(port), 'label is not port').to.equal(false)
    })

    it('$adjacents and #adjacents', () => {
        const ruleString = '$adjacents >= 1'
        const filter = createSemanticFilter(ruleString)

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

        expect(filter(child1), 'node with outgoing edge').to.equal(true)
        expect(filter(child2), 'node with incoming edge').to.equal(true)
        expect(filter(child3), 'node with no edges').to.equal(false)

        const ruleString2 = '#adjacents'
        const filter2 = createSemanticFilter(ruleString2)
        expect(filter2(child1), 'node with outgoing edge').to.equal(true)
        expect(filter2(child2), 'node with incoming edge').to.equal(true)
        expect(filter2(child3), 'node with no edges').to.equal(false)
    })

    it('$incoming and #incoming', () => {
        const ruleString = '$incoming >= 1'
        const filter = createSemanticFilter(ruleString)

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

        expect(filter(child1), 'node with outgoing edge').to.equal(false)
        expect(filter(child2), 'node with incoming edge').to.equal(true)
        expect(filter(child3), 'node with no edges').to.equal(false)

        const ruleString2 = '#incoming'
        const filter2 = createSemanticFilter(ruleString2)
        expect(filter2(child1), 'node with outgoing edge').to.equal(false)
        expect(filter2(child2), 'node with incoming edge').to.equal(true)
        expect(filter2(child3), 'node with no edges').to.equal(false)
    })

    it('$outgoing and #outgoing', () => {
        const ruleString = '$outgoing >= 1'
        const filter = createSemanticFilter(ruleString)

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

        expect(filter(child1), 'node with outgoing edge').to.equal(true)
        expect(filter(child2), 'node with incoming edge').to.equal(false)
        expect(filter(child3), 'node with no edges').to.equal(false)

        const ruleString2 = '#outgoing'
        const filter2 = createSemanticFilter(ruleString2)
        expect(filter2(child1), 'node with outgoing edge').to.equal(true)
        expect(filter2(child2), 'node with incoming edge').to.equal(false)
        expect(filter2(child3), 'node with no edges').to.equal(false)
    })
})
