/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2023 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License 2.0 (EPL-2.0).
 */

import { SChildElementImpl, SModelElementImpl, SModelRootImpl, SParentElementImpl } from 'sprotty'

/**
 * Utility function to insert an SModelElement into an existing model.
 * The id of the new piece must already be known by the model. That is to
 * say, there is already a placeholder element with the same id in the model.
 * @param modelRoot
 * @param modelElement
 */
export function insertSModelElementIntoModel(modelRoot: SModelRootImpl, modelElement: SModelElementImpl): void {
    // traverse model and search for insertion point
    replaceNodeById(modelRoot, modelElement)
}

function replaceNodeById(root: SParentElementImpl, modelElement: SModelElementImpl) {
    const { id } = modelElement
    if (root.children === undefined) {
        return
    }
    // try to find element in current children
    const index = root.children.findIndex((child) => child.id === id)

    if (index > -1) {
        // replace if it exists
        // root.children[index] = modelElement
        root.remove(root.children[index])
        root.add(modelElement as SChildElementImpl, index)
    } else {
        // recurse further down otherwise
        root.children.forEach((childNode) => {
            // find correct child to descend into by pattern matching ids
            if (id.startsWith(childNode.id)) {
                replaceNodeById(childNode, modelElement)
            }
        })
    }
}
