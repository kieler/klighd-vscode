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
import { InitializationService } from '@kieler/keith-language/lib/browser/initialization-service';
import { injectable } from 'inversify';
import { OPTION_KEY } from '../common';

@injectable()
export class OptionsInitialization extends InitializationService {

    getOptions() {
        const optionsString = window.localStorage.getItem(OPTION_KEY)
        let options: object = {}
        if (optionsString !== null) {
            options = JSON.parse(optionsString)
        }
        return {
            clientDiagramOptions: { ...options }
        }
    }

}