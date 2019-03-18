/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { Disposable } from '@theia/core/lib/common';
import { LanguageClientFactory, Languages, Workspace } from '@theia/languages/lib/browser';
import { inject, injectable, multiInject } from 'inversify';
import { DiagramLanguageClientContribution, DiagramManagerProvider } from 'sprotty-theia/lib';
import { ContextMenuCommands } from './dynamic-commands';
import { languageDescriptions } from './frontend-extension';

@injectable()
export class KeithLanguageClientContribution extends DiagramLanguageClientContribution {

    readonly id = 'keith'
    readonly name = 'Keith'

    constructor(
        @inject(Workspace) protected readonly workspace: Workspace,
        @inject(Languages) protected readonly languages: Languages,
        @inject(LanguageClientFactory) protected readonly languageClientFactory: LanguageClientFactory,
        @multiInject(DiagramManagerProvider) protected diagramManagerProviders: DiagramManagerProvider[],
        @inject(ContextMenuCommands) protected commands: ContextMenuCommands) {
        super(workspace, languages, languageClientFactory, diagramManagerProviders)
    }

    /**
     * Define pattern of supported languages from language server registered in backend with id and name of class.
     * Name for extension defined by mapping via monaco registration in frotend
     */
    protected get globPatterns() {
        return []
    }

    /**
     * Define id for pattern seen in globPatterns()
     */
    protected get documentSelector(): string[] {
        return languageDescriptions.map(languageDescription => languageDescription.id)
    }

    registerCommand(id: string, callback: (...args: any[]) => any, thisArg?: any): Disposable {
        return this.commands.registerCommand(id, callback, thisArg)
    }
}
