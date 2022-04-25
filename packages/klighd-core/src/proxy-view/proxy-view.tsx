/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022 by
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

/** @jsx html */
import { inject, injectable, postConstruct } from "inversify";
import { VNode } from "snabbdom";
import { AbstractUIExtension, html, IActionDispatcher, Patcher, PatcherProvider, RenderingContext, SGraph, SModelRoot, TYPES } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { SKGraphModelRenderer } from "../skgraph-model-renderer";
import { SKNode } from "../skgraph-models";
import { KNodeView, SKGraphView } from "../views";
import { SendProxyViewAction, ShowProxyViewAction } from "./proxy-view-actions";

@injectable()
export class ProxyView extends AbstractUIExtension {
    static readonly ID = "proxy-view";
    /** This actionDispatcher is needed for init(), so the class may be rendered as visible. */
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    /** Use for replacing the HTML elements. */
    @inject(TYPES.PatcherProvider) patcherProvider: PatcherProvider;
    private patcher: Patcher;
    private oldContentRoot: VNode;
    // Use for rendering
    @inject(SKGraphView) private graphView: SKGraphView;
    @inject(KNodeView) private nodeView: KNodeView;

    id(): string {
        return ProxyView.ID;
    }

    containerClass(): string {
        return ProxyView.ID;
    }

    @postConstruct()
    init(): void {
        // Send and show to proxy view
        this.actionDispatcher.dispatch(SendProxyViewAction.create(this));
        this.actionDispatcher.dispatch(ShowProxyViewAction.create());
        this.patcher = this.patcherProvider.patcher;
    }

    protected initializeContents(containerElement: HTMLElement): void {
        // Use temp for initializing oldContentRoot
        const temp = document.createElement("div");
        this.oldContentRoot = this.patcher(temp, <div />);
        containerElement.appendChild(temp);
    }

    protected onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRoot>, ...contextElementIds: string[]): void {
        // TODO could be useful?
        // TODO remove later on, used to ignore unused warnings:
        this.graphView;
        this.nodeView;
        this.patcher;
        SKGraphModelRenderer;
    }

    update(model: SGraph, context: RenderingContext): void {
        // TODO creates all visible proxies
        /* Notes:
        - iterate through nodes starting by outer layer for efficiency
        - root.canvasBounds / model.canvasBounds -> get bounds for border region
        - root.id -> get file name (use for adding modules per diagram type)
        - root.children == model.children
        - this.containerElement -> remember this already exists, example:
            <div id="keith-diagram_sprotty_ProxyView" class="ProxyView" style="visibility: visible; opacity: 1;">
                <h1 style="color: red;">Hello, world!</h1>
            </div>
        - this.activeElement -> not sure yet
        - (context as SKGraphModelRenderer).depthMap -> depthmap, check if region is in bounds
            const depthMap = (context as SKGraphModelRenderer).depthMap;
            if (depthMap?.viewport !== undefined) {
                console.log(depthMap?.isInBounds(depthMap.rootRegions[0], depthMap.viewport));
            }
        - this.patcher() -> replaces oldRoot with newRoot
        - edges are handled like this: children=[SKNode, SKNode, SKEdge] -> edge between the nodes
        */

        // const ctx = context as SKGraphModelRenderer;
        const root = model.root;
        const node = Object.assign({}, root.children[0] as SKNode); // This effectively clones the node
        // node.size = {width: 100, height: 100};
        console.log(node);
        const vnode = this.nodeView.render(node, context);
        const vnodes = [vnode];
        vnodes

        // Iterate through nodes starting by root
        // check if node is: 
        // (partially) in bounds -> no proxy, check children
        // out of bounds         -> proxy

        const width = model.canvasBounds.width;
        const height = model.canvasBounds.height;
        this.oldContentRoot = this.patcher(this.oldContentRoot,
            <svg style={
                    {width: width.toString(), height: height.toString(), // Set size to whole canvas
                    pointerEvents: "none"} // Make click-through
                    }>
                {/* {...vnodes} */}
            </svg>);
    }

    createSingleProxy(node: SKNode, ctx: SKGraphModelRenderer): VNode | undefined {
        // TODO creates a single proxy, make vnode pointer-events auto (aka not-click-through)?

        /* Notes:
        - use a min-max-norm of sorts to render the proxy at the border (min/max the coords)
        */
        return ctx.renderProxy(node);
    }
}
