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

import { inject, injectable } from "inversify";
import { Action, ActionHandlerRegistry, IActionHandler, IActionHandlerInitializer, ICommand, SetUIExtensionVisibilityAction } from "sprotty";
import { SendModelContextAction } from "../actions/actions";
import { DISymbol } from "../di.symbols";
import { ProxyView } from "./proxy-view";

/** Wrapper action around {@link SetUIExtensionVisibilityAction} which shows the proxy.
  * Otherwise the proxy-view would be invisible. */
export type ShowProxyViewAction = SetUIExtensionVisibilityAction

export namespace ShowProxyViewAction {
    export function create(): ShowProxyViewAction {
        return SetUIExtensionVisibilityAction.create({
            extensionId: ProxyView.ID,
            visible: true,
        })
    }
}

/**
 * Handles {@link SendModelContextAction}s to redirect the content to the {@link ProxyView}.
 */
@injectable()
export class ProxyViewActionHandler implements IActionHandler, IActionHandlerInitializer {
    @inject(DISymbol.ProxyView) private proxyView: ProxyView;

    handle(action: Action): void | Action | ICommand {
        if (action.kind === SendModelContextAction.KIND) {
            const sMCAction = action as SendModelContextAction;
            this.proxyView.update(sMCAction.model, sMCAction.context);
        }
    }

    initialize(registry: ActionHandlerRegistry): void {
        // Register as a handler to receive the action
        registry.register(SendModelContextAction.KIND, this);
    }
}
