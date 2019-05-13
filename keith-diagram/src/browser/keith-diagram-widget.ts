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
import { Widget } from '@phosphor/widgets';
import { Emitter, Event } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { InitializeCanvasBoundsAction, RequestModelAction } from 'sprotty';
import { DiagramWidget } from 'sprotty-theia';

/**
 * The single diagram widget that is openable for KEITH diagrams.
 */
export class KeithDiagramWidget extends DiagramWidget {
    /**
     * Emitter that should be fired whenever the model is updated.
     */
    protected readonly onModelUpdatedEmitter = new Emitter<string>()

    /**
     * Event that can be listened to that triggered whenever the model handled by this server is updated.
     */
    public readonly onModelUpdated: Event<string> = this.onModelUpdatedEmitter.event

    /**
     * Method to fire the internal event that should be caused whenever the model displayed in this widget is changed.
     */
    public modelUpdated(): void {
        this.onModelUpdatedEmitter.fire(this.options.uri)
    }

    /**
     * Re-initializes this widget for a new source URI.
     * @param uri The URI that should be listened to now.
     */
    public reInitialize(uri: URI): void {
        const uriString = uri.toString(true)
        // If the uri is already set as this one in the uri, the re-initialization is not necessary.
        if (this.options.uri !== uriString) {
            this.options.uri = uriString
            this.actionDispatcher.dispatch(new RequestModelAction({
                sourceUri: this.options.uri,
                diagramType: this.options.diagramType
            }));
        }
    }

    onResize(_msg: Widget.ResizeMessage): void {
        const newBounds = this.getBoundsInPage(this.node as Element)
        this.actionDispatcher.dispatch(new InitializeCanvasBoundsAction(newBounds))
    }
}