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

import { UpdateDiagramOptionsAction } from '@kieler/keith-diagram-options/src/common/actions';
import { KeithDiagramManager } from '@kieler/keith-diagram/lib/browser/keith-diagram-manager';
import { updateOptions } from '@kieler/keith-diagram/lib/browser/keith-diagram-server';
import { KeithDiagramWidget } from '@kieler/keith-diagram/lib/browser/keith-diagram-widget';
import { RefreshDiagramAction } from '@kieler/keith-interactive/lib/actions';
import { KeithLanguageClientContribution } from '@kieler/keith-language/lib/browser/keith-language-client-contribution';
import { RenderOption, RenderOptions } from '@kieler/keith-sprotty/lib/options';
import { Command, CommandHandler, CommandRegistry } from '@theia/core';
import { DidCreateWidgetEvent, Widget, WidgetManager } from '@theia/core/lib/browser';
import { FrontendApplication, FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { inject, injectable } from 'inversify';
import { PERFORM_ACTION, SET_LAYOUT_OPTIONS, SET_SYNTHESIS_OPTIONS, diagramOptionsWidgetId, SPROTTY_ACTION } from '../common';
import { LayoutOptionValue, SynthesisOption } from '../common/option-models';
import { DiagramOptionsViewWidget } from './diagramoptions-view-widget';

/**
 * The keybinding to toggle the diagram options view widget.
 */
export const OPEN_DIAGRAM_OPTIONS_WIDGET_KEYBINDING = 'ctrlcmd+shift+h'

/**
 * Frontend contribution of the diagram options view.
 */
@injectable()
export class DiagramOptionsViewContribution extends AbstractViewContribution<DiagramOptionsViewWidget> implements FrontendApplicationContribution {

    /**
     * The URI of the model this diagram options view is currently synchronized with.
     */
    modelUri: string

    diagramOptionsViewWidget: DiagramOptionsViewWidget

    /**
     * Client side render options.
     */
    private rOptions: RenderOptions

    /**
     * The dynamically registered commands for the current diagram options.
     */
    protected registeredCommands: Command[]

    constructor(
        @inject(WidgetManager) protected readonly widgetManager: WidgetManager,
        @inject(KeithLanguageClientContribution) protected readonly client: KeithLanguageClientContribution,
        @inject(KeithDiagramManager) protected readonly diagramManager: KeithDiagramManager,
        @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry
    ) {
        super({
            widgetId: diagramOptionsWidgetId,
            widgetName: 'Diagram Options',
            defaultWidgetOptions: {
                area: 'right',
                rank: 500
            },
            toggleCommandId: 'diagramOptionsView:toggle',
            toggleKeybinding: OPEN_DIAGRAM_OPTIONS_WIDGET_KEYBINDING
        })

        this.registeredCommands = []

        // Set up event listeners.
        widgetManager.onDidCreateWidget(this.onDidCreateWidget.bind(this))

        // Create and initialize a new widget.
        const widgetPromise = this.widgetManager.getWidget(diagramOptionsWidgetId)
        widgetPromise.then(widget => {
            this.initializeDiagramOptionsViewWidget(widget)
        })
    }

    /**
     * This opens the widget on startup.
     * @param app The app.
     */
    onDidInitializeLayout(app: FrontendApplication) {
        this.openView()
    }

    /**
     * Initializes the widget.
     * @param widget The diagram options widget to initialize
     */
    private initializeDiagramOptionsViewWidget(widget: Widget | undefined): void {
        if (widget instanceof DiagramOptionsViewWidget) {
            this.diagramOptionsViewWidget = widget as DiagramOptionsViewWidget
            this.diagramOptionsViewWidget.onSendNewSynthesisOption(this.sendNewSynthesisOption.bind(this))
            this.diagramOptionsViewWidget.onSendNewLayoutOption(this.sendNewLayoutOption.bind(this))
            this.diagramOptionsViewWidget.onSendNewAction(this.sendNewAction.bind(this))
            this.diagramOptionsViewWidget.onSendNewRenderOption(this.sendNewRenderOption.bind(this))
            updateOptions(this.updateOptionsAction.bind(this))
        }
    }

    /**
     * Sends the new synthesis option to the server via the language client. The server then might cause the diagram to update with this new option.
     * @param option The newly configured synthesis option.
     */
    async sendNewSynthesisOption(option: SynthesisOption): Promise<void> {
        this.sendNewNotificationMessage(SET_SYNTHESIS_OPTIONS, { synthesisOptions: [option] })
    }

    /**
     * Sends the new layout option to the server via the language client. The server then might cause the diagram to update with this new option.
     * @param optionValue The newly configured layout option.
     */
    async sendNewLayoutOption(optionValue: LayoutOptionValue): Promise<void> {
        this.sendNewNotificationMessage(SET_LAYOUT_OPTIONS, { layoutOptions: [optionValue] })
    }

    /**
     * Sends the action id to the language server via the language client. The server then will perform the action matching that id and might cause the diagram to update with this
     * new option.
     * @param actionId The id of the action that should be performed.
     */
    async sendNewAction(actionId: string): Promise<void> {
        this.sendNewNotificationMessage(PERFORM_ACTION, { actionId: actionId })
    }

    /**
     * Updates the render option and the diagram.
     * @param option The newly configured render option.
     */
    async sendNewRenderOption(option: RenderOption) {
        this.rOptions.set(option.id, option.currentValue)
        // Update the diagram to draw according to the changed render option.
        const lClient = await this.client.languageClient
        await lClient.sendNotification(SPROTTY_ACTION, {clientId: 'keith-diagram_sprotty', action: new RefreshDiagramAction()})
    }

    /**
     * Sends any message with any parameter as a notification to the language server.
     * @param messageType The message type as a complete string, such as 'module/specificNotification'
     * @param param The parameter to be sent with the message. There is nothing checking if the parameter fits the message type.
     */
    async sendNewNotificationMessage(messageType: string, param: any): Promise<void> {
        const lClient = await this.client.languageClient
        await lClient.sendNotification(messageType, { uri: this.modelUri, ...param })
    }

    onDidCreateWidget(e: DidCreateWidgetEvent): void {
        if (e.factoryId === this.diagramManager.id) {
            // Bind the onModelUpdated method here to the modelUpdated event of the diagram widget.
            if (e.widget instanceof KeithDiagramWidget) {
                const renderOptions = (e.widget as KeithDiagramWidget).diContainer.get(RenderOptions)
                if (renderOptions) {
                    this.rOptions = renderOptions

                    // Get option from local storage if it exists.
                    let localRenderOptions: RenderOption[] = []
                    this.rOptions.getRenderOptions().forEach(option => {
                        const localStorageString = window.localStorage.getItem(option.id);
                        if (localStorageString) {
                            const localStorageValue: RenderOption = JSON.parse(localStorageString)
                            localRenderOptions.push(localStorageValue)
                        } else {
                            localRenderOptions.push(option)
                        }
                    });
                    this.rOptions.renderOptions = localRenderOptions
                    if (this.diagramOptionsViewWidget) {
                        this.diagramOptionsViewWidget.setRenderOptions(localRenderOptions)
                    }
                }
                e.widget.disposed.connect(() => {
                    this.onDiagramWidgetsClosed()
                })
            }
        } else if (e.factoryId === diagramOptionsWidgetId) {
            // Initialize the widget and update its content when the widget is created.
            this.initializeDiagramOptionsViewWidget(e.widget)
            if (this.rOptions) {
                (e.widget as DiagramOptionsViewWidget).setRenderOptions(this.rOptions.getRenderOptions())
            }
        }
    }

    /**
     * Called whenever the diagram widget is closed. Clear the diagram options view.
     */
    onDiagramWidgetsClosed(): void {
        this.diagramOptionsViewWidget.setSynthesisOptions([])
        this.diagramOptionsViewWidget.setRenderOptions([])
        this.diagramOptionsViewWidget.setLayoutOptions([])
        this.diagramOptionsViewWidget.setActions([])
        this.diagramOptionsViewWidget.update()
    }

    async updateOptionsAction(action: UpdateDiagramOptionsAction): Promise<void> {
        const valuedSynthesisOptions = action.valuedSynthesisOptions
        const layoutOptions = action.layoutOptions
        const actions = action.actions
        const modelUri = action.modelUri
        this.modelUri = modelUri

        const synthesisOptions: SynthesisOption[] = []

        // Set up the current value of all options.
        if (valuedSynthesisOptions) {
            valuedSynthesisOptions.forEach(valuedOption => {
                const option = valuedOption.synthesisOption
                if (valuedOption.currentValue === undefined) {
                    option.currentValue = option.initialValue
                } else {
                    option.currentValue = valuedOption.currentValue
                }
                synthesisOptions.push(option)
            })
        }

        // Register commands in the command palette.
        this.registeredCommands.forEach(command => {
            this.commandRegistry.unregisterCommand(command)
        });
        this.registeredCommands = []
        if (actions) {
            actions.forEach( action => {
                const command: Command = {id: "Diagram: " + action.actionId, label: "Diagram: " + action.displayedName}
                this.registeredCommands.push(command)
                const handler: CommandHandler = {
                    execute: () => {
                        this.sendNewAction(action.actionId);
                    }
                }
                this.commandRegistry.registerCommand(command, handler)
            })
        }

        // Update the widget.
        this.diagramOptionsViewWidget.setSynthesisOptions(synthesisOptions)
        this.diagramOptionsViewWidget.setLayoutOptions(layoutOptions)
        this.diagramOptionsViewWidget.setActions(actions)
        this.diagramOptionsViewWidget.update()
    }

}