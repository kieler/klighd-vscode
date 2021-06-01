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
import { SynthesesRegistry } from '@kieler/keith-sprotty/lib/syntheses/syntheses-registry';
import { LSTheiaSprottyConnector, TheiaSprottyConnectorServices } from 'sprotty-theia';
import { SynthesisCommandContribution } from './keith-diagram-commands';

/**
 * See doc. of TheiaSprottyConnectorServices. Pipes more bindings from the theia application to each diagram server.
 */
export interface KeithTheiaSprottyConnectorServices extends TheiaSprottyConnectorServices {
    readonly synthesisRegistry: SynthesesRegistry
    readonly synthesisCommandContribution: SynthesisCommandContribution
}

/**
 * See doc. of LSTheiaSprottyConnector. Pipes more bindings from the theia application to each diagram server.
 */
export class KeithTheiaSprottyConnector extends LSTheiaSprottyConnector implements KeithTheiaSprottyConnectorServices {
    readonly synthesisRegistry: SynthesesRegistry
    readonly synthesisCommandContribution: SynthesisCommandContribution

    constructor(services: KeithTheiaSprottyConnectorServices) {
        super(services)
    }
}