/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import { inject, injectable, postConstruct } from 'inversify'
import { IActionDispatcher, ICommand, TYPES } from 'sprotty'
import { Action } from 'sprotty-protocol'
import { Registry } from './base/registry'
import { ResetPreferencesAction, SetPreferencesAction } from './options/actions'
import { Preference, TransformationOptionType } from './options/option-models'
import { Connection, NotificationType, PersistenceStorage, ServiceTypes } from './services'

/**
 * Indicates whether or not a text selection should select the corresponding diagram part. */
export class ShouldSelectDiagramOption implements Preference {
    static readonly ID: string = 'diagram.shouldSelectDiagram'

    static readonly NAME: string = 'Text Selects Diagram'

    readonly id: string = ShouldSelectDiagramOption.ID

    readonly name: string = ShouldSelectDiagramOption.NAME

    readonly type: TransformationOptionType = TransformationOptionType.CHECK

    readonly initialValue: boolean = false

    currentValue = false

    notifyServer = true
}

/**
 * Indicates whether or nat a selection in the diagram should also highlight the corresponding text.
 */
export class ShouldSelectTextOption implements Preference {
    static readonly ID: string = 'diagram.shouldSelectText'

    static readonly NAME: string = 'Diagram Selects Text'

    readonly id: string = ShouldSelectTextOption.ID

    readonly name: string = ShouldSelectTextOption.NAME

    readonly type: TransformationOptionType = TransformationOptionType.CHECK

    readonly initialValue: boolean = true

    currentValue = true

    notifyServer = true
}

/**
 * Instructs the server if the diagram should be sent incrementally in pieces.
 */
export class IncrementalDiagramGeneratorOption implements Preference {
    static readonly ID: string = 'diagram.incrementalDiagramGenerator'

    static readonly NAME: string = 'Incremental Diagram Generator'

    readonly id: string = IncrementalDiagramGeneratorOption.ID

    readonly name: string = IncrementalDiagramGeneratorOption.NAME

    readonly type: TransformationOptionType = TransformationOptionType.CHECK

    readonly initialValue: boolean = false

    currentValue = false

    notifyServer = true
}

export interface PreferenceType {
    readonly ID: string
    readonly NAME: string
    new (): Preference
}

/**
 * {@link Registry} that stores user preferences which change the behavior of the diagram view.
 *
 * This registry should store options or preferences that are not provided by the Synthesis as LayoutOptions but that also
 * should be send to the server.
 * In contrast to RenderOptions they are cannot be solely handled by the client.
 */
@injectable()
export class PreferencesRegistry extends Registry {
    private _preferences: Map<string, Preference> = new Map()

    @inject(ServiceTypes.Connection) private connection: Connection

    @inject(ServiceTypes.PersistenceStorage) private storage: PersistenceStorage

    @inject(TYPES.IActionDispatcher) private dispatcher: IActionDispatcher

    constructor() {
        super()
        // Add available preferences
        this.register(ShouldSelectDiagramOption)
        this.register(ShouldSelectTextOption)
        this.register(IncrementalDiagramGeneratorOption)
    }

    @postConstruct()
    init(): void {
        this.storage.onClear(this.handleClear.bind(this))
        this.storage
            .getItem<Record<string, unknown>>('preference')
            .then((data) => {
                if (data) this.loadPersistedData(data)
            })
            .then(() => {
                // Wait until values are loaded before notifying.
                this.notifyListeners()
                // Notify the server about initial preferences.
                this.notifyServer()
            })
    }

    /**
     * Restores options that where previously persisted in storage.
     * Since preferences are not provided by the server, they have to be retrieved from storage.
     */
    private loadPersistedData(data: Record<string, unknown>) {
        for (const entry of Object.entries(data)) {
            const option = this._preferences.get(entry[0])
            if (option) {
                // eslint-disable-next-line prefer-destructuring
                option.currentValue = entry[1]
            }
        }
    }

    register(Option: PreferenceType): void {
        this._preferences.set(Option.ID, new Option())
    }

    handle(action: Action): void | Action | ICommand {
        if (SetPreferencesAction.isThisAction(action)) {
            // Update storage values
            this.storage.setItem<Record<string, boolean>>('preference', (prev) => {
                const obj: Record<string, boolean> = prev ?? {}
                for (const option of action.options) {
                    obj[option.id] = option.value
                    // Update local value from storage
                    const localPreference = this._preferences.get(option.id)
                    if (localPreference) {
                        localPreference.currentValue = option.value
                    }
                }
                return obj
            })
            this.notifyListeners()
            this.notifyServer()
        } else if (ResetPreferencesAction.isThisAction(action)) {
            this._preferences.forEach((option) => {
                option.currentValue = option.initialValue
            })
            this.notifyListeners()
        }
    }

    /** Notifies the server about changed preferences that are supported by the server. */
    private notifyServer() {
        this.connection.onReady().then(async () => {
            const obj = {
                'diagram.shouldSelectDiagram': this.getValue(ShouldSelectDiagramOption),
                'diagram.shouldSelectText': this.getValue(ShouldSelectTextOption),
                'diagram.incrementalDiagramGenerator': this.getValue(IncrementalDiagramGeneratorOption),
            }
            this.connection.sendNotification(NotificationType.SetPreferences, obj)
        })
    }

    getValue(option: PreferenceType): any | undefined {
        return this._preferences.get(option.ID)?.currentValue
    }

    /** Reset all stored options when the storage gets cleared from outside. */
    private handleClear() {
        this.dispatcher.dispatch(ResetPreferencesAction.create())
    }
}
