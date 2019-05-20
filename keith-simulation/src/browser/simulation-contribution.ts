import { SimulationWidget } from "./simulation-widget";
import { injectable, inject } from "inversify";
import { AbstractViewContribution, FrontendApplicationContribution, WidgetManager,
    FrontendApplication, KeybindingRegistry, CommonMenus, Widget, DidCreateWidgetEvent } from "@theia/core/lib/browser";
import { Workspace, NotificationType } from "@theia/languages/lib/browser";
import { MessageService, Command, CommandRegistry, MenuModelRegistry } from "@theia/core";
import { EditorManager } from "@theia/editor/lib/browser";
import { OutputChannelManager } from "@theia/output/lib/common/output-channel";
import { FileSystemWatcher } from "@theia/filesystem/lib/browser";
import { simulationWidgetId, OPEN_SIMULATION_WIDGET_KEYBINDING, SimulationStartedMessage, SimulationStoppedMessage, SimulationStepMessage } from "../common";
import { KeithLanguageClientContribution } from "@kieler/keith-language/lib/browser/keith-language-client-contribution";
import { SimulationKeybindingContext } from "./simulation-keybinding-context";
import { KiCoolContribution } from "@kieler/keith-kicool/lib/browser/kicool-contribution"
import { delay, strMapToObj } from "../common/helper";

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

/**
 * Contribution for SimulationWidget to add functionality to it.
 */
@injectable()
export class SimulationContribution extends AbstractViewContribution<SimulationWidget> implements FrontendApplicationContribution {

    simulationWidget: SimulationWidget

    progressMessageType = new NotificationType<any, void>('keith/kicool/progress');

    constructor(
        @inject(Workspace) protected readonly workspace: Workspace,
        @inject(WidgetManager) protected readonly widgetManager: WidgetManager,
        @inject(MessageService) protected readonly messageService: MessageService,
        @inject(FrontendApplication) public readonly front: FrontendApplication,
        @inject(KeithLanguageClientContribution) public readonly client: KeithLanguageClientContribution,
        @inject(EditorManager) public readonly editorManager: EditorManager,
        @inject(OutputChannelManager) protected readonly outputManager: OutputChannelManager,
        @inject(SimulationKeybindingContext) protected readonly simulationKeybindingContext: SimulationKeybindingContext,
        @inject(FileSystemWatcher) protected readonly fileSystemWatcher: FileSystemWatcher,
        @inject(KiCoolContribution) public readonly kicoolContribution: KiCoolContribution,
        @inject(CommandRegistry) public readonly commandRegistry: CommandRegistry
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
    private initializeSimulationWidget(widget: Widget | undefined) {
        if (widget) {
            this.simulationWidget = widget as SimulationWidget
            // whenever the compiler widget got new compilation systems from the LS new systems is invoked.
            this.kicoolContribution.compilerWidget.newSystemsAdded(this.newSystemsAdded.bind(this))
            this.kicoolContribution.compilationFinished(this.compilationFinished.bind(this))
            this.kicoolContribution.compilationStarted(this.compilationStarted.bind(this))
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

    compilationFinished() {
        if (this.simulationWidget.compilingSimulation) {
            this.simulationWidget.compilingSimulation = false
            this.simulationWidget.update()
            this.simulate()
        } else {
            this.simulationWidget.update()
        }
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
    }

    /**
     * Invoke a simulation. This includes the compilation via a simulation CS.
     */
    async compileAndStartSimulation() {
        this.simulationWidget.compilingSimulation = true
        this.simulationWidget.update()
        const selection = document.getElementById("simulation-list") as HTMLSelectElement;
        const option = selection.selectedOptions[0]
        if (option !== undefined) {
            // when simulating it should always compile inplace
            await this.kicoolContribution.compile(option.value, true)
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
            const startMessage: SimulationStartedMessage = await lClient.sendRequest(
                "keith/simulation/start",
                [uri, this.simulationWidget.simulationType]) as SimulationStartedMessage
            if (!startMessage.successful) {
                this.message(startMessage.error, "error")
                return
            }
            // handle message
            const pool: Map<string, any> = new Map(Object.entries(startMessage.dataPool));
            const input: Map<string, any> = new Map(Object.entries(startMessage.input));
            const output: Map<string, any> = new Map(Object.entries(startMessage.output));
            const propertySet: Map<string, any> = new Map(Object.entries(startMessage.propertySet));
            // Construct list of all categories
            propertySet.forEach((list, key) => {
                this.simulationWidget.categories.push(key)
            })
            pool.forEach((value, key) => {
                // Add list of properties to SimulationData
                let categoriesList: string[] = []
                propertySet.forEach((list, propertyKey) => {
                    if (list.includes(key)) {
                        categoriesList.push(propertyKey)
                    }
                })
                this.simulationWidget.simulationData.set(key, {data: [], input: input.has(key), output: output.has(key), categories: categoriesList})
                if (input.get(key) !== undefined) {
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
    }



    /**
     * Executes a simulation step on the LS.
     */
    async executeSimulationStep(): Promise<boolean> {
        const lClient = await this.client.languageClient
        // Transform the input map to an object since this is the format the LS supports
        let jsonObject = strMapToObj(this.simulationWidget.valuesForNextStep)
        const message: SimulationStepMessage = await lClient.sendRequest("keith/simulation/step", [jsonObject, "Manual"]) as SimulationStepMessage
        // Transform jsonObject back to map
        const pool: Map<string, any> = new Map(Object.entries(message.values));
        if (pool) {
            pool.forEach((value, key) => {
                // push value in history and set new input value
                const history = this.simulationWidget.simulationData.get(key)
                if (history !== undefined) {
                    history.data.push(value)
                    this.simulationWidget.simulationData.set(key, history)
                    // set values for next tick is removed, since a change may overwrite a change initialized by the user
                } else {
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
        this.simulationWidget.update()
        return true
    }

    /**
     * Request a simulation stop from the LS.
     */
    public async stopSimulation() {
        // Stop all simulation, i.e. empty maps and kill simulation process on LS
        this.simulationWidget.valuesForNextStep.clear()
        this.simulationWidget.simulationData.clear()
        this.simulationWidget.play = false
        this.simulationWidget.controlsEnabled = false
        this.simulationWidget.simulationRunning = false
        const lClient = await this.client.languageClient
        const message: SimulationStoppedMessage = await lClient.sendRequest("keith/simulation/stop") as SimulationStoppedMessage
        if (!message.successful) {
            this.message(message.message, "ERROR")
        }
        this.simulationWidget.update()
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
            const success = await this.executeSimulationStep()
            if (!success) {
                this.stopSimulation()
                this.simulationWidget.update()
                return
            }
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
}