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
import { html } from "snabbdom-jsx"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { VNode } from "snabbdom/vnode";
import { SidebarPanel } from "../src/sidebar/sidebar-panel";

/**
 * Example for a simple reactive {@link SidebarPanel}. Fell free to use this as an
 * implementation guide when implementing your own panel.
 *
 * To use this panel, or any {@link SidebarPanel}, bind it to the DI symbol "SidebarPanel".
 *
 * ```ts
 *   // Add counter panel as an example
 *  bind(CounterPanel).toSelf().inSingletonScope();
 *  bind(DISymbol.SidebarPanel).toService(CounterPanel);
 * ```
 */
export class CounterPanel extends SidebarPanel {
    private count = 0;

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
        // Request an update to make the panel reactive to changes
        this.update();
    }

    get icon(): VNode {
        return <i attrs={{ "data-feather": "percent" }}></i>;
    }
}
