import { SimulationWidget } from "./simulation-widget";
import { injectable, inject } from "inversify";
import { AbstractViewContribution, FrontendApplicationContribution, WidgetManager,
    FrontendApplication, KeybindingRegistry, CommonMenus, Widget, DidCreateWidgetEvent } from "@theia/core/lib/browser";
import { Workspace } from "@theia/languages/lib/browser";
import { MessageService, Command, CommandRegistry, MenuModelRegistry } from "@theia/core";
import { EditorManager } from "@theia/editor/lib/browser";
import { OutputChannelManager } from "@theia/output/lib/common/output-channel";
import { FileSystemWatcher } from "@theia/filesystem/lib/browser";
import { simulationWidgetId, OPEN_SIMULATION_WIDGET_KEYBINDING, SimulationStartedMessage } from "../common";
import { KeithLanguageClientContribution } from "@kieler/keith-language/lib/browser/keith-language-client-contribution";
import { SimulationKeybindingContext } from "./simulation-keybinding-context";
import { KiCoolContribution } from "@kieler/keith-kicool/lib/browser/kicool-contribution"
import { delay } from "../common/helper";


export const SIMULATION: Command = {
    id: 'simulation:toggle',
    label: 'Simulation View'
}
export const SIMULATE: Command = {
    id: 'simulate',
    label: 'Simulate latest snapshot compilation'
}

/**
 * Contribution for SimulationWidget to add functionality to it.
 */
@injectable()
export class SimulationContribution extends AbstractViewContribution<SimulationWidget> implements FrontendApplicationContribution {

    simulationWidget: SimulationWidget

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
        @inject(KiCoolContribution) protected readonly kicoolContribution: KiCoolContribution
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
        const widgetPromise = this.widgetManager.getWidget(SimulationWidget.widgetId)
        widgetPromise.then(widget => {
            if (this.simulationWidget === undefined || this.simulationWidget === null) {
                // widget has to be created
                this.initializeCompilerWidget(new SimulationWidget(this))
            } else {
                this.initializeCompilerWidget(widget)
            }
        })
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView()
    }
    private initializeCompilerWidget(widget: Widget | undefined) {
        if (widget) {
            this.simulationWidget = widget as SimulationWidget
        }
    }

    onDidCreateWidget(e: DidCreateWidgetEvent): void {
        if (e.factoryId === SimulationWidget.widgetId) {
            this.initializeCompilerWidget(e.widget)
        }
    }

    registerCommands(commands: CommandRegistry) {
        commands.registerCommand({id: "test", label: "Testing widget"}, {
            execute: () => {
                this.simulationWidget.simulationData.set("NumArray", {data: [[1, 2], [2, 2], [3, 2], [4, 2]], input: false, output: false})
                this.simulationWidget.valuesForNextStep.set("NumArray", [4, 2])
                this.simulationWidget.simulationData.set("numArray", {data: [1, 2, 3, 4], input: false, output: false})
                this.simulationWidget.valuesForNextStep.set("numArray", 4)
                this.simulationWidget.simulationData.set("boolean", {data: [true, false, true], input: false, output: false})
                this.simulationWidget.valuesForNextStep.set("boolean", true)
                this.simulationWidget.simulationData.set("numEmpty", {data: [], input: false, output: false})
                this.simulationWidget.valuesForNextStep.set("numEmpty", 0)
                this.simulationWidget.simulationData.set("boolEmpty", {data: [], input: false, output: false})
                this.simulationWidget.valuesForNextStep.set("boolEmpty", false)
                this.simulationWidget.simulationData.set("booleanArray", {data: [], input: false, output: false})
                this.simulationWidget.valuesForNextStep.set("booleanArray",   [false, false, false])
                this.simulationWidget.update()
            }
        })
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
                if (this.kicoolContribution.editor) {
                    const lClient = await this.client.languageClient
                    const uri = this.kicoolContribution.editor.editor.uri.toString()
                    // Check if language client was already initialized and wait till it is
                    let initializeResult = lClient.initializeResult
                    while (!initializeResult) {
                        // language client was not initialized
                        await delay(100)
                        initializeResult = lClient.initializeResult
                    }
                    const startMessage: SimulationStartedMessage = await lClient.sendRequest("keith/simulation/start", [uri, "Manual"]) as SimulationStartedMessage
                    // handle message
                    if (startMessage.successful && startMessage.initialValues) {
                        startMessage.initialValues.forEach((data) => {
                            this.simulationWidget.simulationData.set(data.symbol, {data: [], input: data.input, output: data.output})
                            this.simulationWidget.valuesForNextStep.set(data.symbol, data.initialValue)
                            this.simulationWidget.controlsEnabled = true
                        })
                        // reveal simulation widget
                        const widget = this.front.shell.revealWidget(simulationWidgetId)
                        if (widget) {
                            widget.update()
                        }
                    } else {
                        this.message(startMessage.error, "ERROR")
                        this.simulationWidget.stopSimulation()
                        // TODO somehow kill simulation of try to reconnect or something like this
                        return
                    }
                }
            }
        })
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
        switch (type) {
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