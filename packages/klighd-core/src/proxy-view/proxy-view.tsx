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
import { AbstractUIExtension, html, IActionDispatcher, RenderingContext, SGraph, SModelRoot, TYPES } from "sprotty"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { SKGraphView } from "../views";
import { ShowProxyViewAction } from "./proxy-view-actions";

@injectable()
export class ProxyView extends AbstractUIExtension {
    static readonly ID = "ProxyView";
    /** This actionDispatcher is needed for init(), so the class may be rendered as visible. */
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    // Use for rendering
    @inject(SKGraphView) private view: SKGraphView;

    id(): string {
        return ProxyView.ID;
    }

    containerClass(): string {
        return ProxyView.ID;
    }

    @postConstruct()
    init(): void {
        // Show the proxy-view
        this.actionDispatcher.dispatch(ShowProxyViewAction.create());
    }

    update(model: SGraph, context: RenderingContext): void {
        // TODO creates all visible proxies
        /* Notes:
        - iterate through nodes starting by outer layer for efficiency
        - root.canvasBounds -> get bounds for border region
        - root.id -> get file name (use for adding modules per diagram type)
        - root.children == model.children
        - this.containerElement -> remember this already exists, example:
            <div id="keith-diagram_sprotty_ProxyView" class="ProxyView" style="visibility: visible; opacity: 1;">
                <h1 style="color: red;">Hello, world!</h1>
            </div>
        */
        // const root = model.root;
        // console.log("Model:");
        // console.log(model);
        // console.log("Context:");
        // console.log(context);
        this.view;

        return;
    }

    createSingleProxy(): void {
        // TODO creates a single proxy

        /* Notes:
        - use a min-max-norm of sorts to render the proxy at the border (min/max the coords)
        - 
        */
        return;
    }

    protected onBeforeShow(containerElement: HTMLElement, root: Readonly<SModelRoot>, ...contextElementIds: string[]): void {
        // TODO could be useful?
    }

    protected initializeContents(containerElement: HTMLElement): void {
        // containerElement is the canvas to add the html via appendChild() to
        const content = document.createElement("h1");
        content.style.color = "red";
        content.innerText = "Hello, world!";
        containerElement.appendChild(content);
        // The same html using JSX/TSX:
        <h1 style={{color: "red"}}>Hello, world!</h1>;
    }
}
