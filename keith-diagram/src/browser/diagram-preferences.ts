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

import { KeithLanguageClientContribution } from '@kieler/keith-language/lib/browser/keith-language-client-contribution';
import { createPreferenceProxy, PreferenceChangeEvent, PreferenceContribution, PreferenceProxy, PreferenceSchema, PreferenceService } from '@theia/core/lib/browser';
import { inject, injectable, interfaces, postConstruct } from 'inversify';


//  Preferences needed for KEITH diagrams.
//  Inspired by Theia's terminal preference implementation:
//  see https://github.com/theia-ide/theia/blob/master/packages/terminal/src/browser/terminal-preferences.ts


export const DiagramPreferenceSchema: PreferenceSchema = {
    properties: {
        'diagram.shouldSelectDiagram': {
            type: 'boolean',
            description: 'Describes if a text segment selection should select the corresponding diagram element',
            default: true
        },
        'diagram.shouldSelectText': {
            type: 'boolean',
            description: 'Describes if a diagram element selection should select the corresponding text segments',
            default: true
        }
    }
}

export interface DiagramConfiguration {
    'diagram.shouldSelectDiagram': boolean
    'diagram.shouldSelectText': boolean
}

export const DiagramPreferences = Symbol('DiagramPreferences')
export type DiagramPreferences = PreferenceProxy<DiagramConfiguration>

export function createDiagramPreferences(preferences: PreferenceService): DiagramPreferences {
    return createPreferenceProxy(preferences, DiagramPreferenceSchema)
}

export function bindDiagramPreferences(bind: interfaces.Bind): void {
    bind(DiagramPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService)
        return createDiagramPreferences(preferences)
    })
    bind(PreferenceContribution).toConstantValue({ schema: DiagramPreferenceSchema })
}

/**
 * Message sent to the server that sets all preferences contained in the partial object sent as the parameter with the message.
 */
export const SET_PREFERENCES = 'keith/preferences/setPreferences'

export const KeithPreferenceServiceSymbol = Symbol('KeithPreferenceService')

/**
 * Service to store preferences that should be communicated to the language server.
 */
@injectable()
export class KeithDiagramPreferenceService {
    @inject(DiagramPreferences) protected readonly preferences: DiagramPreferences
    @inject(KeithLanguageClientContribution) client: KeithLanguageClientContribution

    @postConstruct()
    protected init() {
        // Send the currently stored preferences to the server and listen to changes in the preference file, once it is ready.
        this.preferences.ready.then(() => {
            this.sendPreferences(this.getPreferences())
            this.preferences.onPreferenceChanged(this.preferenceChanged.bind(this))
        })
    }

    /**
     * Returns the diagram preferences currently stored.
     */
    getPreferences(): DiagramConfiguration {
        return {
            'diagram.shouldSelectDiagram': this.preferences['diagram.shouldSelectDiagram'],
            'diagram.shouldSelectText': this.preferences['diagram.shouldSelectText']
        }
    }

    /**
     * Send the given preferences to the server via the language client.
     *
     * @param prefs The preferences stored as key-value pairs within an object.
     */
    async sendPreferences(prefs: object) {
        const lClient = await this.client.languageClient
        lClient.onReady().then(() => {
            lClient.sendNotification(SET_PREFERENCES, prefs)
        })
    }

    /**
     * Send the newly changed preference to the server.
     *
     * @param e The event that was issued containing information of the changed preference.
     */
    async preferenceChanged(e: PreferenceChangeEvent<DiagramConfiguration>) {
        // Put the changed preference in an object
        const newPreference: Partial<DiagramConfiguration> = {}
        newPreference[e.preferenceName] = e.newValue
        this.sendPreferences(newPreference)
    }
}