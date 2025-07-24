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

import { expect } from 'chai'
import { describe, it } from 'mocha'
import { SGraphImpl } from 'sprotty'
import { createSemanticFilter } from '../../src/filtering/util'
import { SKEdge, SKNode } from '../../src/skgraph-models'

// Construct test graph
const root = new SGraphImpl()
root.type = 'graph'
root.id = 'root'

const parent = new SKNode()
parent.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
parent.id = 'parent'
root.add(parent)

const child1 = new SKNode()
child1.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'someTag' }, { tag: 'score', num: 42 }] }
child1.id = 'c1'
parent.add(child1)

const child2 = new SKNode()
child2.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
child2.id = 'c2'
parent.add(child2)

const child3 = new SKNode()
child3.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'score', num: 5 }] }
parent.add(child3)

const grandChild1 = new SKNode()
grandChild1.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [{ tag: 'someTag' }] }
child1.add(grandChild1)

const edge1 = new SKEdge()
edge1.properties = { 'de.cau.cs.kieler.klighd.semanticFilter.tags': [] }
edge1.sourceId = 'parent'
edge1.targetId = 'parent'
parent.add(edge1)

describe('semantic filtering - list-based quantifiers and scoping', () => {
    it('evaluates exists with implicit scoping', () => {
        const rule = `exists[x:children|#someTag]`
        const filter = createSemanticFilter(rule)
        expect(filter(parent), 'should match at least one child with #someTag').to.equal(true)
    })

    it('evaluates exists with explicit scoping', () => {
        const rule = `exists[x:children|x<#someTag>]`
        const filter = createSemanticFilter(rule)
        expect(filter(parent), 'should match at least one child with #someTag').to.equal(true)
    })

    it('evaluates forall with implicit scoping', () => {
        const rule = `forall[x:children|#someTag]`
        const filter = createSemanticFilter(rule)
        expect(filter(parent), 'should fail if not all children match').to.equal(false)
    })

    it('evaluates forall with explicit scoping', () => {
        const rule = `forall[x:children|x<#someTag>]`
        const filter = createSemanticFilter(rule)
        expect(filter(parent), 'should fail if not all children match').to.equal(false)
    })

    it('evaluates nested list comprehensions', () => {
        const rule = `exists[x:children|exists[y:children|#someTag]]`
        const filter = createSemanticFilter(rule)
        expect(filter(parent), 'child has grandchild with #someTag').to.equal(true)
    })

    it('evaluates disjunction under implicit scope', () => {
        const rule = `#someTag || #nonexistent`
        const filter = createSemanticFilter(rule)
        expect(filter(child1), 'has someTag').to.equal(true)
        expect(filter(child2), 'has no tags').to.equal(false)
    })

    it('supports numeric expressions with tags', () => {
        const rule = `$score > 40`
        const filter = createSemanticFilter(rule)
        expect(filter(child1), 'score should be greater than 40').to.equal(true)
    })

    it('supports arithmetic with scoped numeric tags', () => {
        const rule = `exists[x:children|$score + 5 = 10]`
        const filter = createSemanticFilter(rule)
        expect(filter(parent), 'arithmetic expression with scoped tag').to.equal(true)
    })

    it('detect self loops', () => {
        const rule = `exists[x:self|#[y:adjacents|x = y]]`
        const filter = createSemanticFilter(rule)
        expect(filter(parent), 'node with a self loop').to.equal(true)
        expect(filter(child1), 'node with no self loop').to.equal(false)
        const ruleSimple = `exists[x:adjacents|x=this]`
        const filterSimple = createSemanticFilter(ruleSimple)
        expect(filterSimple(parent), 'node with a self loop').to.equal(true)
        expect(filterSimple(child1), 'node with no self loop').to.equal(false)
    })

    it('number of children that are nodes', () => {
        const rule = `$[x:children|#isNode] = 3`
        const filter = createSemanticFilter(rule)
        expect(filter(parent), 'node with 3 children').to.equal(true)
        expect(filter(child1), 'node with less than 3 children').to.equal(false)
    })
})
