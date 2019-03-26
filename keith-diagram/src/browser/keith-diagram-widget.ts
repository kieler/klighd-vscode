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
import { ModelSource, TYPES } from 'sprotty';
import { DiagramWidget } from 'sprotty-theia';
import { KeithDiagramServer } from './keith-diagram-server';

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
        // If there already is a diagram server, then disconnect it first before re-initializing.
        const modelSource = this.diContainer.get<ModelSource>(TYPES.ModelSource)
        if (modelSource instanceof KeithDiagramServer && this.connector !== undefined) {
            this.connector.disconnect(modelSource)
        }
        // Re-initialize the widget with the new uri.
        this.options.uri = uri.toString(true)
        this.initializeSprotty()
    }
}