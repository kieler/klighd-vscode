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

import { SetUIExtensionVisibilityAction } from "sprotty";
import { Example } from "./example";

/** Wrapper action around {@link SetUIExtensionVisibilityAction} which shows the example.
 *  Otherwise the example would be invisible. */
export type ShowExampleAction = SetUIExtensionVisibilityAction

export namespace ShowExampleAction {
    export function create(): ShowExampleAction {
        return SetUIExtensionVisibilityAction.create({
            extensionId: Example.ID,
            visible: true,
        })
    }
}
