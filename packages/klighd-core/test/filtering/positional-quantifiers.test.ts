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
import { SKEdge, SKNode } from '../../src/skgraph-models'

const baseRule = '#someTag'

// common test graph
const root = new SGraphImpl()
root.type = 'graph'
root.id = 'root'

const parent = new SKNode()
parent.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
root.add(parent)

const child1 = new SKNode()
child1.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'someTag' }] }
child1.id = 'c1'
parent.add(child1)

const child2 = new SKNode()
child2.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
child2.id = 'c2'
parent.add(child2)

const child3 = new SKNode()
child3.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
child3.id = 'c3'
parent.add(child3)

const grandChild1 = new SKNode()
grandChild1.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
child1.add(grandChild1)

const grandChild2 = new SKNode()
grandChild2.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
child1.add(grandChild2)

const grandChild3 = new SKNode()
grandChild3.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'someTag' }] }
child2.add(grandChild3)

const grandChild4 = new SKNode()
grandChild4.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'someTag' }] }
child2.add(grandChild4)

const grandChild5 = new SKNode()
grandChild5.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'someTag' }] }
grandChild5.id = 'gc5'
child3.add(grandChild5)

const grandChild6 = new SKNode()
grandChild6.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'someTag' }] }
grandChild6.id = 'gc6'
child3.add(grandChild6)

const grandChild7 = new SKNode()
grandChild7.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
grandChild7.id = 'gc7'
child3.add(grandChild7)

const edge1 = new SKEdge()
edge1.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
edge1.sourceId = 'c1'
edge1.targetId = 'c2'
child1.add(edge1)

const edge2 = new SKEdge()
// this edge is a sibling of gc3 and gc4 and a child of c2
edge2.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'someTag' }] }
edge2.sourceId = 'c2'
edge2.targetId = 'c3'
child2.add(edge2)

const edge3 = new SKEdge()
// this edge is a sibling of gc5 - gc7 and a child of c3
edge3.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'someTag' }] }
edge3.sourceId = 'c3'
edge3.targetId = 'c1'
child3.add(edge3)

const edge4 = new SKEdge()
edge4.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
edge4.sourceId = 'gc5'
edge4.targetId = 'gc6'
grandChild5.add(edge4)

const edge5 = new SKEdge()
edge5.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
edge5.sourceId = 'gc6'
edge5.targetId = 'gc7'
grandChild6.add(edge5)

const edge6 = new SKEdge()
edge6.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
edge6.sourceId = 'gc7'
edge6.targetId = 'gc5'
grandChild7.add(edge6)

describe('positional quantifier evaluation', () => {
    it('self quantifier', () => {
        const filter = createSemanticFilter(baseRule)
        expect(filter(child1), 'implicit self quantifier').to.equal(true)

        const ruleString2 = `~[${baseRule}]`
        const filter2 = createSemanticFilter(ruleString2)
        expect(filter2(child1), 'explicit self quantifier').to.equal(true)
    })

    it('parent quantifier', () => {
        const ruleShort = `~p[${baseRule}]`
        const filterShort = createSemanticFilter(ruleShort)
        expect(filterShort(grandChild1), 'short form of parent quantifier if parent contains tag').to.equal(true)
        expect(filterShort(grandChild3), 'short form of parent quantifier if parent does not contain tag').to.equal(
            false
        )

        const ruleLong = `~parent[${baseRule}]`
        const filterLong = createSemanticFilter(ruleLong)
        expect(filterLong(grandChild1), 'long form of parent quantifier if parent contains tag').to.equal(true)
        expect(filterLong(grandChild3), 'long form of parent quantifier if parent does not contain tag').to.equal(false)
    })

    it('child and children quantifiers', () => {
        const ruleShortChild = `~c[${baseRule}]`
        const filterShortChild = createSemanticFilter(ruleShortChild)
        expect(filterShortChild(parent), 'short form of child quantifier if any child contains tag').to.equal(true)
        expect(filterShortChild(child1), 'short form of child quantifier if no child contains tag').to.equal(false)

        const ruleLongChild = `~child[${baseRule}]`
        const filterLongChild = createSemanticFilter(ruleLongChild)
        expect(filterLongChild(parent), 'long form of child quantifier if any child contains tag').to.equal(true)
        expect(filterLongChild(child1), 'long form of child quantifier if no child contains tag').to.equal(false)

        const ruleShortChildren = `~cs[${baseRule}]`
        const filterShortChildren = createSemanticFilter(ruleShortChildren)
        expect(filterShortChildren(child2), 'short form of children quantifier if all children contain tag').to.equal(
            true
        )
        expect(filterShortChildren(parent), 'short form of children quantifier if 1/2 child contains tag').to.equal(
            false
        )

        const ruleLongChildren = `~children[${baseRule}]`
        const filterLongChildren = createSemanticFilter(ruleLongChildren)
        expect(filterLongChildren(child2), 'long form of child quantifier if all children contain tag').to.equal(true)
        expect(filterLongChildren(parent), 'long form of child quantifier if 1/2 child contains tag').to.equal(false)
    })

    it('sibling and siblings quantifiers', () => {
        const ruleShortSibling = `~s[${baseRule}]`
        const filterShortSibling = createSemanticFilter(ruleShortSibling)
        expect(filterShortSibling(child2), 'short form of sibling quantifier if any sibling contains tag').to.equal(
            true
        )
        expect(filterShortSibling(child1), 'short form of sibling quantifier if no sibling contains tag').to.equal(
            false
        )

        const ruleLongSibling = `~sibling[${baseRule}]`
        const filterLongSibling = createSemanticFilter(ruleLongSibling)
        expect(filterLongSibling(child2), 'long form of sibling quantifier if any sibling contains tag').to.equal(true)
        expect(filterLongSibling(child1), 'long form of sibling quantifier if no sibling contains tag').to.equal(false)

        const ruleShortSiblings = `~ss[${baseRule}]`
        const filterShortSiblings = createSemanticFilter(ruleShortSiblings)
        expect(
            filterShortSiblings(grandChild7),
            'short form of siblings quantifier if all siblings contain tag'
        ).to.equal(true)
        expect(
            filterShortSiblings(grandChild5),
            'short form of siblings quantifier if 1/2 siblings contains tag'
        ).to.equal(false)

        const ruleLongSiblings = `~siblings[${baseRule}]`
        const filterLongSiblings = createSemanticFilter(ruleLongSiblings)
        expect(
            filterLongSiblings(grandChild7),
            'short form of siblings quantifier if all siblings contain tag'
        ).to.equal(true)
        expect(
            filterLongSiblings(grandChild5),
            'short form of siblings quantifier if 1/2 siblings contains tag'
        ).to.equal(false)
    })

    it('adjacent and adjacents quantifiers', () => {
        const ruleShortAdjacent = `~a[${baseRule}]`
        const filterShortAdjacent = createSemanticFilter(ruleShortAdjacent)
        expect(
            filterShortAdjacent(grandChild6),
            'short form of adjacent quantifier if any adjacent contains tag'
        ).to.equal(true)
        expect(filterShortAdjacent(child1), 'short form of adjacent quantifier if no adjacent contains tag').to.equal(
            false
        )

        const ruleLongAdjacent = `~adjacent[${baseRule}]`
        const filterLongAdjacent = createSemanticFilter(ruleLongAdjacent)
        expect(
            filterLongAdjacent(grandChild6),
            'long form of adjacent quantifier if any adjacent contains tag'
        ).to.equal(true)
        expect(filterLongAdjacent(child1), 'long form of adjacent quantifier if no adjacent contains tag').to.equal(
            false
        )

        const ruleShortAdjacents = `~as[${baseRule}]`
        const filterShortAdjacents = createSemanticFilter(ruleShortAdjacents)
        expect(
            filterShortAdjacents(grandChild7),
            'short form of adjacents quantifier if all adjacents contain tag'
        ).to.equal(true)
        expect(
            filterShortAdjacents(grandChild5),
            'short form of siblings quantifier if 1/2 siblings contains tag'
        ).to.equal(false)

        const ruleLongAdjacents = `~as[${baseRule}]`
        const filterLongAdjacents = createSemanticFilter(ruleLongAdjacents)
        expect(
            filterLongAdjacents(grandChild7),
            'long form of adjacents quantifier if all adjacents contain tag'
        ).to.equal(true)
        expect(
            filterLongAdjacents(grandChild5),
            'long form of siblings quantifier if 1/2 siblings contains tag'
        ).to.equal(false)
    })
})
