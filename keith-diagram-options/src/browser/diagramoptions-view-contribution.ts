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

import { DidCreateWidgetEvent, Widget, WidgetManager } from '@theia/core/lib/browser';
import { FrontendApplication, FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import URI from '@theia/core/lib/common/uri';
import { EditorManager, EditorWidget } from '@theia/editor/lib/browser';
import { inject, injectable } from 'inversify';
import { KeithDiagramManager } from 'keith-diagram/lib/keith-diagram-manager';
import { KeithDiagramServer } from 'keith-diagram/lib/keith-diagram-server';
import { id, KeithDiagramWidgetRegistry } from 'keith-diagram/lib/keith-diagram-widget-registry';
import { KeithLanguageClientContribution } from 'keith-language/lib/browser/keith-language-client-contribution';
import { DiagramWidget, DiagramWidgetRegistry } from 'theia-sprotty/lib';
import { GET_OPTIONS, SET_OPTIONS } from '../common';
import { SynthesisOption, ValuedSynthesisOption } from '../common/option-models';
import { DiagramOptionsViewWidget } from './diagramoptions-view-widget';

/**
 * The ID of the diagram options view widget.
 */
export const DIAGRAM_OPTIONS_WIDGET_FACTORY_ID = 'diagramoptions-view'
/**
 * The keybinding to toggle the diagram options view widget.
 */
export const OPEN_DIAGRAM_OPTIONS_WIDGET_KEYBINDING = 'ctrlcmd+shift+h'

/**
 * Frontend contribution of the diagram options view.
 */
@injectable()
export class DiagramOptionsViewContribution extends AbstractViewContribution<DiagramOptionsViewWidget> implements FrontendApplicationContribution {
    editorWidget: EditorWidget
    diagramOptionsViewWidget: DiagramOptionsViewWidget
    protected boundDiagramServer: KeithDiagramServer

    constructor(
        @inject(EditorManager) protected readonly editorManager: EditorManager,
        @inject(WidgetManager) protected readonly widgetManager: WidgetManager,
        @inject(KeithLanguageClientContribution) protected readonly client: KeithLanguageClientContribution,
        @inject(KeithDiagramManager) protected readonly diagramManager: KeithDiagramManager,
        @inject(DiagramWidgetRegistry) protected readonly diagramWidgetRegistry: DiagramWidgetRegistry
    ) {
        super({
            widgetId: DIAGRAM_OPTIONS_WIDGET_FACTORY_ID,
            widgetName: 'Diagram Options',
            defaultWidgetOptions: {
                area: 'right',
                rank: 500
            },
            toggleCommandId: 'diagramOptionsView:toggle',
            toggleKeybinding: OPEN_DIAGRAM_OPTIONS_WIDGET_KEYBINDING
        })

        // Set up event listeners.
        editorManager.onCurrentEditorChanged(this.currentEditorChanged.bind(this))
        if (editorManager.activeEditor) {
            // if there is already an active editor, use that to initialize
            this.editorWidget = editorManager.activeEditor
            this.currentEditorChanged(this.editorWidget)
        }
        diagramManager.onDiagramOpened(this.onDiagramOpened.bind(this))
        widgetManager.onDidCreateWidget(this.onDidCreateWidget.bind(this))
        diagramWidgetRegistry.onWidgetsChanged()(this.onDiagramWidgetsChanged.bind(this))

        // Create and initialize a new widget.
        const widgetPromise = this.widgetManager.getWidget(DiagramOptionsViewWidget.widgetId)
        widgetPromise.then(widget => {
            this.initializeDiagramOptionsViewWidget(widget)
        })
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView()
    }

    /**
     * Initializes the widget.
     * @param widget The diagram options widget to initialize
     */
    private initializeDiagramOptionsViewWidget(widget: Widget | undefined) {
        if (widget instanceof DiagramOptionsViewWidget) {
            this.diagramOptionsViewWidget = widget as DiagramOptionsViewWidget
            this.diagramOptionsViewWidget.onSendNewOption(this.sendNewOption.bind(this))
            this.diagramOptionsViewWidget.onActivateRequest(this.updateContent.bind(this))
            this.diagramOptionsViewWidget.onGetOptions(this.updateContent.bind(this))
        }
    }

    /**
     * Sends the new option to the server via the language client. The server then might cause the diagram to update with this new option.
     * @param option The newly configured synthesis option.
     */
    async sendNewOption(option: SynthesisOption) {
        const lClient = await this.client.languageClient
        const param = {
            uri: this.editorWidget.editor.uri.toString(),
            synthesisOptions: [{
                currentValue: option.currentValue,
                sourceHash: option.sourceHash
            }]
        }
        await lClient.sendRequest(SET_OPTIONS, param)
    }

    onDidCreateWidget(e: DidCreateWidgetEvent): void {
        // Initialize the widget and update its content when the widget is created.
        if (e.factoryId === DiagramOptionsViewWidget.widgetId) {
            this.initializeDiagramOptionsViewWidget(e.widget)
            this.updateContent()
        }
    }

    /**
     * Called whenever a new diagram view is created and this view should listen to its model changes to update the visible options.
     * @param uri The URI of the opened diagram.
     */
    async onDiagramOpened(uri: URI) {
        if (this.diagramWidgetRegistry instanceof KeithDiagramWidgetRegistry) {
            const diagramWidget = this.diagramWidgetRegistry.getWidgetById(id)
            if (diagramWidget instanceof DiagramWidget
                && diagramWidget.modelSource instanceof KeithDiagramServer
                && this.boundDiagramServer !== diagramWidget.modelSource) {
                // Binds the diagram server to call this onModelUpdated function when its model gets updated.
                this.boundDiagramServer = diagramWidget.modelSource
                diagramWidget.modelSource.onModelUpdated(this.onModelUpdated.bind(this))
            }
        }
    }

    /**
     * Called whenever a new model is being displayed by the diagram view. Updates the visible options according to the new model.
     * @param uri The URI the model was created from.
     */
    async onModelUpdated(uri: string) {
        if (this.diagramOptionsViewWidget) {
            this.updateContent()
        }
    }

    /**
     * Called whenever the diagram widget changed (opened or closed). Clear the diagram options view.
     */
    onDiagramWidgetsChanged(): void {
        this.diagramOptionsViewWidget.setSynthesisOptions([])
        this.diagramOptionsViewWidget.update()
    }

    /**
     * Called whenever the currently active editor changes.
     * @param eWidget The editor widget that changed.
     */
    currentEditorChanged(eWidget: EditorWidget | undefined): void {
        // Remember the currently active widget.
        if (eWidget) {
            this.editorWidget = eWidget
        }
        // If the view is not initialized yet, do that now.
        if (!this.diagramOptionsViewWidget || this.diagramOptionsViewWidget.isDisposed) {
            const widgetPromise = this.widgetManager.getWidget('diagramoptions-view')
            widgetPromise.then(widget => {
                this.initializeDiagramOptionsViewWidget(widget)
            })
        }
    }

    /**
     * Updates the content of the diagram options widget. Sends a request to the server to get the options of the currently opened model and display them in the widget.
     */
    async updateContent() {
        if (this.editorWidget) {
            // Get the options from the server.
            const lClient = await this.client.languageClient
            const param = {
                uri: this.editorWidget.editor.uri.toString()
            }
            const valuedOptions: ValuedSynthesisOption[] = await lClient.sendRequest(GET_OPTIONS, param) as ValuedSynthesisOption[]
            const options: SynthesisOption[] = []

            // Set up the current value of all options.
            if (valuedOptions) {
                valuedOptions.forEach(valuedOption => {
                    const option = valuedOption.synthesisOption
                    if (valuedOption.currentValue === undefined) {
                        option.currentValue = option.initialValue
                    } else {
                        option.currentValue = valuedOption.currentValue
                    }
                    options.push(option)
                })
            }
            // Update the widget.
            this.diagramOptionsViewWidget.setSynthesisOptions(options)
            this.diagramOptionsViewWidget.update()
        }
    }
}