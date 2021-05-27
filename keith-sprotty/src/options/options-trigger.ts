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

import { inject, injectable, postConstruct } from "inversify";
import {
    AbstractUIExtension,
    IActionDispatcher,
    SetUIExtensionVisibilityAction,
    TYPES,
} from "sprotty";
import { ShowOptionsPanelAction } from "./actions";

@injectable()
export class OptionsTrigger extends AbstractUIExtension {
    static readonly ID = "options-trigger";

    @inject(TYPES.IActionDispatcher) private actionDispatcher: IActionDispatcher;

    id(): string {
        return OptionsTrigger.ID;
    }

    containerClass(): string {
        return `${OptionsTrigger.ID}-container`;
    }

    @postConstruct()
    init() {
        this.actionDispatcher.dispatch(new SetUIExtensionVisibilityAction(OptionsTrigger.ID, true));
    }

    protected initializeContents(containerElement: HTMLElement): void {
        const button = document.createElement("button");
        button.classList.add("options-trigger");
        button.setAttribute("title", "Diagram Options");
        button.innerHTML = this.getTriggerIconHtmlString();
        button.addEventListener("click", (e) => this.handleTriggerClick(e));
        containerElement.appendChild(button);
    }

    handleTriggerClick(e: MouseEvent) {
        this.actionDispatcher.dispatch(new ShowOptionsPanelAction());
    }

    private getTriggerIconHtmlString() {
        // Icon-source: https://feathericons.com/?query=settings
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-settings"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
    }
}
