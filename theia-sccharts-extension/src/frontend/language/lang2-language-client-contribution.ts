/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { inject, injectable} from 'inversify'
import { FrontendApplication, KeybindingRegistry } from '@theia/core/lib/browser'
import {
    BaseLanguageClientContribution,
    LanguageClientFactory,
    Languages,
    Workspace,
} from '@theia/languages/lib/browser'
import { CommandRegistry, Disposable } from '@theia/core/lib/common';
import { ContextMenuCommands } from './dynamic-commands';
import { Constants } from '../../common/constants';

@injectable() 
export class Lang2LanguageClientContribution extends BaseLanguageClientContribution {

    readonly id = Constants.lang2Id
    readonly name = Constants.lang2Name

    constructor(
        @inject(Workspace) workspace: Workspace,
        @inject(Languages) languages: Languages,
        @inject(LanguageClientFactory) languageClientFactory: LanguageClientFactory,
        @inject(KeybindingRegistry) protected keybindingRegistry: KeybindingRegistry,
        @inject(CommandRegistry) protected commandRegistry: CommandRegistry,
        @inject(ContextMenuCommands) protected commands: ContextMenuCommands
    ) {
        super(workspace, languages, languageClientFactory)
    }

    protected get globPatterns() {
        return [
            '**/*.' + Constants.lang2Id
        ]
    }

    waitForActivation(app: FrontendApplication): Promise<any> {
        return Promise.race([
            super.waitForActivation(app)
        ])
    }

    registerCommand(id: string, callback: (...args: any[]) => any, thisArg?: any): Disposable {
        return this.commands.registerCommand(id, callback, thisArg)
    }
}