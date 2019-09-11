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

import { CommandContribution } from '@theia/core';
import { LanguageClientContribution } from '@theia/languages/lib/browser';
import { MonacoEditorProvider } from '@theia/monaco/lib/browser/monaco-editor-provider';
import { ContainerModule, interfaces } from 'inversify';
import { KeithLanguageClientContribution } from './keith-language-client-contribution';
import { KeithMonacoEditorProvider } from "./keith-monaco-editor-provider";
import { configuration, KeithMonarchLanguage, LanguageDescription, monarchLanguage, RegistrationContribution } from './registration-contribution';
import { WidgetFactory, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget'
import "../../src/browser/style/index.css"
import { KeithGettingStartedWidget } from './keith-getting-started-widget';
import { KeithGettingStartedContribution } from './keith-getting-started-contribution';
import { bindKeithPreferences } from './keith-preferences';

// Language register, holds all languages that are supported by KEITH
export const languageDescriptions: LanguageDescription[] = [
    {id: "sctx", name: "SCCharts"},
    {id: "scl", name: "SCL"},
    {id: "kgt", name: "KGraph"},
    {id: "strl", name: "Estrel"},
    {id: "lus", name: "Lustre"},
    {id: "kext", name: "KExt"},
    {id: "anno", name: "Annotations"},
    {id: "sctx", name: "SCCharts"},
    {id: "elkt", name: "Elk Graph"},
    {id: "kviz", name: "Kieler Visualization"},
]

export default new ContainerModule((bind: interfaces.Bind, _unbind: interfaces.Unbind, _isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {
    // register languages
    languageDescriptions.forEach((language: LanguageDescription) => {
        monaco.languages.register({
            id: language.id,
            aliases: [language.name, language.id],
            extensions: ['.' + language.id],
            mimetypes: ['text/' + language.id]
        })
    })
    // get keywords for highlighting
    bind(CommandContribution).toDynamicValue(ctx => {
        const returnValue = ctx.container.get(RegistrationContribution)
        const client = ctx.container.get(KeithLanguageClientContribution)
        client.languageClient.then(lClient => {
            lClient.sendRequest("keith/registration/get-languages").then((languages: LanguageDescription[]) => {
                languages.forEach((language: LanguageDescription) => {
                    if (monaco.languages.getEncodedLanguageId(language.id)) {
                        let mLanguage = monarchLanguage as KeithMonarchLanguage
                        mLanguage.keywords = language.keywords ? language.keywords : []
                        mLanguage.tokenPostfix = "." + language.id
                        monaco.languages.setLanguageConfiguration(language.id, configuration)
                        monaco.languages.setMonarchTokensProvider(language.id, mLanguage)
                    } else {
                        console.warn("Got unregistered language " + language.id +
                        ". A language has to be registered in frontend-extension and language-client-contribution.")
                    }
                })
            })
        }).catch(() => {
            throw new Error("Failed to get keywords for language registration")
        })
        return returnValue
    })
    bind(KeithLanguageClientContribution).toSelf().inSingletonScope()
    bind(LanguageClientContribution).toService(KeithLanguageClientContribution)

    bind(RegistrationContribution).toSelf().inSingletonScope()
    rebind(MonacoEditorProvider).to(KeithMonacoEditorProvider).inSingletonScope()
    bind(KeithGettingStartedContribution).toSelf().inSingletonScope()
    bind(CommandContribution).toService(KeithGettingStartedContribution);
    bind(FrontendApplicationContribution).toService(KeithGettingStartedContribution);
    bind(KeithGettingStartedWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: GettingStartedWidget.ID,
        createWidget: () => context.container.get<KeithGettingStartedWidget>(KeithGettingStartedWidget),
    })).inSingletonScope();

    bindKeithPreferences(bind)
})