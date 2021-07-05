/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2020 by
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

import { VNode } from 'snabbdom/vnode';
import { IVNodePostprocessor, ModelRenderer, RenderingTargetKind, SParentElement, ViewRegistry } from 'sprotty/lib';
import { KRenderingLibrary, EDGE_TYPE, LABEL_TYPE, NODE_TYPE, PORT_TYPE, SKGraphElement } from './skgraph-models';

/**
 * Contains additional data and functionality needed for the rendering of SKGraphs.
 */
export class SKGraphModelRenderer extends ModelRenderer {

    constructor(readonly viewRegistry: ViewRegistry, readonly targetKind: RenderingTargetKind, postprocessors: IVNodePostprocessor[]) {
        super(viewRegistry, targetKind, postprocessors)
    }

    boundsMap: any
    decorationMap: any
    kRenderingLibrary: KRenderingLibrary
    renderingDefs: Map<string, VNode>

    /**
     * Renders all children of the SKGraph that should be rendered within the child area of the element.
     *
     * @param element The element to render the children from.
     */
    renderChildAreaChildren(element: Readonly<SParentElement> & SKGraphElement, args?: Record<string, unknown>): VNode[] {
        element.areChildAreaChildrenRendered = true
        return element.children
            .filter(child =>
                child.type === NODE_TYPE ||
                child.type === EDGE_TYPE)
            .map((child): VNode | undefined => {
                return this.renderElement(child, args)
            })
            .filter(vnode => vnode !== undefined) as VNode[]
    }

    /**
     * Renders all children of the SKGraph that should be rendered outside of the child area of the element.
     *
     * @param element The element to render the children from.
     */
    renderNonChildAreaChildren(element: Readonly<SParentElement> & SKGraphElement, args?: Record<string, unknown>): VNode[] {
        element.areNonChildAreaChildrenRendered = true
        return element.children
            .filter(child =>
                child.type === PORT_TYPE ||
                child.type === LABEL_TYPE)
            .map((child): VNode | undefined => {
                return this.renderElement(child, args)
            })
            .filter(vnode => vnode !== undefined) as VNode[]
    }
}