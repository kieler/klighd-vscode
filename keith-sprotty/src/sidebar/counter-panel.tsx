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
import { VNode } from "snabbdom/vnode";
import { SidebarPanel } from "./sidebar-panel";

/**
 * Example for a simple reactive {@link SidebarPanel}. Fell free to use this as an
 * implementation guide when implementing your own panel.
 *
 * To use this panel, or any {@link SidebarPanel}, bind it to the DI symbol "SidebarPanel".
 * 
 * ```ts
 *   // Add counter panel as an example
 *  bind(CounterPanel)
 *    .toSelf()
 *    .inSingletonScope();
 *  bind(DISymbol.SidebarPanel).toService(CounterPanel);
 * ```
 */
export class CounterPanel extends SidebarPanel {
    private count: number = 0;

    get id(): string {
        return "counter-panel";
    }

    get title(): string {
        return "Counter";
    }

    render(): VNode {
        return (
            <div>
                <p>Current count: {this.count}</p>
                <button on-click={() => this.changeCount(1)} disabled={this.count >= 10}>
                    Increment
                </button>
                <button on-click={() => this.changeCount(-1)} disabled={this.count <= 0}>
                    Decrement
                </button>
            </div>
        );
    }

    private changeCount(by: number) {
        this.count += by;
        this.update();
    }

    get icon(): string {
        return `
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="feather feather-percent"
          >
            <line x1="19" y1="5" x2="5" y2="19"></line>
            <circle cx="6.5" cy="6.5" r="2.5"></circle>
            <circle cx="17.5" cy="17.5" r="2.5"></circle>
          </svg>`;
    }
}
