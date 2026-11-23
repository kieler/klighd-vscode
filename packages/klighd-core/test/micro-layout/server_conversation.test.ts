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
import { Bounds, Point } from 'sprotty-protocol'
import openMessageJson from './json/kgt-test-in.data'
import acceptMessageJson from './json/kgt-test-out.data'
import {
    KAreaPlacementData,
    KContainerRendering,
    KGridPlacement,
    KImage,
    KPointPlacementData,
    KRendering,
} from '../../src/skgraph-models'
import {
    calculateInsets,
    estimatePointPlacedChildSize,
    estimateSize,
    evaluateAreaPlacement,
} from '../../src/micro-layout/placement-util'
import { evaluateGridPlacement } from '../../src/micro-layout/gridplacement-util'
import { evaluateDecoratorPlacement, getDecoratorPlacementData } from '../../src/micro-layout/decorator-placement-util'
import { bounds, point } from './util/fixtures'
import { expectBounds, expectPoint } from './util/assertions'

interface GraphNode {
    id: string
    type: string
    size: { width: number; height: number }
    children?: GraphNode[]
    data?: Array<Record<string, unknown> | null>
    routingPoints?: Point[]
    properties?: Record<string, unknown>
}

interface Decoration {
    origin: Point
    bounds: Bounds
    rotation: number
}

interface OpenMessage {
    method: string
    params: {
        textDocument: {
            uri: string
            text: string
        }
    }
}

interface AcceptMessage {
    method: string
    params: {
        action: {
            kind: string
            newRoot: GraphNode
        }
    }
}

const openMessage = openMessageJson as unknown as OpenMessage
const acceptMessage = acceptMessageJson as unknown as AcceptMessage
const root = acceptMessage.params.action.newRoot

function allNodes(node: GraphNode, result: GraphNode[] = []): GraphNode[] {
    result.push(node)
    for (const child of node.children ?? []) {
        allNodes(child, result)
    }
    return result
}

function findNode(id: string): GraphNode {
    const node = allNodes(root).find((candidate) => candidate.id === id)
    if (!node) {
        throw new Error(`Missing node ${id}`)
    }
    return node
}

function nodeBounds(node: GraphNode): Bounds {
    return bounds(0, 0, node.size.width, node.size.height)
}

function firstRendering(node: GraphNode): KRendering {
    const rendering = node.data?.[0]
    if (!rendering) {
        throw new Error(`Missing rendering for ${node.id}`)
    }
    return rendering as unknown as KRendering
}

function serverBounds(rendering: unknown): Bounds {
    const { properties } = rendering as { properties?: Record<string, unknown> }
    const calculatedBounds = properties?.['klighd.lsp.calculated.bounds']
    if (!calculatedBounds) {
        throw new Error('Missing server calculated bounds')
    }
    return calculatedBounds as Bounds
}

function serverDecoration(rendering: unknown): Decoration {
    const { properties } = rendering as { properties?: Record<string, unknown> }
    const decoration = properties?.['klighd.lsp.calculated.decoration']
    if (!decoration) {
        throw new Error('Missing server calculated decoration')
    }
    return decoration as Decoration
}

describe('Micro Layout - Recorded Java server conversation', () => {
    it('links the opened kgt document to the returned diagram', () => {
        expect(openMessage.method).to.equal('textDocument/didOpen')
        expect(openMessage.params.textDocument.uri).to.contain('test.kgt')
        expect(openMessage.params.textDocument.text).to.contain('knode n1')
        expect(openMessage.params.textDocument.text).to.contain('knode twoSquares')

        expect(acceptMessage.method).to.equal('diagram/accept')
        expect(acceptMessage.params.action.kind).to.equal('updateModel')

        const nodeIds = allNodes(root).map((node) => node.id)
        for (const id of [
            '$root$Nn1',
            '$root$Nn2',
            '$root$Nn3',
            '$root$Nn2$Ni',
            '$root$Narc',
            '$root$NimageInJar',
            '$root$NimageInJar2',
            '$root$NimageInJarClipped',
            '$root$NimageURL',
            '$root$NimageLocalURI',
            '$root$NimageLocalRelativePath',
            '$root$NoffsetPorts',
            '$root$NtwoSquares',
            '$root$Nl',
            '$root$Nr1',
            '$root$Nr2',
            '$root$Ntriangle',
        ]) {
            expect(nodeIds, id).to.include(id)
        }
    })

    it('reproduces the server grid bounds and insets for node n2', () => {
        const node = findNode('$root$Nn2')
        const rendering = firstRendering(node) as KContainerRendering
        const size = nodeBounds(node)

        const placed = evaluateGridPlacement(
            rendering.childPlacement as KGridPlacement,
            rendering.children,
            size,
            rendering
        )

        expectBounds(placed[0], serverBounds(rendering.children[0]), 1e-4)
        expectBounds(placed[1], serverBounds(rendering.children[1]), 1e-4)

        const insets = { left: 0, right: 0, top: 0, bottom: 0 }
        calculateInsets(rendering, insets, size)
        expect(insets.left).to.be.closeTo(15, 1e-4)
        expect(insets.right).to.be.closeTo(0, 1e-4)
        expect(insets.top).to.be.closeTo(30, 1e-4)
        expect(insets.bottom).to.be.closeTo(0, 1e-4)
    })

    it('reproduces the server decorator placement of edge n1 -> n2', () => {
        const edge = findNode('$root$Nn1$$E0')
        const rendering = firstRendering(edge) as KContainerRendering
        const decorator = rendering.children[0]
        const placementData = getDecoratorPlacementData(decorator)
        expect(placementData).to.not.equal(null)

        const decoration = evaluateDecoratorPlacement(placementData, edge.routingPoints)
        const expected = serverDecoration(decorator)

        expectPoint(decoration.origin, expected.origin, 1e-4)
        expectBounds(decoration.bounds, expected.bounds, 1e-4)
        expect(decoration.rotation).to.be.closeTo(expected.rotation, 1e-4)
    })

    it('reproduces the server decorator placement of edge n1 -> n3', () => {
        const edge = findNode('$root$Nn1$$E1')
        const rendering = firstRendering(edge) as KContainerRendering
        const [textDecorator, rectangleDecorator] = rendering.children

        for (const decorator of [textDecorator, rectangleDecorator]) {
            const placementData = getDecoratorPlacementData(decorator)
            expect(placementData).to.not.equal(null)

            const decoration = evaluateDecoratorPlacement(placementData, edge.routingPoints)
            const expected = serverDecoration(decorator)

            expectPoint(decoration.origin, expected.origin, 1e-4)
            expectBounds(decoration.bounds, expected.bounds, 1e-4)
            expect(decoration.rotation).to.be.closeTo(expected.rotation, 1e-4)
        }
    })

    it('reproduces the server area placements with negative relative offsets', () => {
        const offsetPorts = findNode('$root$NoffsetPorts')
        const offsetPortsRendering = firstRendering(offsetPorts) as KContainerRendering
        const innerArea = offsetPortsRendering.children[0]
        expectBounds(
            evaluateAreaPlacement(innerArea.placementData as KAreaPlacementData, nodeBounds(offsetPorts)),
            serverBounds(innerArea),
            1e-4
        )

        const port = findNode('$root$NoffsetPorts$$P0')
        const portRendering = firstRendering(port)
        expectBounds(
            evaluateAreaPlacement(portRendering.placementData as KAreaPlacementData, nodeBounds(port)),
            serverBounds(portRendering),
            1e-4
        )

        const twoSquares = findNode('$root$NtwoSquares')
        const outer = firstRendering(twoSquares) as KContainerRendering
        expectBounds(
            evaluateAreaPlacement(outer.placementData as KAreaPlacementData, nodeBounds(twoSquares)),
            serverBounds(outer),
            1e-4
        )

        const inner = outer.children[0]
        expectBounds(
            evaluateAreaPlacement(inner.placementData as KAreaPlacementData, serverBounds(outer)),
            serverBounds(inner),
            1e-4
        )
    })

    it('reproduces the server point placement of the ellipse on edge n1 -> n3', () => {
        const edge = findNode('$root$Nn1$$E1')
        const rendering = firstRendering(edge) as KContainerRendering
        const ellipse = rendering.children[2]

        const estimate = estimatePointPlacedChildSize(ellipse, ellipse.placementData as KPointPlacementData)
        expectBounds(estimate, serverBounds(ellipse), 1e-4)
    })

    it('reproduces the server image and polygon sizes', () => {
        for (const id of [
            '$root$NimageInJar',
            '$root$NimageInJar2',
            '$root$NimageInJarClipped',
            '$root$NimageURL',
            '$root$NimageLocalURI',
            '$root$NimageLocalRelativePath',
        ]) {
            const node = findNode(id)
            const image = firstRendering(node) as KImage
            expectBounds(estimateSize(image, nodeBounds(node)), serverBounds(image), 1e-4)
        }

        const triangle = findNode('$root$Ntriangle')
        const polygon = firstRendering(triangle)
        expectBounds(estimateSize(polygon, nodeBounds(triangle)), serverBounds(polygon), 1e-4)
    })

    it('evaluates the server routing points as a polyline', () => {
        const edge = findNode('$root$Nn1$$E1')
        const points = edge.routingPoints ?? []
        expect(points).to.have.length(4)

        const midpoint = point(102.08333206176758, 230)
        const textDecorator = (firstRendering(edge) as KContainerRendering).children[0]
        const decoration = evaluateDecoratorPlacement(getDecoratorPlacementData(textDecorator), points)

        expectPoint(decoration.origin, midpoint, 1e-4)
        expectBounds(decoration.bounds, bounds(0, 0, 0, 0), 1e-4)
    })
})
