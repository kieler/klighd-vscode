/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019-2025 by
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
import { KGraphData, SKGraphElement } from '@kieler/klighd-interactive/lib/constraint-classes'
import {
    findParentByFeature,
    isBoundsAware,
    isViewport,
    SChildElementImpl,
    SModelElementImpl,
    SModelRootImpl,
} from 'sprotty'
import { Bounds } from 'sprotty-protocol'
import { isProxyRendering } from './proxy-view/proxy-view-util'
import {
    isContainerRendering,
    isPolyline,
    isRendering,
    isSKGraphElement,
    KPolyline,
    KRendering,
    K_POLYLINE,
    K_RENDERING_REF,
    SKEdge,
    SKLabel,
    SKNode,
    SKPort,
} from './skgraph-models'
/* global Element, SVGElement */

/**
 * Returns the SVG element in the DOM that represents the topmost KRendering in the hierarchy.
 * If an action should be triggered on the element, bubble up through the rendering hierarchy until the first actionable rendering..
 * @param target The graph element the event is triggered on.
 * @param element The topmost SVG element clicked.
 * @param actionable Optional parameter to search for actionable renderings only. Defaults to false.
 */
export function getSemanticElement(
    target: SKGraphElement,
    element: EventTarget | null,
    actionable = false
): SVGElement | undefined {
    if (!(element instanceof SVGElement)) {
        return undefined
    }
    let currentElement: Element | null = element
    let semanticElement
    while (semanticElement === undefined && currentElement instanceof SVGElement) {
        // Check if the rendering has an action.
        let renderingHasAction = true
        if (currentElement.id !== '' && actionable) {
            const rendering = findRendering(target, currentElement)
            if (!rendering) {
                // If no rendering for this ID exists, we have gone too far up to the next graph element. Skip from here.
                return undefined
            }
            if (!hasAction(rendering)) {
                renderingHasAction = false
            }
        }
        // Choose this element if it is a defined element with an ID.
        // Also only use this if there is an action and we look for an actionable rendering (action => renderingHasAction)
        if (currentElement.id !== '' && (!actionable || renderingHasAction)) {
            semanticElement = currentElement
        } else {
            currentElement = currentElement.parentElement
        }
    }
    return semanticElement
}

/**
 * Returns if there is a KLighD action defined on the given rendering that needs to be handled.
 *
 * @param rendering the rendering that may define an action to be executed.
 * @param includeChildren if this should also search for actions in any of the rendering's children.
 *   Defaults to false.
 * @returns if there is at least one action for this rendering.
 */
export function hasAction(rendering: KRendering, includeChildren = false): boolean {
    if (rendering.actions && rendering.actions.length !== 0) {
        return true
    }
    if (includeChildren && isContainerRendering(rendering)) {
        for (const child of rendering.children) {
            if (hasAction(child, includeChildren)) {
                return true
            }
        }
        if (isPolyline(rendering)) {
            if (hasAction(rendering.junctionPointRendering, includeChildren)) {
                return true
            }
        }
    }
    return false
}

/**
 * Finds the KRendering in the data of the SKGraphElement that matches the given ID.
 * @param graphElement The graph element to look in.
 * @param svgElement The SVG element that represents the rendering.
 */
export function findRendering(graphElement: SKGraphElement, svgElement: SVGElement): KRendering | undefined {
    const isProxy = isProxyRendering(svgElement, graphElement.id)
    const svgId = svgElement.id

    // The first rendering has to be extracted from the SKGraphElement. It is the first data object that is a KRendering.
    let data: KGraphData[] | undefined
    if (isProxy) {
        // For a proxy, the rendering may be in the graph element's properties.
        data = graphElement.properties['de.cau.cs.kieler.klighd.proxyView.proxyRendering'] as KGraphData[]
    }
    if (data === undefined) {
        // Non-proxies and proxies without an explicit proxy rendering just use the graph element's data.
        data = graphElement.data
    }
    let currentElement: KRendering = data.find((possibleRendering) => isRendering(possibleRendering)) as KRendering
    // The real rendering ID starts after the graph element ID prefix, delimited by a $$$.
    const renderingId = svgId.split('$$$')[1] ?? svgId
    if (renderingId === undefined) {
        return undefined
    }
    const idPath = renderingId.split('$')
    if (currentElement.type === K_RENDERING_REF) {
        // KRenderingRefs' ids always start with the identifying name of the reference and may continue with $<something> to refer to renderings within that reference.
        // Start with index 1 since the currentElement already contains the rendering with the identifying name.
        // for (let i = 1; i < idPath.length; i++) {
        // TODO:looking up renderings in rendering references is not supported yet.
        return undefined
    }
    // The rendering id is build hierarchically and the first rendering is already found, so start with index 1 as a $ sign can be skipped.
    for (let i = 1; i < idPath.length; i++) {
        let nextElement
        if (isContainerRendering(currentElement)) {
            // First, look for the ID in the child renderings.
            nextElement = currentElement.children.find((childRendering) =>
                svgId.startsWith(childRendering.properties['klighd.lsp.rendering.id'] as string)
            ) as KRendering
        }
        if (nextElement === undefined && currentElement.type === K_POLYLINE) {
            // If the rendering was not found yet, take the junction point rendering.
            if (
                svgId.startsWith(
                    (currentElement as KPolyline).junctionPointRendering.properties['klighd.lsp.rendering.id'] as string
                )
            ) {
                nextElement = (currentElement as KPolyline).junctionPointRendering
            }
        }
        if (nextElement === undefined) {
            // This ID does not exist in the renderings, therefore does not belong to them.
            return undefined
        }
        currentElement = nextElement
    }

    // Now the currentElement should be the element searched for by the id.
    if ((currentElement.properties['klighd.lsp.rendering.id'] as string) !== svgId) {
        console.error(
            `The found element does not match the searched id! id: ${svgId}, found element: ${currentElement}`
        )
        return undefined
    }
    return currentElement
}

/**
 * Finds the SKGraphElement that matches the given ID.
 * @param root The root.
 * @param id The ID to search for.
 * @returns The element matching the given id or `undefined` if there is none.
 */
export function getElementByID(root: SModelRootImpl, id: string, suppressErrors = false): SKGraphElement | undefined {
    let curr = root as unknown as SKGraphElement
    const idPath = id.split('$')
    // The node id is build hierarchically and the root is already given, so start with i=1 ($root)
    for (let i = 1; i < idPath.length && curr; i++) {
        // $$ in id (e.g. comments in sccharts)
        if (idPath[i].length > 0) {
            const nextType = idPath[i].charAt(0)
            if (nextType === 'E') {
                // Edge
                curr = ((curr as SKNode | SKPort).outgoingEdges as SKEdge[]).find((edge) =>
                    id.startsWith(edge.id)
                ) as SKEdge
            } else if (['N', 'L', 'P'].includes(nextType) || idPath[i] === 'root') {
                // Node, label or port
                curr = curr.children.find((node) => id.startsWith(node.id)) as SKNode | SKLabel | SKPort
            }
        }
    }

    // Now currNode should be the node searched for by the id
    if (!curr) {
        if (!suppressErrors) {
            console.error('No node found matching the id:', id)
        }
        return undefined
    }
    if (curr.id !== id) {
        if (!suppressErrors) {
            console.error('The found node does not match the searched id! id:', id, ', found node:', curr)
        }
        return undefined
    }

    return curr
}

/**
 * Get the absolute bounds of the graph element with respect to the SVG canvas root, also using top-down scale factors.
 * This SVG canvas also includes the entire SVG and does not incoperate the viewport. This is different from Sprotty's canvas,
 * which we would call viewport.
 * Expects that this function has been called on the parent element before to work correctly.
 * @param element The element to check and persist the bounds information
 * @returns the element's bounds w.r.t the canvas. Adds `absoluteX`, `absoluteY`, and `absoluteScale` properties to this element.
 */
export function getCanvasBounds(element: SModelElementImpl): Bounds {
    // to avoid continuous looping up to the root, persist the scale and bounds in the properties.
    // we expect that getAbsoluteBounds has been called on the parent previously and parent bounds are persisted.

    const boundsElement = findParentByFeature(element, isBoundsAware)
    // base case for the root node.
    if (boundsElement instanceof SKNode && boundsElement.root === boundsElement.parent) {
        boundsElement.properties.absoluteScale = 1
        boundsElement.properties.absoluteX = boundsElement.bounds.x
        boundsElement.properties.absoluteY = boundsElement.bounds.y
        return boundsElement.bounds
    }
    // other nodes calculate their absolute bounds relative to their parent.
    if (boundsElement !== undefined && boundsElement instanceof SChildElementImpl && isSKGraphElement(boundsElement)) {
        const { bounds } = boundsElement
        // This needs to be the parent KNode
        let { parent } = boundsElement
        while (!(parent instanceof SKNode) && parent instanceof SChildElementImpl) {
            parent = parent.parent
        }
        let scaleFactor = 1
        let parentScale = 1
        if (isSKGraphElement(parent)) {
            scaleFactor = (parent.properties['org.eclipse.elk.topdown.scaleFactor'] as number) ?? 1
            parentScale = (parent.properties.absoluteScale as number) ?? 1
        }
        const absoluteScale = parentScale * scaleFactor
        boundsElement.properties.absoluteScale = absoluteScale

        if (isSKGraphElement(boundsElement) && isSKGraphElement(parent)) {
            boundsElement.properties.absoluteX =
                ((parent.properties.absoluteX as number) ?? 0) + bounds.x * absoluteScale
            boundsElement.properties.absoluteY =
                ((parent.properties.absoluteY as number) ?? 0) + bounds.y * absoluteScale
        }

        return {
            x: (boundsElement.properties.absoluteX as number) ?? 0,
            y: (boundsElement.properties.absoluteY as number) ?? 0,
            width: bounds.width * absoluteScale,
            height: bounds.height * absoluteScale,
        }
    }
    if (element instanceof SModelRootImpl) {
        const { canvasBounds } = element
        return { x: 0, y: 0, width: canvasBounds.width, height: canvasBounds.height }
    }
    return Bounds.EMPTY
}

/**
 * Get the absolute bounds of the graph element with respect to the viewport, also using top-down scale factors.
 * Expects that this (or the getViewportBounds) function has been called on the parent element before to work correctly.
 * @param element The element to check and persist the bounds information
 * @returns the element's bounds w.r.t the viewport. Adds `absoluteX`, `absoluteY`, and `absoluteScale` properties to this element.
 */
export function getViewportBounds(element: SModelElementImpl): Bounds {
    const canvasBounds = getCanvasBounds(element)

    const boundsElement = findParentByFeature(element, isBoundsAware)
    if (boundsElement !== undefined && boundsElement instanceof SChildElementImpl && isSKGraphElement(boundsElement)) {
        const { scroll, zoom } = findParentByFeature(boundsElement, isViewport) ?? { scroll: { x: 0, y: 0 }, zoom: 1 }
        return {
            x: (canvasBounds.x - scroll.x) * zoom,
            y: (canvasBounds.y - scroll.y) * zoom,
            width: canvasBounds.width * zoom,
            height: canvasBounds.height * zoom,
        }
    }
    return canvasBounds
}
