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

import { PreferenceSchema, PreferenceProxy, createPreferenceProxy, PreferenceService, PreferenceContribution } from "@theia/core/lib/browser";
import { interfaces } from "inversify";

export const KeithPreferenceSchema: PreferenceSchema = {
    properties: {
        'keith.open-welcome-page': {
            type: 'boolean',
            description: 'Whether the welcome page should be opened on start.',
            default: true,
            overridable: true
        }
    }
}

export interface KeithConfiguration {
    'keith.open-welcome-page': boolean
}

export const KeithPreferences = Symbol('KeithPreferences')
export type KeithPreferences = PreferenceProxy<KeithConfiguration>

export function createKeithPreferences(preferences: PreferenceService): KeithPreferences {
    return createPreferenceProxy(preferences, KeithPreferenceSchema)
}

export function bindKeithPreferences(bind: interfaces.Bind): void {
    bind(KeithPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get<PreferenceService>(PreferenceService)
        return createKeithPreferences(preferences)
    })
    bind(PreferenceContribution).toDynamicValue(() => {
        return { schema: KeithPreferenceSchema }
    })
}