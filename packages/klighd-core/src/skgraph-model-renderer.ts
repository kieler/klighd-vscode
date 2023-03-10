/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2020-2022 by
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

import { KlighdInteractiveMouseListener } from '@kieler/klighd-interactive/lib/klighd-interactive-mouselistener';
import { VNode } from 'snabbdom';
import { IVNodePostprocessor, ModelRenderer, RenderingTargetKind, SModelElement, SParentElement, ViewRegistry } from 'sprotty';
import { Viewport } from 'sprotty-protocol';
import { DepthMap } from './depth-map';
import { RenderOptionsRegistry } from './options/render-options-registry';
import { KRenderingLibrary, EDGE_TYPE, LABEL_TYPE, NODE_TYPE, PORT_TYPE, SKGraphElement } from './skgraph-models';
import { TitleStorage } from './titles/title-storage';

/**
 * Contains additional data and functionality needed for the rendering of SKGraphs.
 */
export class SKGraphModelRenderer extends ModelRenderer {

    constructor(readonly viewRegistry: ViewRegistry, readonly targetKind: RenderingTargetKind, postprocessors: IVNodePostprocessor[]) {
        super(viewRegistry, targetKind, postprocessors)
    }

    /**
     * Map for all bounds related to KRenderingRefs, mapped by their rendering ID.
     */
    boundsMap: Record<string, unknown>
    /**
     * Map for all decoration data (bounds and rotation of decorators) related to KRenderingRefs, mapped by their rendering ID.
     */
    decorationMap: Record<string, unknown>
    depthMap?: DepthMap
    /**
     * Access to the rendering library, expected to be defined on the root graph element.
     */
    kRenderingLibrary?: KRenderingLibrary
    mListener: KlighdInteractiveMouseListener
    renderingDefs: Map<string, VNode>
    renderOptionsRegistry: RenderOptionsRegistry
    /**
     * Storage for the title renderings
     */
    titleStorage: TitleStorage = new TitleStorage()
    viewport: Viewport
    /** Used to force rendering independant of the depthMap. Needed by the proxy-view. */
    forceRendering = false;

    /**
     * Renders all children of the SKGraph that should be rendered within the child area of the element.
     *
     * @param element The element to render the children from.
     */
    renderChildAreaChildren(element: Readonly<SParentElement> & SKGraphElement): VNode[] {
        element.areChildAreaChildrenRendered = true
        return element.children
            .filter(child =>
                child.type === NODE_TYPE ||
                child.type === EDGE_TYPE)
            .map((child): VNode | undefined => {
                return this.renderElement(child)
            })
            .filter(vnode => vnode !== undefined) as VNode[]
    }

    /**
     * Renders all children of the SKGraph that should be rendered outside of the child area of the element.
     *
     * @param element The element to render the children from.
     */
    renderNonChildAreaChildren(element: Readonly<SParentElement> & SKGraphElement): VNode[] {
        element.areNonChildAreaChildrenRendered = true
        return element.children
            .filter(child =>
                child.type === PORT_TYPE ||
                child.type === LABEL_TYPE)
            .map((child): VNode | undefined => {
                return this.renderElement(child)
            })
            .filter(vnode => vnode !== undefined) as VNode[]
    }

    /** Renders an element forcefully, i.e. independant of the depthMap. */
    forceRenderElement(element: SKGraphElement): VNode | undefined {
        const prevForceRendering = this.forceRendering;
        this.forceRendering = true;
        const vnode = this.renderElement(element);
        this.forceRendering = prevForceRendering;
        return vnode;
    }
    
    /** @inheritdoc */
    renderElement(element: Readonly<SModelElement>): VNode | undefined {
        this.titleStorage.decendToChild()
        const node =  super.renderElement(element)
        this.titleStorage.ascendToParent()
        return node
    }
}
