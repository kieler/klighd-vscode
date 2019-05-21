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
import { LanguageClientFactory, Languages, Workspace, BaseLanguageClientContribution } from '@theia/languages/lib/browser';
import { inject, injectable } from 'inversify';
import { LS_ID, LS_NAME } from '../common';
import { KeithInitializationOptions } from '../common/initialization-protocol';
import { languageDescriptions } from './frontend-extension';
import { KeithInitializationService } from './initialization-options';

@injectable()
export class KeithLanguageClientContribution extends BaseLanguageClientContribution {

    readonly id = LS_ID
    readonly name = LS_NAME

    constructor(
        @inject(Workspace) protected readonly workspace: Workspace,
        @inject(Languages) protected readonly languages: Languages,
        @inject(LanguageClientFactory) protected readonly languageClientFactory: LanguageClientFactory) {
        super(workspace, languages, languageClientFactory)
    }

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
    protected get documentSelector(): string[] {
        return languageDescriptions.map(languageDescription => languageDescription.id)
    }

    /**
     * Handle when the LS for this contribution is started.
     * Currently started immediatly when the workspace is ready.
     * The original idea was to start it if a document with an id in the documentSelector is opened.
     *
     * @param _app not needed
     */
    // tslint:disable-next-line:no-any
    waitForActivation(_app: FrontendApplication): Promise<any> {
        return this.workspace.ready;
    }

    // tslint:disable-next-line:no-any
    protected get initializationOptions(): any | (() => any) | undefined {
        const initializer = KeithInitializationService.get()
        return {
            shouldSelectDiagram: initializer.getShouldSelectDiagram(),
            shouldSelectText: initializer.getShouldSelectText(),
        } as KeithInitializationOptions
    }
}
