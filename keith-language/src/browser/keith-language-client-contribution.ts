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
import { LanguageClientFactory, Languages, Workspace } from '@theia/languages/lib/browser';
import { inject, injectable, multiInject } from 'inversify';
import { DiagramLanguageClientContribution, DiagramManagerProvider } from 'sprotty-theia/lib';
import { LS_ID, LS_NAME } from '../common';
import { KeithInitializationOptions } from '../common/initialization-protocol';
import { languageDescriptions } from './frontend-extension';
import { KeithInitializationService } from './initialization-options';

@injectable()
export class KeithLanguageClientContribution extends DiagramLanguageClientContribution {

    readonly id = LS_ID
    readonly name = LS_NAME

    constructor(
        @inject(Workspace) protected readonly workspace: Workspace,
        @inject(Languages) protected readonly languages: Languages,
        @inject(LanguageClientFactory) protected readonly languageClientFactory: LanguageClientFactory,
        @multiInject(DiagramManagerProvider) protected diagramManagerProviders: DiagramManagerProvider[]) {
        super(workspace, languages, languageClientFactory, diagramManagerProviders)
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
     * Currently started immediatly.
     * The original idea was to start it if a document with an id in the documentSelector is opened.
     *
     * @param app not needed
     */
    // tslint:disable-next-line:no-any
    waitForActivation(app: FrontendApplication): Promise<any> {
        // tslint:disable-next-line:no-any
        const activationPromises: Promise<any>[] = [];
        const workspaceContains = this.workspaceContains;
        if (workspaceContains.length !== 0) {
            activationPromises.push(this.waitForItemInWorkspace());
        }
        const documentSelector = this.documentSelector;
        if (documentSelector) {
            activationPromises.push(this.waitForOpenTextDocument(documentSelector));
        }
        if (activationPromises.length !== 0) {
            return Promise.all([
                this.workspace.ready,
                Promise.race(activationPromises.map(p => new Promise(async resolve => {
                    try {
                        // do not wait for opening of a file, just start the LS
                        // await p;
                        resolve();
                    } catch (e) {
                        console.error(e);
                    }
                })))
            ]);
        }
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
