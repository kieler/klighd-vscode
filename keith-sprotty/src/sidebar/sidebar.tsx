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
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

/** @jsx html */
import { html } from "snabbdom-jsx";
import { inject, postConstruct } from "inversify";
import { VNode } from "snabbdom/vnode";
import { AbstractUIExtension, IActionDispatcher, Patcher, PatcherProvider, TYPES } from "sprotty";
import { DISymbol } from "../di.symbols";
import { ShowSidebarAction, ToggleSidebarPanelAction } from "./actions";
import { SidebarPanelRegistry } from "./sidebar-panel-registry";

/**
 * UIExtensions that adds a sidebar to the Sprotty container. The content of the
 * sidebar is implemented by panels, which are provided separately. The sidebar
 * reacts to updates of the {@link SidebarPanelRegistry} and syncs the UI with
 * the registry state.
 */
export class Sidebar extends AbstractUIExtension {
    static readonly ID = "sidebar";

    private patcher: Patcher;
    private oldPanelContentRoot: VNode;

    @inject(TYPES.PatcherProvider) patcherProvider: PatcherProvider;
    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;
    @inject(DISymbol.SidebarPanelRegistry) private sidebarPanelRegistry: SidebarPanelRegistry;

    @postConstruct()
    init() {
        this.actionDispatcher.dispatch(new ShowSidebarAction());
        this.patcher = this.patcherProvider.patcher;

        // Update the panel if the registry state changes
        this.sidebarPanelRegistry.onCurrentPanelChange(() => this.update());

        // Update the panel if the current panel requests an update
        this.sidebarPanelRegistry.allPanel.forEach((panel) => {
            panel.onUpdate(() => {
                if (panel.id === this.sidebarPanelRegistry.currentPanelID) this.update();
            });
        });
    }

    id(): string {
        return Sidebar.ID;
    }

    containerClass(): string {
        return Sidebar.ID;
    }

    update() {
        console.time("sidebar-update");
        const currentPanel = this.sidebarPanelRegistry.currentPanel;
        const title = this.containerElement.querySelector<HTMLHeadingElement>(".sidebar__title");

        // Only update of the content was initialized, which is the case if a
        // VNode Root for the panel content is created.
        if (!this.oldPanelContentRoot) return;
        if (!title) {
            console.error(
                "Unable to find the sidebar title! No element with the class sidebar__title has been found."
            );
            return;
        }

        if (!currentPanel) {
            // close the sidebar
            this.containerElement.classList.remove("sidebar--open");

            const activeBtn = this.containerElement.querySelector(
                ".sidebar__toggle-button--active"
            );
            activeBtn?.classList.remove("sidebar__toggle-button--active");
        } else {
            // show and update the sidebar

            // Update the panel title to the current title. Only change the DOM if the titles are not equal.
            if (title.innerHTML !== currentPanel.title) title.innerHTML = currentPanel.title;

            // Mark current panel button active. Only triggers a DOM change if the class is not already set.
            const buttons = this.containerElement.querySelectorAll<HTMLButtonElement>(
                ".sidebar__toggle-button"
            );
            buttons.forEach((btn) => {
                if (btn.dataset.panelId === currentPanel.id) {
                    btn.classList.add("sidebar__toggle-button--active");
                } else {
                    btn.classList.remove("sidebar__toggle-button--active");
                }
            });

            // Update panel content with efficient VDOM patching.
            this.oldPanelContentRoot = this.patcher(
                this.oldPanelContentRoot,
                currentPanel.render()
            );
            this.containerElement.classList.add("sidebar--open");
        }
        console.timeEnd("sidebar-update");
    }

    protected onBeforeShow(): void {
        this.update();
    }

    protected initializeContents(containerElement: HTMLElement): void {
        // Create buttons vanilla style. I (cfr) had problems to get svg icons
        // in snabbdom-jsx to work. They did not include all attributed and can not be part of
        // a html jsx pragma, which is the pragma used for all other panel content.
        // See: https://github.com/snabbdom-jsx/snabbdom-jsx/issues/21
        // and: https://github.com/snabbdom-jsx/snabbdom-jsx/issues/20
        const toggleContainer = document.createElement("div");
        toggleContainer.classList.add("sidebar__toggle-container");

        const panelButtons = this.sidebarPanelRegistry.allPanel.map((panel) => {
            const button = document.createElement("button");
            button.classList.add("sidebar__toggle-button");
            button.setAttribute("title", panel.title);
            button.dataset.panelId = panel.id;
            button.addEventListener("click", this.handlePanelButtonClick.bind(this, panel.id));
            button.innerHTML = panel.icon;

            return button;
        });
        panelButtons.forEach((button) => toggleContainer.appendChild(button));
        containerElement.appendChild(toggleContainer);

        // Create panel title
        const title = document.createElement("h3");
        title.classList.add("sidebar__title");
        title.innerText = "Sidebar";
        containerElement.appendChild(title);

        // Create content container which provides an overflow scrollbar for the content
        const contentContainer = document.createElement("div");
        contentContainer.classList.add("sidebar__content");
        containerElement.appendChild(contentContainer);

        // Prepare the virtual DOM. Snabbdom requires an empty element.
        // Furthermore, the element is completely replaces by the panel on every update,
        // so we use an extra, empty element to ensure that we loose no important attributes (such as classes).
        const panelContentRoot = document.createElement("div");
        this.oldPanelContentRoot = this.patcher(panelContentRoot, <div />);
        contentContainer.appendChild(panelContentRoot);

        // Notice that AbstractUIExtension only calls initializeContents once,
        // so this handler is also only registered once.
        this.addClickOutsideListenser(containerElement);
    }

    private handlePanelButtonClick(id: string) {
        this.actionDispatcher.dispatch(new ToggleSidebarPanelAction(id));
    }

    /**
     * Register a click outside handler that hides the content when a user click outsides.
     * Using "mousedown" instead of "click" also hides the panel as soon as the user starts
     * dragging the diagram.
     */
    private addClickOutsideListenser(containerElement: HTMLElement): void {
        document.addEventListener("mousedown", (e) => {
            const currentPanelID = this.sidebarPanelRegistry.currentPanelID;

            // See for information on detecting "click outside": https://stackoverflow.com/a/64665817/7569889
            if (!currentPanelID || e.composedPath().includes(containerElement)) return;

            this.actionDispatcher.dispatch(new ToggleSidebarPanelAction(currentPanelID, "hide"));
        });
    }
}
