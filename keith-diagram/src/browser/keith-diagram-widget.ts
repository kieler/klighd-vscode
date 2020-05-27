/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2018, 2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import { CommandRegistry, Emitter, Event } from '@theia/core';
import { Widget } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject } from 'inversify';
import { FitToScreenAction, InitializeCanvasBoundsAction, ModelSource, RequestModelAction, TYPES } from 'sprotty';
import { DiagramWidget, DiagramWidgetOptions, TheiaDiagramServer } from 'sprotty-theia';
import { diagramPadding } from '../common/constants';

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

    @inject(CommandRegistry) protected readonly commands: CommandRegistry

    /**
     * Synchronize the diagram with the current editor.
     * This means a RequestModelAction is invoked on current editor change.
     */
    syncWithEditor: boolean = true

    /**
     * The diagram is always resized to fit if it is redrawn.
     */
    resizeToFit: boolean = true

    /**
     * Re-initializes this widget for a new source URI.
     * @param uri The URI that should be listened to now.
     */
    public reInitialize(uri: URI): void {
        const uriString = uri.toString(true)
        // If the uri is already set as this one in the uri, the re-initialization is not necessary.
        if (this.options.uri !== uriString) {
            this.options.uri = uriString
            if (this.syncWithEditor) {
                this.actionDispatcher.dispatch(new RequestModelAction({
                    sourceUri: this.options.uri,
                    diagramType: this.options.diagramType
                }));
            }
        }
    }

    protected initializeSprotty(): void {
        const modelSource = this.diContainer.get<ModelSource>(TYPES.ModelSource);
        this._modelSource = modelSource;
        if (modelSource instanceof TheiaDiagramServer && this.connector)
            this.connector.connect(modelSource);
        this.disposed.connect(() => {
            if (modelSource instanceof TheiaDiagramServer && this.connector)
                this.connector.disconnect(modelSource);
        });
        if (this.syncWithEditor) {
            this.actionDispatcher.dispatch(new RequestModelAction({
                sourceUri: this.options.uri,
                diagramType: this.options.diagramType
            }));
        }
    }

    onResize(_msg: Widget.ResizeMessage): void {
        const newBounds = this.getBoundsInPage(this.node as Element)
        this.actionDispatcher.dispatch(new InitializeCanvasBoundsAction(newBounds))
        if (this.resizeToFit) {
            this.actionDispatcher.dispatch(new FitToScreenAction(['$root'], diagramPadding, undefined, false))
        }
    }

    storeState():  KeithDiagramWidget.Data {
        let options: KeithDiagramWidget.Data = super.storeState() as KeithDiagramWidget.Data
        options.syncWithEditor = this.syncWithEditor
        options.resizeToFit = this.resizeToFit
        return options
    }

    restoreState(oldState: KeithDiagramWidget.Data): void {
        super.restoreState(oldState)
        this.syncWithEditor = oldState.resizeToFit === undefined || oldState.syncWithEditor
        this.resizeToFit = oldState.resizeToFit === undefined || oldState.resizeToFit
    }
}

export namespace KeithDiagramWidget {
    export interface Data extends DiagramWidgetOptions {
        syncWithEditor: boolean
        resizeToFit: boolean
    }
}