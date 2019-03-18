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
import { Emitter, Event } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { DiagramWidget } from 'sprotty-theia';

/**
 * The single diagram widget that is openable for KEITH diagrams.
 */
export class KeithDiagramWidget extends DiagramWidget {
    /**
     * Emitter that should be fired whenever the model is updated.
     */
    protected readonly onModelUpdatedEmitter = new Emitter<void>()

    /**
     * Event that can be listened to that triggered whenever the model handled by this server is updated.
     */
    public readonly onModelUpdated: Event<void> = this.onModelUpdatedEmitter.event

    /**
     * Method to fire the internal event that should be caused whenever the model displayed in this widget is changed.
     * TODO: this really should not have to go through the diagram widget. Ask TypeFox for a generic solution.
     */
    public modelUpdated(): void {
        this.onModelUpdatedEmitter.fire()
    }

    /**
     * Re-initializes this widget for a new source URI.
     * @param uri The URI that should be listened to now.
     */
    public initialize(uri: URI): void {
        this.options.uri = uri.toString(true)
        this.initializeSprotty()
    }
}