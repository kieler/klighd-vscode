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
import { injectable } from 'inversify';

/**
 * An abstract class for adding arbitrary options stored on the client to the initialization process of the language server.
 */
@injectable()
export class InitializationService {

    /**
     * An object containing all options provided by this initializer.
     */
    getOptions(): object {
        return {}
    }
}