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
import { LSTheiaSprottyConnector, TheiaSprottyConnectorServices } from 'sprotty-theia';

/**
 * See doc. of TheiaSprottyConnectorServices. Pipes more bindings from the theia application to each diagram server.
 */
export interface KeithTheiaSprottyConnectorServices extends TheiaSprottyConnectorServices {
    readonly synthesisRegistry: SynthesisRegistry
}

/**
 * See doc. of LSTheiaSprottyConnector. Pipes more bindings from the theia application to each diagram server.
 */
export class KeithTheiaSprottyConnector extends LSTheiaSprottyConnector implements KeithTheiaSprottyConnectorServices {
    readonly synthesisRegistry: SynthesisRegistry

    constructor(services: KeithTheiaSprottyConnectorServices) {
        super(services)
    }
}