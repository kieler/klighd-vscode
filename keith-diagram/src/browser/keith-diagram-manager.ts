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

import { OpenerOptions } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { EditorManager, EditorWidget } from '@theia/editor/lib/browser';
import { LanguageClientContribution } from '@theia/languages/lib/browser';
import { inject, injectable } from 'inversify';
import { KeithLanguageClientContribution } from 'keith-language/lib/browser/keith-language-client-contribution';
import { RequestModelAction } from 'sprotty/lib';
import { DiagramManagerImpl, DiagramWidget, DiagramWidgetRegistry, TheiaDiagramServer, TheiaFileSaver, TheiaSprottyConnector } from 'theia-sprotty/lib';
import { KeithDiagramWidgetRegistry } from './keith-diagram-widget-registry';

/**
 * Class managing the creation of KEITH diagram widgets and connecting them to their diagram server.
 * Based on the theia-yang-extension implementation by TypeFox.
 * @see https://github.com/theia-ide/yangster/blob/master/theia-yang-extension/src/frontend/yangdiagram/yang-diagram-manager.ts
 */
@injectable()
export class KeithDiagramManager extends DiagramManagerImpl {

    readonly diagramType = 'keith-diagram'
    readonly iconClass = 'fa fa-square-o'

    _diagramConnector: TheiaSprottyConnector

    constructor(@inject(KeithLanguageClientContribution) languageClientContribution: LanguageClientContribution,
        @inject(TheiaFileSaver) theiaFileSaver: TheiaFileSaver,
        @inject(EditorManager) editorManager: EditorManager,
        @inject(DiagramWidgetRegistry) diagramWidgetRegistry: DiagramWidgetRegistry,
        @inject(KeithDiagramWidgetRegistry) protected readonly widgetRegistry: KeithDiagramWidgetRegistry) {
        super()
        this._diagramConnector = new TheiaSprottyConnector(languageClientContribution, theiaFileSaver, editorManager, diagramWidgetRegistry)
        editorManager.onCurrentEditorChanged(this.onCurrentEditorChanged.bind(this))
    }

    /**
     * Opens the diagram widget automatically if the current editor has changed.
     *
     * @param editorWidget The editor that is now active.
     */
    onCurrentEditorChanged(editorWidget: EditorWidget | undefined): void {
        if (editorWidget) {
            const uri = editorWidget.getResourceUri()
            if (uri instanceof URI) {
                this.open(editorWidget.getResourceUri() as URI)
            }
        }
    }

    open(uri: URI, input?: OpenerOptions): Promise<DiagramWidget> {
        const promiseDiagramWidget = this.getOrCreateDiagramWidget(uri)
        promiseDiagramWidget.then(diagramWidget => {
            window.requestAnimationFrame(() => {
                // Do not activate the widget and only reveal it, because we don't want the diagram widget to gain focus.
                this.shell.revealWidget(diagramWidget.id)
                this.onDiagramOpenedEmitter.fire(uri)
            })
        })
        return promiseDiagramWidget
    }

    async getOrCreateDiagramWidget(uri: URI): Promise<DiagramWidget> {
        const widget = await this.widgetRegistry.getWidget(uri, this.diagramType)
        if (widget !== undefined && widget instanceof DiagramWidget) {
            // reconfigure the diagram server to watch the new file by sending a new RequestModelAction with the new uri to the server.
            if (widget.modelSource instanceof TheiaDiagramServer && this.diagramConnector) {
                widget.actionDispatcher.dispatch(new RequestModelAction({
                    sourceUri: uri.toString(true),
                    diagramType: this.diagramType
                }))
            }
            return widget
        }
        const newWidget = this.createDiagramWidget(uri)
        this.addToShell(newWidget)
        return Promise.resolve(newWidget)
    }

    createDiagramWidget(uri: URI): DiagramWidget {
        const newWidget = super.createDiagramWidget(uri)
        newWidget.title.label = 'Diagram'
        return newWidget
    }

    get diagramConnector() {
        return this._diagramConnector
    }

    get label() {
        return 'Keith diagram'
    }
}