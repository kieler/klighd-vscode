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
import { SModelRoot } from 'sprotty-protocol'
import { isContainerRendering, isRendering, KPolyline, KRendering, K_POLYLINE, K_RENDERING_REF, SKGraphElement, SKNode } from './skgraph-models'

/**
 * Returns the SVG element in the DOM that represents the topmost KRendering in the hierarchy.
 * If the element should be selected but is not selectable, the next selectable element in the hierarchy will be chosen.
 * @param target The graph element the event is triggered on.
 * @param element The topmost SVG element clicked.
 * @param select Optional parameter to search for selectable renderings only. Defaults to false.
 */
export function getSemanticElement(target: SKGraphElement, element: EventTarget | null, select = false): SVGElement | undefined {
    if (!(element instanceof SVGElement)) {
        return undefined
    }
    let currentElement: Element | null = element
    let semanticElement = undefined
    while (semanticElement === undefined && currentElement instanceof SVGElement) {
        // If the rendering is configured to be not selectable, do not select it.
        let renderingSelectable = true
        if (currentElement.id !== '' && select) {
            const rendering = findRendering(target, currentElement.id)
            if (rendering?.properties['de.cau.cs.kieler.klighd.suppressSelectability'] === true) {
                renderingSelectable = false
            }
        }
        // Choose this element if it is a defined element with an ID.
        // Also only use this if selection implies it is selectable (select => renderingSelectable)
        if (currentElement.id !== '' && (!select || renderingSelectable)) {
            semanticElement = currentElement
        } else {
            currentElement = currentElement.parentElement
        }
    }
    return semanticElement
}

/**
 * Finds the KRendering in the data of the SKGraphElement that matches the given ID.
 * @param element The element to look in.
 * @param id The ID to search for.
 */
export function findRendering(element: SKGraphElement, id: string): KRendering | undefined {
    // The first rendering has to be extracted from the SKGraphElement. It is the first data object that is a KRendering.
    let currentElement: KRendering = element.data.find(possibleRendering => {
        return isRendering(possibleRendering)
    }) as KRendering
    const idPath = id.split('$')
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
                    return id.startsWith(childRendering.properties['klighd.lsp.rendering.id'] as string)
                }) as KRendering
            }
            if (nextElement === undefined && currentElement.type === K_POLYLINE) {
                // If the rendering was not found yet, take the junction point rendering.
                if (id.startsWith((currentElement as KPolyline).junctionPointRendering.properties['klighd.lsp.rendering.id'] as string)) {
                    nextElement = (currentElement as KPolyline).junctionPointRendering
                }
            } if (nextElement === undefined) {
                console.error(id + ' can not be found in the renderings of the element:')
                console.error(element)
                return
            }
            currentElement = nextElement
        }
    }
    // Now the currentElement should be the element searched for by the id.
    if (currentElement.properties['klighd.lsp.rendering.id'] as string !== id) {
        console.error('The found element does not match the searched id! id: ' + id + ', found element: ' + currentElement)
        return
    }
    return currentElement
}

/**
 * Finds the SKNode that matches the given ID.
 * @param root The root.
 * @param id The ID to search for.
 * @returns The node matching the given id or `undefined` if there is none.
 */
 export function getNodeByID(root: SModelRoot, id: string): SKNode | undefined {
    let curr = root as unknown as SKNode;
    const idPath = id.split('$');
    // The node id is build hierarchically and the root is already given, so start with i=1
    for (let i = 1; i < idPath.length; i++) {
        // Cannot check if next is undefined as a stopping criterion here
        // since ids allow for $$ (e.g. comments in sccharts)
        const next = curr.children.find(node => id.startsWith(node.id)) as SKNode;
        curr = next ? next : curr;
    }

    // Now currNode should be the node searched for by the id
    if (!curr) {
        console.error('No node found matching the id:', id);
        return undefined;
    } else if (curr.id !== id) {
        console.error('The found node does not match the searched id! id:', id, ', found node:', curr);
        return undefined;
    }
    return curr;
}
