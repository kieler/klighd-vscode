/*
* KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
*
* http://rtsys.informatik.uni-kiel.de/kieler
*
* Copyright 2019 by
* + Kiel University
*   + Department of Computer Science
*     + Real-Time and Embedded Systems Group
*
* This code is provided under the terms of the Eclipse Public License (EPL).
*/
import { SynthesisRegistry } from '@kieler/keith-sprotty/lib/syntheses/synthesis-registry';
import { ActionMessage } from 'sprotty';
import { LSTheiaSprottyConnector, TheiaSprottyConnectorServices } from 'sprotty-theia';
import { SynthesisCommandContribution } from './keith-diagram-commands';
import { KeithDiagramServer } from './keith-diagram-server';

/**
 * See doc. of TheiaSprottyConnectorServices. Pipes more bindings from the theia application to each diagram server.
 */
export interface KeithTheiaSprottyConnectorServices extends TheiaSprottyConnectorServices {
    readonly synthesisRegistry: SynthesisRegistry
    readonly synthesisCommandContribution: SynthesisCommandContribution
}

/**
 * See doc. of LSTheiaSprottyConnector. Pipes more bindings from the theia application to each diagram server.
 */
export class KeithTheiaSprottyConnector extends LSTheiaSprottyConnector implements KeithTheiaSprottyConnectorServices {
    // TODO: remove this when applying this pull request: https://github.com/eclipse/sprotty-theia/pull/28 (or if we update to next or 0.7.0 version of sprotty-theia)
    // (repeat for all occurrances of the servers_ variable. See the commit message where this line was added.)
    protected servers_: KeithDiagramServer[] = []

    readonly synthesisRegistry: SynthesisRegistry
    readonly synthesisCommandContribution: SynthesisCommandContribution

    constructor(services: KeithTheiaSprottyConnectorServices) {
        super(services)
    }

    connect(diagramServer: KeithDiagramServer) {
        this.servers_.push(diagramServer)
        diagramServer.connect(this)
    }

    disconnect(diagramServer: KeithDiagramServer) {
        const index = this.servers_.indexOf(diagramServer)
        if (index >= 0) {
            this.servers_.splice(index, 1)
        }
        diagramServer.disconnect()
        this.diagramLanguageClient.didClose(diagramServer.clientId)
    }

    onMessageReceived(message: ActionMessage): void {
        this.servers_.forEach(element => {
            element.messageReceived(message)
        })
    }
}