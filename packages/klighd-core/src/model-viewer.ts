/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021-2024 by
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

import { inject, injectable, postConstruct } from "inversify";
import { VNode } from 'snabbdom';
import { ModelViewer } from "sprotty";
import { KlighdFitToScreenAction } from "./actions/actions";
import { DISymbol } from "./di.symbols";
import { ForceLightBackground, RenderOptionsRegistry, ResizeToFit } from "./options/render-options-registry";

/**
 * Extend the {@link ModelViewer} to also dispatch a FitToScreenAction when the
 * window resizes.
 * Futhermore, the extension resolves UIExtensions from the IoC that should be
 * displayed immediately.
 */
@injectable()
export class KlighdModelViewer extends ModelViewer {
    // Resolve UIExtensions that should be shown together with the model.
    // Such UIExtensions should implement a @postConstruct to show them self.
    // @ts-ignore
    @inject(DISymbol.Sidebar) private sidebar: unknown;

    @inject(DISymbol.RenderOptionsRegistry) private renderOptionsRegistry: RenderOptionsRegistry;

    @postConstruct()
    init(): void {
        // Most diagrams are not rendered with different themes in mind. In case
        // a diagram is hard to read, the user can force a light background.
        // This toggles such background if the user selects it.
        this.renderOptionsRegistry.onChange(() => {
            const baseDiv = document.querySelector(`#${this.options.baseDiv}`);

            if (this.renderOptionsRegistry.getValue(ForceLightBackground)) {
                baseDiv?.classList.add("light-bg");
            } else {
                baseDiv?.classList.remove("light-bg");
            }
        });
    }

    protected override onWindowResize(vdom: VNode): void {
        const baseDiv = document.getElementById(this.options.baseDiv);
        if (baseDiv !== null) {
            super.onWindowResize(vdom)

            // Fit the diagram to the new window size, if the user enabled this behavior
            if (this.renderOptionsRegistry.getValue(ResizeToFit))
                this.actiondispatcher.dispatch(KlighdFitToScreenAction.create(false));
        }
    }
}
