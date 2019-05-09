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
import { WidgetConstructionOptions, WidgetManager } from '@theia/core/lib/browser';

/**
 * Creates and manages widgets in KEITH. Causes widgets for keith diagrams for different uris to still have the same identifying key.
 */
export class KeithWidgetManager extends WidgetManager {
    // TODO: make the widget saveable again.
    toKey(options: WidgetConstructionOptions) {
        if (options.factoryId === 'keith-diagram-diagram-manager') {
            return super.toKey({
                factoryId: options.factoryId,
                // the diagram widget for any uri is the same widget. For the key, still use a non-empty string, because if('') returns false in the isDiagramWidgetOptions check.
                options: { ...options.options, ...{uri: ' '} }
            })
        } else {
            return super.toKey(options)
        }
    }
}