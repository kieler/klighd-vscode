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
import { WidgetConstructionOptions, WidgetManager } from '@theia/core/lib/browser';

/**
 * Creates and manages widgets in KEITH.
 */
export class KeithWidgetManager extends WidgetManager {
    // TODO: make the widget saveable again.
    toKey(options: WidgetConstructionOptions) {
        if (options.factoryId === 'keith-diagram-diagram-manager') {
            return options.factoryId
        } else {
            return super.toKey(options)
        }
    }

    fromKey(key: string) {
        if (key === 'keith-diagram-diagram-manager') {
            return {
                factoryId: key
            }
        } else {
            return super.fromKey(key)
        }
    }
}