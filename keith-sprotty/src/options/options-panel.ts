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

// /** @jsx html */
// import { html } from "snabbdom-jsx";
import { injectable } from "inversify";
import { AbstractUIExtension } from "sprotty";

@injectable()
export class OptionsPanel extends AbstractUIExtension {
    static readonly ID = "options-panel";

    id(): string {
        return OptionsPanel.ID;
    }

    containerClass(): string {
        return `${OptionsPanel.ID}-container`;
    }

    protected initializeContents(containerElement: HTMLElement): void {
        // Imperative approach to build the UI that is also used for CommandPalettes
        const header = document.createElement("h4");
        header.innerText = "Options";
        containerElement.appendChild(header);

        // Notice that AbstractUIExtension only calls initializeContents once, so this handler is also only registered once.
        this.addClickOutsideListenser(containerElement);
    }

    /**
     * Register a click outside handler that hides the content when a user click outsides.
     * Using "mousedown" instead of "click" also hides the panel as soon as the user starts
     * dragging the diagram.
     */
    private addClickOutsideListenser(containerElement: HTMLElement): void {
        document.addEventListener("mousedown", (e) => {
            // See for information on detecting "click outside": https://stackoverflow.com/a/64665817/7569889
            if (!this.activeElement || e.composedPath().includes(containerElement)) return;

            this.hide();
        });
    }
}
