/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018-2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { FrontendApplication } from '@theia/core/lib/browser/frontend-application';
import { BaseLanguageClientContribution } from '@theia/languages/lib/browser';
import { injectable, multiInject, optional } from 'inversify';
import { LS_ID, LS_NAME, languageDescriptions } from '../common';
import { InitializationService } from './initialization-service';

@injectable()
export class KeithLanguageClientContribution extends BaseLanguageClientContribution {

    readonly id = LS_ID
    readonly name = LS_NAME
    @multiInject(InitializationService)@optional() protected readonly initializationServices: InitializationService[]

    /**
     * Define pattern of supported languages from language server registered in backend with id and name of class.
     * Name for extension defined by mapping via monaco registration in frontend.
     * Creates a FileSystemWatcher for each pattern. Not needed for functionality.
     */
    protected get globPatterns() {
        return []
    }

    /**
     * Editors with this languageId are supported by the LS.
     */
    public get documentSelector(): string[] {
        return languageDescriptions.map(languageDescription => languageDescription.id)
    }

    /**
     * Handle when the LS for this contribution is started.
     * Currently started immediatly when the workspace is ready.
     * The original idea was to start it if a document with an id in the documentSelector is opened.
     *
     * @param app not needed
     */
    // tslint:disable-next-line:no-any
    waitForActivation(app: FrontendApplication): Promise<void> {
        return this.workspace.ready;
    }

    // tslint:disable-next-line:no-any
    protected get initializationOptions(): any | (() => any) | undefined {
        // tslint:disable-next-line:no-any
        let initializationOptions: any = {}
        for (let initializationService of this.initializationServices) {
            initializationOptions = {...initializationOptions, ...initializationService.getOptions()}
        }
        return initializationOptions
    }
}
