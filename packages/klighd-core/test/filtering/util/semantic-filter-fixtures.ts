/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2026 by
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

import { SGraphImpl } from 'sprotty'
import { SKEdge, SKLabel, SKNode, SKPort } from '../../../src/skgraph-models'

const TAGS = 'de.cau.cs.kieler.klighd.semanticFilter.tags'

export function node(id?: string): SKNode {
    const n = new SKNode()
    n.id = id ?? crypto.randomUUID()
    n.properties = { [TAGS]: [] }
    return n
}

export function edge(sourceId: string, targetId: string): SKEdge {
    const e = new SKEdge()
    e.sourceId = sourceId
    e.targetId = targetId
    e.properties = { [TAGS]: [] }
    return e
}

export function port(): SKPort {
    const p = new SKPort()
    p.properties = { [TAGS]: [] }
    return p
}

export function label(): SKLabel {
    const l = new SKLabel()
    l.properties = { [TAGS]: [] }
    return l
}

export function graph(): SGraphImpl {
    const g = new SGraphImpl()
    g.type = 'graph'
    g.id = 'root'
    return g
}

export interface ChildrenFixture {
    graph: SGraphImpl
    parent: SKNode
    child1: SKNode
    child2: SKNode
}

export function createChildrenFixture(): ChildrenFixture {
    const g = graph()

    const parent = node('parent')
    const child1 = node('c1')
    const child2 = node('c2')

    g.add(parent)
    parent.add(child1)
    parent.add(child2)

    return {
        graph: g,
        parent,
        child1,
        child2,
    }
}

export interface ConnectedFixture {
    graph: SGraphImpl
    n1: SKNode
    n2: SKNode
    n3: SKNode
    edge: SKEdge
}

export function createConnectedFixture(): ConnectedFixture {
    const g = graph()

    const n1 = node('n1')
    const n2 = node('n2')
    const n3 = node('n3')

    g.add(n1)
    g.add(n2)
    g.add(n3)

    const e = edge('n1', 'n2')
    n1.add(e)

    return {
        graph: g,
        n1,
        n2,
        n3,
        edge: e,
    }
}

export interface SemanticHierarchyFixture {
    graph: SGraphImpl
    parent: SKNode
    child1: SKNode
    child2: SKNode
    child3: SKNode
    grandChild1: SKNode
    edge1: SKEdge
}

export function createSemanticHierarchyFixture(): SemanticHierarchyFixture {
    const g = graph()

    const parent = node('parent')

    const child1 = node('c1')
    child1.properties = {
        [TAGS]: [{ tag: 'someTag' }, { tag: 'score', num: 42 }],
    }

    const child2 = node('c2')

    const child3 = node('c3')
    child3.properties = {
        [TAGS]: [{ tag: 'score', num: 5 }],
    }

    const grandChild1 = node('gc1')
    grandChild1.properties = {
        [TAGS]: [{ tag: 'someTag' }],
    }

    const edge1 = edge('parent', 'parent')

    g.add(parent)

    parent.add(child1)
    parent.add(child2)
    parent.add(child3)

    child1.add(grandChild1)

    parent.add(edge1)

    return {
        graph: g,
        parent,
        child1,
        child2,
        child3,
        grandChild1,
        edge1,
    }
}

export interface SemanticTag {
    tag: string
    num?: number
}

export function taggedNode(tags: SemanticTag[]): SKNode {
    const n = new SKNode()
    n.properties = {
        [TAGS]: tags,
    }
    return n
}
