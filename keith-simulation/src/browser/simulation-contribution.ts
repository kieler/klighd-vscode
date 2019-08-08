/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

 import { SimulationWidget } from "./simulation-widget";
import { injectable, inject } from "inversify";
import { AbstractViewContribution, FrontendApplicationContribution, WidgetManager,
    FrontendApplication, KeybindingRegistry, CommonMenus, Widget, DidCreateWidgetEvent } from "@theia/core/lib/browser";
import { Workspace, NotificationType } from "@theia/languages/lib/browser";
import { MessageService, Command, CommandRegistry, MenuModelRegistry } from "@theia/core";
import { EditorManager } from "@theia/editor/lib/browser";
import { OutputChannelManager } from "@theia/output/lib/common/output-channel";
import { FileSystemWatcher } from "@theia/filesystem/lib/browser";
import { simulationWidgetId, OPEN_SIMULATION_WIDGET_KEYBINDING, SimulationStartedMessage, SimulationStoppedMessage, SimulationStepMessage, SimulationData } from "../common";
import { KeithLanguageClientContribution } from "@kieler/keith-language/lib/browser/keith-language-client-contribution";
import { SimulationKeybindingContext } from "./simulation-keybinding-context";
import { KiCoolContribution } from "@kieler/keith-kicool/lib/browser/kicool-contribution"
import { delay, strMapToObj } from "../common/helper";
import { MiniBrowserCommands } from "@theia/mini-browser/lib/browser/mini-browser-open-handler"
import { WindowService } from "@theia/core/lib/browser/window/window-service";
import { KeithDiagramManager } from "@kieler/keith-diagram/lib/keith-diagram-manager";
import { TabBarToolbarContribution, TabBarToolbarRegistry } from "@theia/core/lib/browser/shell/tab-bar-toolbar";

export const SIMULATION_CATEGORY = "Simulation"
/**
 * Command to open the simulation widget
 */
export const SIMULATION: Command = {
    id: 'simulation:toggle',
    label: 'Simulation View'
}

/**
 * Command to restart a simulation.
 */
export const SIMULATE: Command = {
    id: 'simulate',
    label: 'Restart simulation'
}

export const COMPILE_AND_SIMULATE: Command = {
    id: 'compile-and-simulate',
    label: 'Simulate'
}

export const OPEN_INTERNAL_KVIZ_VIEW: Command = {
    id: 'open-kviz-internal',
    label: 'Open KViz view in internal browser preview',
    iconClass: 'fa fa-file-image-o'
}

export const OPEN_EXTERNAL_KVIZ_VIEW: Command = {
    id: 'open-kviz-external',
    label: 'Open KViz view in external browser',
    iconClass: 'fa fa-external-link'
}

export const externalStepMessageType = new NotificationType<SimulationStepMessage, void>('keith/simulation/didStep');
export const valuesForNextStepMessageType = new NotificationType<Object, void>('keith/simulation/valuesForNextStep');
export const externalStopMessageType = new NotificationType<void, void>('keith/simulation/externalStop')
export const startedSimulationMessageType = new NotificationType<SimulationStartedMessage, void>('keith/simulation/started')

/**
 * Contribution for SimulationWidget to add functionality to it.
 */
@injectable()
export class SimulationContribution extends AbstractViewContribution<SimulationWidget> implements FrontendApplicationContribution, TabBarToolbarContribution {

    simulationWidget: SimulationWidget

    progressMessageType = new NotificationType<any, void>('keith/kicool/progress');

    @inject(CommandRegistry) public readonly commandRegistry: CommandRegistry
    @inject(EditorManager) public readonly editorManager: EditorManager
    @inject(FileSystemWatcher) protected readonly fileSystemWatcher: FileSystemWatcher
    @inject(FrontendApplication) public readonly front: FrontendApplication
    @inject(KeithLanguageClientContribution) public readonly client: KeithLanguageClientContribution
    @inject(KiCoolContribution) public readonly kicoolContribution: KiCoolContribution
    @inject(MessageService) protected readonly messageService: MessageService
    @inject(OutputChannelManager) protected readonly outputManager: OutputChannelManager
    @inject(SimulationKeybindingContext) protected readonly simulationKeybindingContext: SimulationKeybindingContext
    @inject(WindowService) public readonly windowService: WindowService
    @inject(Workspace) protected readonly workspace: Workspace


    constructor(
        @inject(WidgetManager) protected readonly widgetManager: WidgetManager
    ) {
        super({
            widgetId: simulationWidgetId,
            widgetName: 'Simulation',
            defaultWidgetOptions: {
                area: 'bottom',
                rank: 400
            },
            toggleCommandId: SIMULATION.id,
            toggleKeybinding: OPEN_SIMULATION_WIDGET_KEYBINDING
        });
        this.widgetManager.onDidCreateWidget(this.onDidCreateWidget.bind(this))
        // TODO: when the diagram closes, also update the view to the default one

    }

    /**
     * TODO This is never called ?!
     * @param app
     */
    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView()
    }

    async handleProgress(message: any) {
        console.log("Real Progress!!!!!" + message)
    }

    /**
     * Initializes the simulation widget and simulation contribution.
     * Currently this includes setting the simulation widget in the simulation contribution and
     * binding a function on the event that indicates that new compilation systems are added.
     *
     * @param widget created simulation widget
     */
    private async initializeSimulationWidget(widget: Widget | undefined) {
        if (widget) {
            this.simulationWidget = widget as SimulationWidget
            // whenever the compiler widget got new compilation systems from the LS new systems is invoked.
            this.kicoolContribution.compilerWidget.newSystemsAdded(this.newSystemsAdded.bind(this))
            this.kicoolContribution.compilationFinished(this.compilationFinished.bind(this))
            this.kicoolContribution.compilationStarted(this.compilationStarted.bind(this))
            this.kicoolContribution.showedNewSnapshot(this.showedNewSnapshot.bind(this))
        }
    }

    /**
     * Is executed whenever the compiler widget got new compilation systems from the LS.
     * Updates simulation widget, since these new compilation systems may contain simulation compilation systems.
     */
    newSystemsAdded() {
        this.simulationWidget.update()
    }

    compilationStarted() {
        this.simulationWidget.update()
    }

    /**
     * Called after compilation finished.
     */
    compilationFinished(successful: boolean) {
        if (this.simulationWidget.compilingSimulation) {
            this.simulationWidget.compilingSimulation = false
            this.simulationWidget.update()
            if (successful) {
                this.simulate()
            }
        } else {
            this.simulationWidget.update()
        }
    }

    showedNewSnapshot(lastShowedSnapshotName: string) {
        this.simulationWidget.lastShowedSnapshotName = lastShowedSnapshotName
        this.simulationWidget.update()
    }

    /**
     * Executed whenever a widget is created.
     * If a simulation widget is created this simulation contribution is initialized using this widget.
     */
    async onDidCreateWidget(e: DidCreateWidgetEvent): Promise<void> {
        if (e.factoryId === SimulationWidget.widgetId) {
            await this.initializeSimulationWidget(e.widget)
            const lClient = await this.client.languageClient
            while (!this.client.running) {
                await delay(100)
            }
            lClient.onNotification(this.progressMessageType, this.handleProgress.bind(this))
            lClient.onNotification(externalStepMessageType, this.handleStepMessage.bind(this))
            lClient.onNotification(valuesForNextStepMessageType, this.handleExternalNewUserValue.bind(this))
            lClient.onNotification(externalStopMessageType, this.handleExternalStop.bind(this))
            lClient.onNotification(startedSimulationMessageType, this.handleSimulationStarted.bind(this))
        }
    }

    registerCommands(commands: CommandRegistry) {
        commands.registerCommand(SIMULATION, {
            execute: async () => {
                this.openView({
                    toggle: true,
                    reveal: true
                })
            }
        })
        commands.registerCommand(SIMULATE, {
            execute: async () => {
                this.simulate()
            }
        })
        commands.registerCommand(COMPILE_AND_SIMULATE, {
            execute: async () => {
                this.compileAndStartSimulation()
            }
        })
        commands.registerCommand(OPEN_INTERNAL_KVIZ_VIEW, {
            isEnabled: widget => {
                return widget.id === simulationWidgetId
            },
            isVisible: widget => {
                return widget.id === simulationWidgetId
            },
            execute: () => {
                this.openInternalKVizView()
            }
        })
        commands.registerCommand(OPEN_EXTERNAL_KVIZ_VIEW, {
            isEnabled: widget => {
                return widget.id === simulationWidgetId
            },
            isVisible: widget => {
                return widget.id === simulationWidgetId
            },
            execute: () => {
                this.openExternalKVizView()
            }
        })
    }

    async registerToolbarItems(registry: TabBarToolbarRegistry): Promise<void> {
        registry.registerItem({
            id: OPEN_INTERNAL_KVIZ_VIEW.id,
            command: OPEN_INTERNAL_KVIZ_VIEW.id,
            tooltip: OPEN_INTERNAL_KVIZ_VIEW.label,
            priority: 0
        });
        registry.registerItem({
            id: OPEN_EXTERNAL_KVIZ_VIEW.id,
            command: OPEN_EXTERNAL_KVIZ_VIEW.id,
            tooltip: OPEN_EXTERNAL_KVIZ_VIEW.label,
            priority: 1
        });
    }

    /**
     * Invoke a simulation. This includes the compilation via a simulation CS.
     * Simulation is started via the compilationFinished method.
     */
    async compileAndStartSimulation() {
        this.simulationWidget.compilingSimulation = true
        this.simulationWidget.update()
        const selection = document.getElementById("simulation-list") as HTMLSelectElement;
        const option = selection.selectedOptions[0]
        if (option !== undefined) {
            // when simulating it should always compile inplace
            await this.kicoolContribution.compile(option.value, true, false)
        } else {
            this.message("Option is undefined, did not simulate", "ERROR")
        }
    }

    /**
     * Invoke simulation.
     * To be successful a compilation with a simulation compilation system has to be invoked before this function call.
     */
    async simulate() {
        // A simulation can only be invoked if a current editor widget exists and no simulation is currently running.
        if (this.kicoolContribution.editor && !this.simulationWidget.simulationRunning) {
            const lClient = await this.client.languageClient
            // The uri of the current editor is needed to identify the already compiled snapshot that is used to start the simulation.
            const uri = this.kicoolContribution.compilerWidget.lastCompiledUri
            // Check if language client was already initialized and wait till it is
            let initializeResult = lClient.initializeResult
            while (!initializeResult) {
                // language client was not initialized
                await delay(100)
                initializeResult = lClient.initializeResult
            }
            lClient.sendNotification("keith/simulation/start", [uri, this.simulationWidget.simulationType])
        }
    }

    /**
     * Simulate currently opened snapshot.
     */
    async simulateCurrentlyOpenedModel(command: string) {
        // A simulation can only be invoked if a current editor widget exists and no simulation is currently running.
        if (this.kicoolContribution.editor && !this.simulationWidget.simulationRunning) {
            const lClient = await this.client.languageClient
            // The uri of the current editor is needed to identify the already compiled snapshot that is used to start the simulation.
            const uri = this.kicoolContribution.compilerWidget.lastCompiledUri
            let index = this.kicoolContribution.indexMap.get(uri)
            if (index === undefined) {
                console.log("Index of snapshot is undefined, use original model instead")
                index = -1
            }
            lClient.sendNotification("keith/simulation/simulateCurrentlyOpenedModel",
                [uri, KeithDiagramManager.DIAGRAM_TYPE + '_sprotty', command, this.simulationWidget.simulationType])
        }
    }

    /**
     * Start simulation after server successfully started it.
     */
    handleSimulationStarted(startMessage: SimulationStartedMessage) {
        if (!startMessage.successful) {
            this.message(startMessage.error, "error")
            return
        }

        // Get the start configuration for the simulation
        const pool: Map<string, any> = new Map(Object.entries(startMessage.dataPool));
        const propertySet: Map<string, any> = new Map(Object.entries(startMessage.propertySet));
        // Inputs and outputs are handled separately
        let inputs: string[] = propertySet.get("input")
        inputs = inputs === undefined ? [] : inputs
        let outputs: string[] = propertySet.get("output")
        outputs = outputs === undefined ? [] : outputs
        propertySet.delete("input")
        propertySet.delete("output")
        // Construct list of all categories
        this.simulationWidget.categories = Array.from(propertySet.keys())
        pool.forEach((value, key) => {
            // Add list of properties to SimulationData
            let categoriesList: string[] = []
            propertySet.forEach((list, propertyKey) => {
                if (list.includes(key)) {
                    categoriesList.push(propertyKey)
                }
            })
            const newData: SimulationData = {data: [], input: inputs.includes(key), output: outputs.includes(key), categories: categoriesList}
            this.simulationWidget.simulationData.set(key, newData)
            // Set the value for which will be set for the next step for inputs
            if (inputs.includes(key)) {
                this.simulationWidget.valuesForNextStep.set(key, value)
            }
            this.simulationWidget.controlsEnabled = true
        })
        this.simulationWidget.simulationRunning = true
        this.simulationWidget.simulationStep = 0
        const widget = this.front.shell.revealWidget(simulationWidgetId)
        if (widget) {
            widget.update()
        }
    }

    /**
     * Executes a simulation step on the LS.
     */
    async executeSimulationStep() {
        const lClient = await this.client.languageClient
        // Transform the input map to an object since this is the format the LS supports
        let jsonObject = strMapToObj(this.simulationWidget.changedValuesForNextStep)
        lClient.sendNotification("keith/simulation/step", [jsonObject, "Manual"])
        // TODO Update data to indicate that a step is in process
        this.simulationWidget.update()
    }

    /**
     * Request a simulation stop from the LS.
     */
    public async stopSimulation() {
        this.setValuesToStopSimulation()
        const lClient = await this.client.languageClient
        const message: SimulationStoppedMessage = await lClient.sendRequest("keith/simulation/stop") as SimulationStoppedMessage
        if (!message.successful) {
            this.message(message.message, "ERROR")
        }
        this.simulationWidget.update()
    }

    private setValuesToStopSimulation() {
        // Stop all simulation, i.e. empty maps and kill simulation process on LS
        this.simulationWidget.valuesForNextStep.clear()
        this.simulationWidget.simulationData.clear()
        this.simulationWidget.play = false
        this.simulationWidget.controlsEnabled = false
        this.simulationWidget.simulationRunning = false
    }

    /**
     * Toggles play.
     * Begins to execute steps while waiting simulationWidget.simulationDelay between each step.
     */
    async startOrPauseSimulation() {
        this.simulationWidget.play = !this.simulationWidget.play
        this.simulationWidget.update()
        if (this.simulationWidget.play) {
            await this.waitForNextStep()
        }
    }

    /**
     * Execute a simulation step with a delay.
     */
    async waitForNextStep() {
        while (this.simulationWidget.play) {
            this.executeSimulationStep()
            await delay(this.simulationWidget.simulationStepDelay)
        }
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        [
            {
                command: SIMULATION.id,
                keybinding: OPEN_SIMULATION_WIDGET_KEYBINDING
            }
        ].forEach(binding => {
            keybindings.registerKeybinding(binding);
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
            commandId: SIMULATION.id,
            label: this.options.widgetName
        });
    }

    public message(message: string, type: string) {
        switch (type.toLowerCase()) {
            case "error":
                this.messageService.error(message)
                this.outputManager.getChannel("SCTX").appendLine("ERROR: " + message)
                break;
            case "warn":
                this.messageService.warn(message)
                this.outputManager.getChannel("SCTX").appendLine("WARN: " + message)
                break;
            case "info":
                this.messageService.info(message)
                this.outputManager.getChannel("SCTX").appendLine("INFO: " + message)
                break;
            default:
                this.messageService.log(message)
                this.outputManager.getChannel("SCTX").appendLine("LOG: " + message)
                break;
        }
    }

    /**
     * Is executed after the server finishes a step.
     * @param message data of step, includes new values.
     */
    handleStepMessage(message: SimulationStepMessage) {
        const pool: Map<string, any> = new Map(Object.entries(message.values));
        if (pool) {
            pool.forEach((value, key) => {
                // push value in history and set new input value
                const history = this.simulationWidget.simulationData.get(key)
                if (history !== undefined) {
                    // Push value in history
                    history.data.push(value)
                    this.simulationWidget.simulationData.set(key, history)
                    // The simulation may change. for example input output values
                    if (history.input) {
                        this.simulationWidget.valuesForNextStep.set(key, value)
                    }
                } else {
                    // This should not happen. An unexpected value was send by the server.
                    this.stopSimulation()
                    this.message("Unexpected value for " + key + "in simulation data, stopping simulation", "ERROR")
                    this.simulationWidget.update()
                    return false
                }
            });
        } else {
            this.message("Simulation data values are undefined", "ERROR")
        }
        this.simulationWidget.simulationStep++
        this.simulationWidget.changedValuesForNextStep.clear()
        this.simulationWidget.update()
        return true
    }

    handleExternalNewUserValue(values: Object) {
        console.log("external value", values)
    }

    handleExternalStop() {
        console.log("stop")
        this.setValuesToStopSimulation()
    }

    openInternalKVizView() {
        this.commandRegistry.executeCommand(MiniBrowserCommands.OPEN_URL.id, "https://localhost:5010/visualization")
    }

    openExternalKVizView() {
        this.windowService.openNewWindow("https://localhost:5010/visualization")
    }
}