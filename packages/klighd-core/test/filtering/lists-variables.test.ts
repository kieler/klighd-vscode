/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2025-2026 by
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

import { createSemanticHierarchyFixture } from './util/semantic-filter-fixtures'

import { expectRule } from './util/semantic-filter-test-util'

describe('semantic filtering - list-based quantifiers and scoping', () => {
    it('evaluates exists with implicit scoping', () => {
        // Given
        const { parent } = createSemanticHierarchyFixture()

        // Then
        expectRule('exists[x:children|#someTag]', parent, true, 'should match at least one child with #someTag')
    })

    it('evaluates exists with explicit scoping', () => {
        // Given
        const { parent } = createSemanticHierarchyFixture()

        // Then
        expectRule('exists[x:children|x<#someTag>]', parent, true, 'should match at least one child with #someTag')
    })

    it('evaluates forall with implicit scoping', () => {
        // Given
        const { parent } = createSemanticHierarchyFixture()

        // Then
        expectRule('forall[x:children|#someTag]', parent, false, 'not all children match')
    })

    it('evaluates forall with explicit scoping', () => {
        // Given
        const { parent } = createSemanticHierarchyFixture()

        // Then
        expectRule('forall[x:children|x<#someTag>]', parent, false, 'not all children match')
    })

    it('evaluates nested list comprehensions', () => {
        // Given
        const { parent } = createSemanticHierarchyFixture()

        // Then
        expectRule('exists[x:children|exists[y:children|#someTag]]', parent, true, 'child has grandchild with #someTag')
    })

    it('evaluates disjunction under implicit scope', () => {
        // Given
        const { child1, child2 } = createSemanticHierarchyFixture()

        // Then
        expectRule('#someTag || #nonexistent', child1, true, 'has someTag')

        expectRule('#someTag || #nonexistent', child2, false, 'has no tags')
    })

    it('supports numeric expressions with tags', () => {
        // Given
        const { child1 } = createSemanticHierarchyFixture()

        // Then
        expectRule('$score > 40', child1, true, 'score should be greater than 40')
    })

    it('supports arithmetic with scoped numeric tags', () => {
        // Given
        const { parent } = createSemanticHierarchyFixture()

        // Then
        expectRule('exists[x:children|$score + 5 = 10]', parent, true, 'arithmetic expression with scoped tag')
    })

    it('detects self loops', () => {
        // Given
        const { parent, child1 } = createSemanticHierarchyFixture()

        // Then
        expectRule('exists[x:self|#[y:adjacents|x = y]]', parent, true, 'node with a self loop')

        expectRule('exists[x:self|#[y:adjacents|x = y]]', child1, false, 'node with no self loop')

        expectRule('exists[x:adjacents|x=this]', parent, true, 'simple self loop detection')

        expectRule('exists[x:adjacents|x=this]', child1, false, 'simple negative self loop detection')
    })

    it('counts children matching a predicate', () => {
        // Given
        const { parent, child1 } = createSemanticHierarchyFixture()

        // Then
        expectRule('$[x:children|#isNode] = 3', parent, true, 'node with 3 children')

        expectRule('$[x:children|#isNode] = 3', child1, false, 'node with less than 3 children')
    })
})
