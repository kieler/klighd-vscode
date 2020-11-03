/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { DisplayedActionData, LayoutOptionUIData, ValuedSynthesisOption } from '@kieler/keith-diagram-options/src/common/option-models'
import { updateOptionsKind } from '@kieler/keith-diagram/lib/browser/keith-diagram-server'
import { Action } from 'sprotty'

/**
 * Request message from the server to update the diagram options widget on the client.
 */
export class UpdateDiagramOptionsAction implements Action {
    readonly kind = updateOptionsKind

    constructor(
        public readonly valuedSynthesisOptions: ValuedSynthesisOption[],
        public readonly layoutOptions: LayoutOptionUIData[],
        public readonly actions: DisplayedActionData[],
        public readonly modelUri: string) {
    }
}