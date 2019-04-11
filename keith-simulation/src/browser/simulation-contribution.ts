import { SimulationWidget } from "./simulation-widget";
import { injectable, inject } from "inversify";
import { AbstractViewContribution, FrontendApplicationContribution, WidgetManager, FrontendApplication, KeybindingRegistry, CommonMenus, Widget, DidCreateWidgetEvent } from "@theia/core/lib/browser";
import { Workspace } from "@theia/languages/lib/browser";
import { MessageService, Command, CommandRegistry, MenuModelRegistry } from "@theia/core";
import { EditorManager } from "@theia/editor/lib/browser";
import { FileSystemWatcher } from "@theia/filesystem/lib/browser";
import { simulationWidgetId, OPEN_SIMULATION_WIDGET_KEYBINDING } from "../common";
import { KeithLanguageClientContribution } from "@kieler/keith-language/lib/browser/keith-language-client-contribution";
import { SimulationKeybindingContext } from "./simulation-keybinding-context";


export const SIMULATION: Command = {
    id: 'simulation:toggle',
    label: 'Simulation View'
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
        @inject(SimulationKeybindingContext) protected readonly kicoolKeybindingContext: SimulationKeybindingContext,
        @inject(FileSystemWatcher) protected readonly fileSystemWatcher: FileSystemWatcher,
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
                this.simulationWidget.simulationData.set("y", {data: [1, 2, 3, 4]})
                this.simulationWidget.simulationData.set("x", {data: [true, false, true]})
                this.simulationWidget.simulationData.set("q", {data: [1, 2, 3, 4]})
                this.simulationWidget.simulationData.set("b", {data: [1, 2, 3, 4]})
                console.log("Simulation data after testing adding is")
                console.log(this.simulationWidget.simulationData)
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
}