/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2022-2024 by
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

import { commands, Disposable, Uri, window } from 'vscode'
import { command } from './constants'
import { StorageService } from './storage/storage-service'

export class KlighdWebviewReopener {
    private readonly storage: StorageService

    private toDispose: Disposable[] = []

    constructor(storage: StorageService) {
        this.storage = storage
    }

    reopenDiagram(): void {
        const diagramWasOpen = this.storage.getItem('diagramOpen')
        if (diagramWasOpen === undefined || diagramWasOpen) {
            const { activeTextEditor } = window
            if (activeTextEditor) {
                const uri = activeTextEditor.document.fileName
                commands.executeCommand(command.diagramOpen, Uri.file(uri))
            }
        }
    }
}
