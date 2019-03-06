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

import URI from '@theia/core/lib/common/uri';
import { injectable } from 'inversify';
import { DiagramWidgetRegistry } from 'theia-sprotty/lib';

const DIAGRAM: string = 'keith#'
/**
 * The id of the only widget created and handled by this registry.
 */
export const id: string = 'widget-diagram'

/**
 * Extension to the DiagramWidgetRegistry to only allow for a single diagram widget.
 */
@injectable()
export class KeithDiagramWidgetRegistry extends DiagramWidgetRegistry {
    protected getKey(uri: URI, diagramType: string) {
        // The widget's ID is now only dependent on the diagram type
        return DIAGRAM + diagramType
    }

    nextId(): string {
        return id
    }
}