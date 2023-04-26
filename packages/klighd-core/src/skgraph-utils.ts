/*
* KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
*
* http://rtsys.informatik.uni-kiel.de/kieler
*
* Copyright 2019-2022 by
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
import { SModelRoot } from 'sprotty'
import { isProxyRendering } from './proxy-view/proxy-view-util'
import { isContainerRendering, isPolyline, isRendering, KPolyline, KRendering, K_POLYLINE, K_RENDERING_REF, SKEdge, SKLabel, SKNode, SKPort } from './skgraph-models'

/**
 * Returns the SVG element in the DOM that represents the topmost KRendering in the hierarchy.
 * If an action should be triggered on the element, bubble up through the rendering hierarchy until the first actionable rendering..
 * @param target The graph element the event is triggered on.
 * @param element The topmost SVG element clicked.
 * @param actionable Optional parameter to search for actionable renderings only. Defaults to false.
 */
export function getSemanticElement(target: SKGraphElement, element: EventTarget | null, actionable = false): SVGElement | undefined {
    if (!(element instanceof SVGElement)) {
        return undefined
    }
    let currentElement: Element | null = element
    let semanticElement = undefined
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
    const renderingId = svgElement.id

    // The first rendering has to be extracted from the SKGraphElement. It is the first data object that is a KRendering.
    let data: KGraphData[] | undefined
    if (isProxy) {
        // For a proxy, the rendering may be in the graph element's properties.
        data = graphElement.properties['de.cau.cs.kieler.klighd.proxyView.proxyRendering'] as KGraphData[]
    }
    if (data == undefined) {
        // Non-proxies and proxies without an explicit proxy rendering just use the graph element's data.
        data = graphElement.data
    }
    let currentElement: KRendering = data.find(possibleRendering => {
        return isRendering(possibleRendering)
    }) as KRendering
    const idPath = renderingId.split('$')
    if (currentElement.type === K_RENDERING_REF) {
        // KRenderingRefs' ids always start with the identifying name of the reference and may continue with $<something> to refer to renderings within that reference.
        // Start with index 1 since the currentElement already contains the rendering with the identifying name.
        // for (let i = 1; i < idPath.length; i++) {
        if (idPath.length > 1) {
            console.error('looking up renderings in rendering references is not supported yet.')
            return
        }
    } else {
        // The rendering id is build hierarchically and the first rendering is already found, so start with index 1 as a $ sign can be skipped.
        for (let i = 1; i < idPath.length; i++) {
            let nextElement
            if (isContainerRendering(currentElement)) {
                // First, look for the ID in the child renderings.
                nextElement = currentElement.children.find(childRendering => {
                    return renderingId.startsWith(childRendering.properties['klighd.lsp.rendering.id'] as string)
                }) as KRendering
            }
            if (nextElement === undefined && currentElement.type === K_POLYLINE) {
                // If the rendering was not found yet, take the junction point rendering.
                if (renderingId.startsWith((currentElement as KPolyline).junctionPointRendering.properties['klighd.lsp.rendering.id'] as string)) {
                    nextElement = (currentElement as KPolyline).junctionPointRendering
                }
            } if (nextElement === undefined) {
                // This ID does not exist in the renderings, therefore does not belong to them.
                return undefined
            }
            currentElement = nextElement
        }
    }
    // Now the currentElement should be the element searched for by the id.
    if (currentElement.properties['klighd.lsp.rendering.id'] as string !== renderingId) {
        console.error('The found rendering does not match the searched id! id: ' + renderingId + ', found element: ' + currentElement)
        return
    }
    return currentElement
}

/**
 * Finds the SKGraphElement that matches the given ID.
 * @param root The root.
 * @param id The ID to search for.
 * @returns The element matching the given id or `undefined` if there is none.
 */
export function getElementByID(root: SModelRoot, id: string, suppressErrors = false): SKGraphElement | undefined {
    let curr = root as unknown as SKGraphElement;
    const idPath = id.split('$');
    // The node id is build hierarchically and the root is already given, so start with i=1 ($root)
    for (let i = 1; i < idPath.length && curr; i++) {
        if (idPath[i].length <= 0) {
            // $$ in id (e.g. comments in sccharts)
            continue;
        }

        const nextType = idPath[i].charAt(0);
        if (nextType === 'E') {
            // Edge
            curr = ((curr as SKNode | SKPort).outgoingEdges as SKEdge[]).find(edge => id.startsWith(edge.id)) as SKEdge;
        } else if (['N', 'L', 'P'].includes(nextType) || idPath[i] === 'root') {
            // Node, label or port
            curr = curr.children.find(node => id.startsWith(node.id)) as SKNode | SKLabel | SKPort;
        }
    }

    // Now currNode should be the node searched for by the id
    if (!curr) {
        if (!suppressErrors) {
            console.error('No node found matching the id:', id);
        }
        return undefined;
    } else if (curr.id !== id) {
        if (!suppressErrors) {
            console.error('The found node does not match the searched id! id:', id, ', found node:', curr);
        }
        return undefined;
    }

    return curr;
}
