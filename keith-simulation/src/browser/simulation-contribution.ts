/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2019,2020 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */

import { KeithDiagramWidget } from '@kieler/keith-diagram/lib/browser/keith-diagram-widget';
import { KiCoolContribution } from '@kieler/keith-kicool/lib/browser/kicool-contribution';
import { REQUEST_CS } from '@kieler/keith-kicool/lib/common/commands';
import { CompilationSystem } from '@kieler/keith-kicool/lib/common/kicool-models';
import { KeithLanguageClientContribution } from "@kieler/keith-language/lib/browser/keith-language-client-contribution";
import { Command, CommandHandler, CommandRegistry, MessageService } from "@theia/core";
import {
    AbstractViewContribution, DidCreateWidgetEvent, FrontendApplication, FrontendApplicationContribution, PrefixQuickOpenService,
    QuickOpenItem, QuickOpenMode, QuickOpenModel, QuickOpenOptions, QuickOpenService, StatusBar, StatusBarAlignment, Widget, WidgetManager
} from "@theia/core/lib/browser";
import { TabBarToolbarContribution, TabBarToolbarRegistry } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { WindowService } from "@theia/core/lib/browser/window/window-service";
import { EditorManager, EditorWidget } from "@theia/editor/lib/browser";
import { FileSystemWatcher } from "@theia/filesystem/lib/browser";
import { NotificationType, Workspace } from "@theia/languages/lib/browser";
import { MiniBrowserCommands } from "@theia/mini-browser/lib/browser/mini-browser-open-handler";
import { OutputChannelManager } from "@theia/output/lib/common/output-channel";
import { inject, injectable } from "inversify";
import { OPEN_SIMULATION_WIDGET_KEYBINDING, SimulationData, SimulationStartedMessage, SimulationStepMessage, SimulationStoppedMessage, simulationWidgetId } from "../common";
import {
    OPEN_EXTERNAL_KVIZ_VIEW, OPEN_INTERNAL_KVIZ_VIEW, OPEN_SIMULATION_WIDGET_AND_REQUEST_CS, REVEAL_SIMULATION_WIDGET,
    SELECT_SIMULATION_CHAIN, SELECT_SNAPSHOT_SIMULATION_CHAIN, SET_SIMULATION_SPEED, SIMULATE, SIMULATION
} from "../common/commands";
import { delay, strMapToObj } from "../common/helper";
import { SelectSimulationTypeCommand } from "./select-simulation-type-command";
import { SimulationKeybindingContext } from "./simulation-keybinding-context";
import { SimulationWidget } from "./simulation-widget";

export const SIMULATION_CATEGORY = "Simulation"

export const simulationCommandPrefix: string = 'simulation.'

export const externalStepMessageType = new NotificationType<SimulationStepMessage, void>('keith/simulation/didStep');
export const valuesForNextStepMessageType = new NotificationType<Object, void>('keith/simulation/valuesForNextStep');
export const externalStopMessageType = new NotificationType<string, void>('keith/simulation/externalStop')
export const startedSimulationMessageType = new NotificationType<SimulationStartedMessage, void>('keith/simulation/started')

export const simulationStatusPriority: number = 4
/**
 * Contribution for SimulationWidget to add functionality to it.
 */
@injectable()
export class SimulationContribution extends AbstractViewContribution<SimulationWidget> implements FrontendApplicationContribution, TabBarToolbarContribution {

    simulationWidget: SimulationWidget

    progressMessageType = new NotificationType<any, void>('keith/kicool/progress');

    simulationCommands: Command[] = []

    startTime: number
    endTime: number

    @inject(CommandRegistry) public readonly commandRegistry: CommandRegistry
    @inject(EditorManager) public readonly editorManager: EditorManager
    @inject(FileSystemWatcher) protected readonly fileSystemWatcher: FileSystemWatcher
    @inject(FrontendApplication) public readonly front: FrontendApplication
    @inject(KeithLanguageClientContribution) public readonly client: KeithLanguageClientContribution
    @inject(KiCoolContribution) public readonly kicoolContribution: KiCoolContribution
    @inject(MessageService) protected readonly messageService: MessageService
    @inject(OutputChannelManager) protected readonly outputManager: OutputChannelManager
    @inject(PrefixQuickOpenService) public readonly quickOpenService: PrefixQuickOpenService
    @inject(QuickOpenService) protected readonly openService: QuickOpenService
    @inject(SelectSimulationTypeCommand) protected readonly selectSimulationTypeCommand: SelectSimulationTypeCommand
    @inject(SimulationKeybindingContext) protected readonly simulationKeybindingContext: SimulationKeybindingContext
    @inject(WindowService) public readonly windowService: WindowService
    @inject(Workspace) protected readonly workspace: Workspace
    @inject(StatusBar) protected readonly statusbar: StatusBar


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
    }

    /**
     * This opens the widget on startup.
     * @param app The app.
     */
    onDidInitializeLayout(app: FrontendApplication) {
        this.openView()
    }

    onStart(): void {
        // Add an entry to the status bar that no simulation systems where requested
        // This entry is removed after simulation systems are added in registerSimulationCommands
        this.statusbar.setElement('simulation-status', {
            alignment: StatusBarAlignment.LEFT,
            priority: simulationStatusPriority,
            text: '$(spinner fa-pulse fa-fw) Waiting for simulation systems...',
            tooltip: 'Waiting for simulation systems...',
            // The command should open the simulation view if none was already opened
            // If one is already opened it should request compilation systems
            command: OPEN_SIMULATION_WIDGET_AND_REQUEST_CS.id
        })
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
            this.kicoolContribution.compilationFinished(this.compilationFinished.bind(this))
            this.kicoolContribution.compilationStarted(this.compilationStarted.bind(this))
            this.kicoolContribution.newSimulationCommands(this.registerSimulationCommands.bind(this))
        }
    }

    /**
     * Registers send systems as simulation systems in the command palette
     * @param systems systems that are assumed to be simulation systems
     */
    registerSimulationCommands(systems: CompilationSystem[]) {
        this.statusbar.removeElement('simulation-status')
        // remove existing commands
        this.simulationCommands.forEach(command => {
            this.commandRegistry.unregisterCommand(command)
        })
        // add new commands
        systems.forEach((system: CompilationSystem) => {
            const command: Command = {
                id: simulationCommandPrefix + system.id + (system.snapshotSystem ? '.snapshot' : ''),
                label: `Simulate ${system.snapshotSystem ? 'snapshot' : 'model'} via ${system.label}`, category: "Simulation"}
            this.simulationCommands.push(command)
            const handler: CommandHandler = {
                execute: () => {
                    this.compileAndStartSimulation(system)
                }
            }
            this.commandRegistry.registerCommand(command, handler)
        })
    }

    /**
     * Called after a compilation process was started
     */
    compilationStarted() {
        this.simulationWidget.update()
    }

    /**
     * Called after compilation finished.
     */
    compilationFinished(successful: boolean) {
        if (this.simulationWidget.compilingSimulation) {
            // If a simulation systems is currently compiling one has to simulate it afterwards
            this.simulationWidget.compilingSimulation = false
            this.simulationWidget.update()
            if (successful) {
                this.commandRegistry.executeCommand(SIMULATE.id)
            }
        } else {
            this.simulationWidget.update()
        }
    }

    /**
     * Executed whenever a widget is created.
     * If a simulation widget is created this simulation contribution is initialized using this widget.
     */
    async onDidCreateWidget(e: DidCreateWidgetEvent): Promise<void> {
        if (e.factoryId === simulationWidgetId) {
            await this.initializeSimulationWidget(e.widget)
            const lClient = await this.client.languageClient
            while (!this.client.running) {
                await delay(100)
            }
            lClient.onNotification(externalStepMessageType, this.handleStepMessage.bind(this))
            lClient.onNotification(valuesForNextStepMessageType, this.handleExternalNewUserValue.bind(this))
            lClient.onNotification(externalStopMessageType, this.handleExternalStop.bind(this))
            lClient.onNotification(startedSimulationMessageType, this.handleSimulationStarted.bind(this))
        }
    }

    registerCommands(commands: CommandRegistry) {
        super.registerCommands(commands)
        commands.registerCommand(OPEN_SIMULATION_WIDGET_AND_REQUEST_CS, {
            execute: async () => {
                await this.commandRegistry.executeCommand(SIMULATION.id)
                await this.commandRegistry.executeCommand(REQUEST_CS.id)
            }
        })
        commands.registerCommand(SIMULATE, {
            execute: async () => {
                this.simulate()
            }
        })
        commands.registerCommand(OPEN_INTERNAL_KVIZ_VIEW, {
            isEnabled: widget => {
                return widget !== undefined && widget.id === simulationWidgetId
            },
            isVisible: widget => {
                return widget !== undefined && widget.id === simulationWidgetId
            },
            execute: () => {
                this.openInternalKVizView()
            }
        })
        commands.registerCommand(OPEN_EXTERNAL_KVIZ_VIEW, {
            isEnabled: widget => {
                return widget !== undefined && widget.id === simulationWidgetId
            },
            isVisible: widget => {
                return widget !== undefined && widget.id === simulationWidgetId
            },
            execute: () => {
                this.openExternalKVizView()
            }
        })
        commands.registerCommand(SELECT_SIMULATION_CHAIN, {
            isEnabled: widget => {
                return (widget !== undefined && !!this.kicoolContribution.editor)
            },
            execute: () => {
                this.quickOpenService.open('>Simulation: Simulate model via ')
            },
            isVisible: widget => {
                return this.kicoolContribution.editor && (widget !== undefined) && (widget instanceof EditorWidget)
            }
        })
        commands.registerCommand(SELECT_SNAPSHOT_SIMULATION_CHAIN, {
            isEnabled: widget => {
                return widget !== undefined && widget instanceof KeithDiagramWidget
            },
            execute: () => {
                this.quickOpenService.open('>Simulation: Simulate snapshot via ')
            },
            isVisible: widget => {
                return widget !== undefined && widget instanceof KeithDiagramWidget
            }
        })
        commands.registerCommand(SET_SIMULATION_SPEED, {
            execute: () => {
                let newValue = this.simulationWidget.simulationStepDelay
                const item: QuickOpenItem = new QuickOpenItem({
                    label: 'Set speed to ' + newValue,
                    description: "Simulation speed",
                    run: (mode: QuickOpenMode) => {
                        return true;
                    }
                });
                const quickOpenModel: QuickOpenModel = {
                    onType: (lookFor: string, acceptor: (items: QuickOpenItem[]) => void): void => {
                        let dynamicItems = [item]
                        if (lookFor) {
                            dynamicItems.push(new QuickOpenItem({
                                label: `Set speed to ${lookFor}`,
                                run: () => {
                                    return true
                                }
                            }))
                            newValue = parseInt(lookFor, 10)
                        }
                        acceptor(dynamicItems);
                    }
                };
                const quickOpenOption: QuickOpenOptions = {
                    placeholder: this.simulationWidget.simulationStepDelay.toString(),
                    fuzzyMatchLabel: true,
                    onClose: (cancelled: boolean) => {
                        if (!cancelled) {
                            this.simulationWidget.simulationStepDelay = newValue
                            this.message(`Simulation speed set to ${this.simulationWidget.simulationStepDelay}`, 'INFO')
                            this.simulationWidget.update()
                        }
                    }
                }
                this.openService.open(quickOpenModel, quickOpenOption)
            }
        })
        commands.registerCommand(this.selectSimulationTypeCommand, {
            execute: () => {
                this.selectSimulationTypeCommand.resetTo = this.simulationWidget.simulationType
                this.openService.open({
                    onType: (lookFor: string, acceptor: (items: QuickOpenItem[]) => void) => {
                        const items = this.simulationWidget.simulationTypes.map(type =>
                            new QuickOpenItem({
                                label: type,
                                description: type,
                                run: (mode: QuickOpenMode) => {
                                    if (mode === QuickOpenMode.OPEN) {
                                        this.selectSimulationTypeCommand.resetTo = this.simulationWidget.simulationTypes[0];
                                    }
                                    this.simulationWidget.simulationType = type
                                    return true;
                                }
                            }));
                        acceptor(items);
                    }
                }, {
                    placeholder: `Select the simulation type (Currently ${this.simulationWidget.simulationType})`,
                    fuzzyMatchLabel: true,
                    onClose: (cancelled: boolean) => {
                        if (cancelled) {
                            this.simulationWidget.simulationType = this.selectSimulationTypeCommand.resetTo
                        }
                        this.simulationWidget.update()
                    }
                });
            }
        })
        commands.registerCommand(REVEAL_SIMULATION_WIDGET, {
            isEnabled: () => true,
            isVisible: () => false,
            execute: () => {
                this.front.shell.revealWidget(simulationWidgetId)
            }
        })
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
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
        registry.registerItem({
            id: SELECT_SIMULATION_CHAIN.id,
            command: SELECT_SIMULATION_CHAIN.id,
            tooltip: SELECT_SIMULATION_CHAIN.label
        });
        registry.registerItem({
            id: SELECT_SNAPSHOT_SIMULATION_CHAIN.id,
            command: SELECT_SNAPSHOT_SIMULATION_CHAIN.id,
            tooltip: SELECT_SNAPSHOT_SIMULATION_CHAIN.label
        });
    }

    /**
     * Invoke a simulation. This includes the compilation via a simulation CS.
     * Simulation is started via the compilationFinished method.
     */
    async compileAndStartSimulation(compilationSystem: CompilationSystem) {
        this.startTime = performance.now()
        this.simulationWidget.compilingSimulation = true
        this.simulationWidget.update()
        this.statusbar.setElement('simulation-status', {
            alignment: StatusBarAlignment.LEFT,
            priority: simulationStatusPriority,
            text: '$(spinner fa-pulse fa-fw) Compiling for simulation...',
            tooltip: 'Compiling for simulation...',
            command: REVEAL_SIMULATION_WIDGET.id
        })
        // Execute compilation command
        await this.commandRegistry.executeCommand(compilationSystem.id + (compilationSystem.snapshotSystem ? '.snapshot' : ''), true, true)
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
            this.statusbar.setElement('simulation-status', {
                alignment: StatusBarAlignment.LEFT,
                priority: simulationStatusPriority,
                text: '$(spinner fa-pulse fa-fw) Starting simulation...',
                tooltip: 'Starting simulation...',
                command: REVEAL_SIMULATION_WIDGET.id
            })
            lClient.sendNotification("keith/simulation/start", [uri, this.simulationWidget.simulationType])
        } else {
            this.statusbar.setElement('simulation-status', {
                alignment: StatusBarAlignment.LEFT,
                priority: simulationStatusPriority,
                text: `$(times) ${this.kicoolContribution.editor ? 'Simulation already running' : 'No editor defined'}`,
                tooltip: 'Did not simulate.',
                command: REVEAL_SIMULATION_WIDGET.id
            })
        }
    }

    /**
     * Start simulation after server successfully started it.
     */
    handleSimulationStarted(startMessage: SimulationStartedMessage) {
        this.endTime = performance.now()
        if (!startMessage.successful) {
            this.startTime = performance.now()
            this.message(startMessage.error, "error")
            this.statusbar.setElement('simulation-status', {
                alignment: StatusBarAlignment.LEFT,
                priority: simulationStatusPriority,
                text: `$(cross) (${(this.endTime - this.startTime).toPrecision(3)}ms) Simulation could not be started`,
                command: REVEAL_SIMULATION_WIDGET.id
            })
            return
        } else {
            this.statusbar.setElement('simulation-status', {
                alignment: StatusBarAlignment.LEFT,
                priority: simulationStatusPriority,
                text: `$(check) (${(this.endTime - this.startTime).toPrecision(3)}ms) Simulating...`,
                command: REVEAL_SIMULATION_WIDGET.id
            })
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
        this.statusbar.setElement('simulation-status', {
            alignment: StatusBarAlignment.LEFT,
            priority: simulationStatusPriority,
            text: '$(spinner fa-pulse fa-fw) Stopping simulation...',
            tooltip: 'Request to stop the simulation is about to be send',
            command: REVEAL_SIMULATION_WIDGET.id
        })
        const lClient = await this.client.languageClient
        const message: SimulationStoppedMessage = await lClient.sendRequest("keith/simulation/stop") as SimulationStoppedMessage
        if (!message.successful) {
            this.message(message.message, "ERROR")
        }
        this.simulationWidget.update()
        this.statusbar.setElement('simulation-status', {
            alignment: StatusBarAlignment.LEFT,
            priority: simulationStatusPriority,
            text: 'Stopped simulation',
            command: REVEAL_SIMULATION_WIDGET.id
        })
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
        this.messageService.warn('External new user values are not implemented')
    }

    handleExternalStop(message: string) {
        this.message('Stopped simulation because of exception on LS. You might want to reload the window.', 'ERROR')
        this.messageService.error(message)
        this.setValuesToStopSimulation()
    }

    openInternalKVizView() {
        this.commandRegistry.executeCommand(MiniBrowserCommands.OPEN_URL.id, "http://localhost:5010/visualization")
    }

    openExternalKVizView() {
        this.windowService.openNewWindow("http://localhost:5010/visualization")
    }
}