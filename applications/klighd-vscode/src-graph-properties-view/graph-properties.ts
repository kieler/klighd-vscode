// @ts-nocheck
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

import './style/index.css'
import { Table } from '@kieler/table-webview/lib/table'

/**
 * 
 * Custom table for the model checker view.
 */
class GraphPropertiesTable extends Table {
    lastSelected: HTMLElement

    constructor() {
        super()
        document.addEventListener('click', (event) => {
            const node = event.target
            const owner = (node as HTMLElement).parentElement
            if (owner) {
                if (this.lastSelected) {
                    this.lastSelected.classList.remove('focused')
                }
                this.lastSelected = owner
                owner.classList.add('focused')
            }
        })
    }
}

// eslint-disable-next-line no-new
new GraphPropertiesTable()
