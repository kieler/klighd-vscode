/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
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
import { inject, postConstruct } from "inversify";
import { VNode } from "snabbdom";
import { AbstractUIExtension, TYPES, IActionDispatcher, html, Patcher } from "sprotty"; 

/**
 * UIExtension that adds a sidebar to the Sprotty container. The content of the
 * sidebar is implemented by panels, which are provided separately. The sidebar
 * reacts to updates of the {@link SidebarPanelRegistry} and syncs the UI with
 * the registry state.
 */
export class Contexmenu extends AbstractUIExtension {
    static readonly ID = "contextmenu";

    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;

    /** Snabbdom patcher function and VDom root */
    private patcher: Patcher;
    private oldPanelContentRoot: VNode;

    @postConstruct()
    init(): void {
        // this.actionDispatcher.dispatch(ShowContextmenu.create()); ?

        // Update the panel if the registry state changes

        // Update the panel if the current panel requests an update
        
    }


    id(): string {
        return Contexmenu.ID;
    }

    containerClass(): string {
        return Contexmenu.ID;
    }

    update(): void {

        const content: VNode = (
            <div>
                <a> test </a>
            </div>
        );

        this.oldPanelContentRoot = this.patcher(this.oldPanelContentRoot, content);
    }
    
    protected initializeContents(containerElement: HTMLElement): void {
        // Prepare the virtual DOM. Snabbdom requires an empty element.
        // Furthermore, the element is completely replaced by the panel on every update,
        // so we use an extra, empty element to ensure that we do not loose important attributes (such as classes).
        const panelContentRoot = document.createElement("div");
        this.oldPanelContentRoot = this.patcher(panelContentRoot, <div />);

        containerElement.appendChild(panelContentRoot);

        // Notice that an AbstractUIExtension only calls initializeContents once,
        // so this handler is also only registered once.

        // this.addClickOutsideListenser(containerElement);
        // this.addMouseLeaveListener(containerElement)
    }

}