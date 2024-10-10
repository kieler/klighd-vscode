/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2024 by
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

import { LayoutOptions } from 'elkjs'
import { DefaultLayoutConfigurator } from 'sprotty-elk'
import { SModelElement, SModelIndex } from 'sprotty-protocol'

/**
 * This layout configurator copies all layout options from the KGraph element's properties.
 */
export class KielerLayoutConfigurator extends DefaultLayoutConfigurator {
    override apply(element: SModelElement, _index: SModelIndex): LayoutOptions | undefined {
        // Only apply to elements with properties.
        if ((element as any).properties === undefined) {
            return undefined
        }
        const properties = (element as any).properties as Record<string, unknown>

        // map properties to layout options and stringify values
        const layoutOptions: LayoutOptions = {}
        Object.entries(properties).forEach(([key, value]) => {
            layoutOptions[key] = JSON.stringify(value)
        })

        return layoutOptions
    }
}
