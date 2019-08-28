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

import { KeithDiagramManager } from '@kieler/keith-diagram/lib/keith-diagram-manager';
import { KeithDiagramWidget } from '@kieler/keith-diagram/lib/keith-diagram-widget';
import { KeithLanguageClientContribution } from "@kieler/keith-language/lib/browser/keith-language-client-contribution";
import { AbstractViewContribution, CommonMenus, DidCreateWidgetEvent,
    FrontendApplication, FrontendApplicationContribution, KeybindingRegistry, Widget, WidgetManager, PrefixQuickOpenService, StatusBar, StatusBarAlignment
} from "@theia/core/lib/browser";
import { Command, CommandHandler, CommandRegistry, MenuModelRegistry, MessageService, Emitter, Event } from '@theia/core/lib/common';
import { EditorManager, EditorWidget } from "@theia/editor/lib/browser";
import { FileChange, FileSystemWatcher } from "@theia/filesystem/lib/browser";
import { Workspace, NotificationType } from "@theia/languages/lib/browser";
import { OutputChannelManager } from "@theia/output/lib/common/output-channel";
import { UserStorageUri } from "@theia/userstorage/lib/browser";
import { inject, injectable } from "inversify";
import { COMPILE, compilerWidgetId, EDITOR_UNDEFINED_MESSAGE, GET_SYSTEMS, OPEN_COMPILER_WIDGET_KEYBINDING, SHOW, SHOW_NEXT_KEYBINDING, SHOW_PREVIOUS_KEYBINDING,
    CANCEL_COMPILATION,
    CANCEL_GET_SYSTEMS} from "../common";
import { delay } from "../common/helper";
import { CodeContainer, CompilationSystem } from "../common/kicool-models";
import { CompilerWidget } from "./compiler-widget";
import { KiCoolKeybindingContext } from "./kicool-keybinding-context";
import { TabBarToolbarContribution, TabBarToolbarRegistry } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { COMPILER, TOGGLE_AUTO_COMPILE, TOGGLE_PRIVATE_SYSTEMS, TOGGLE_INPLACE, REQUEST_CS, TOGGLE_BUTTON_MODE,
    SELECT_COMPILATION_CHAIN, SHOW_NEXT, SHOW_PREVIOUS, REVEAL_COMPILATION_WIDGET, SELECT_SNAPSHOT_COMPILATION_CHAIN } from '../common/commands';

export const snapshotDescriptionMessageType = new NotificationType<CodeContainer, void>('keith/kicool/compile');
export const cancelCompilationMessageType = new NotificationType<boolean, void>('keith/kicool/cancel-compilation');
export const compilationSystemsMessageType = new NotificationType<CompilationSystem[], void>('keith/kicool/compilation-systems');

export const compilationStatusPriority: number = 5
export const requestSystemStatusPriority: number = 6

/**
 * Contribution for CompilerWidget to add functionality to it and link with the current editor.
 */
@injectable()
export class KiCoolContribution extends AbstractViewContribution<CompilerWidget> implements FrontendApplicationContribution, TabBarToolbarContribution {

    isCompiled: Map<string, boolean> = new Map
    sourceURI: Map<string, string> = new Map
    resultMap: Map<string, CodeContainer> = new Map
    indexMap: Map<string, number> = new Map
    lengthMap: Map<string, number> = new Map

    editor: EditorWidget
    compilerWidget: CompilerWidget

    startTime: number
    endTime: number

    /**
     * Holds all commands, updates after new compilation systems are requested.
     */
    kicoolCommands: Command[] = []

    public readonly compilationStartedEmitter = new Emitter<KiCoolContribution | undefined>()
    /**
     * Finish of compilation is recognized by cancel of compilation or by receiving a snapshot that is the last of the compilation system.
     * Returns whether compilation has successfully finished (the last snapshot was send).
     */
    public readonly compilationFinishedEmitter = new Emitter<boolean | undefined>()
    public readonly showedNewSnapshotEmitter = new Emitter<string | undefined>()
    public readonly newSimulationCommandsEmitter = new Emitter<CompilationSystem[]>()

    public readonly compilationStarted: Event<KiCoolContribution | undefined> = this.compilationStartedEmitter.event
    /**
     * Finish of compilation is recognized by cancel of compilation or by receiving a snapshot that is the last of the compilation system.
     * Returns whether compilation has successfully finished (the last snapshot was send).
     */
    public readonly compilationFinished: Event<boolean | undefined> = this.compilationFinishedEmitter.event
    public readonly showedNewSnapshot: Event<string | undefined> = this.showedNewSnapshotEmitter.event
    public readonly newSimulationCommands: Event<CompilationSystem[]> = this.newSimulationCommandsEmitter.event

    @inject(Workspace) protected readonly workspace: Workspace
    @inject(MessageService) protected readonly messageService: MessageService
    @inject(FrontendApplication) public readonly front: FrontendApplication
    @inject(KeithLanguageClientContribution) public readonly client: KeithLanguageClientContribution
    @inject(OutputChannelManager) protected readonly outputManager: OutputChannelManager
    @inject(KiCoolKeybindingContext) protected readonly kicoolKeybindingContext: KiCoolKeybindingContext
    @inject(KeithDiagramManager) public readonly diagramManager: KeithDiagramManager
    @inject(CommandRegistry) public commandRegistry: CommandRegistry
    @inject(KeybindingRegistry) protected keybindingRegistry: KeybindingRegistry
    @inject(PrefixQuickOpenService) public readonly quickOpenService: PrefixQuickOpenService
    @inject(StatusBar) protected readonly statusbar: StatusBar

    constructor(
        @inject(EditorManager) public readonly editorManager: EditorManager,
        @inject(FileSystemWatcher) protected readonly fileSystemWatcher: FileSystemWatcher,
        @inject(WidgetManager) protected readonly widgetManager: WidgetManager
    ) {
        super({
            widgetId: compilerWidgetId,
            widgetName: 'Compiler',
            defaultWidgetOptions: {
                area: 'bottom',
                rank: 500
            },
            toggleCommandId: COMPILER.id,
            toggleKeybinding: OPEN_COMPILER_WIDGET_KEYBINDING
        });
        this.fileSystemWatcher.onFilesChanged(this.onFilesChanged.bind(this))

        this.editorManager.onCurrentEditorChanged(this.onCurrentEditorChanged.bind(this))
        if (editorManager.currentEditor) {
            // if there is already a current editor, use that to initialize, but this should not be the case.
            this.editor = editorManager.currentEditor
            this.onCurrentEditorChanged(this.editor)
        }
        this.widgetManager.onDidCreateWidget(this.onDidCreateWidget.bind(this))
        // TODO: when the diagram closes, also update the view to the default one
        // const widgetPromise = this.widgetManager.getWidget(CompilerWidget.widgetId)
        // widgetPromise.then(widget => {
        //     if (this.compilerWidget === undefined || this.compilerWidget === null) {
        //         // widget has to be created
        //         this.initializeCompilerWidget(new CompilerWidget(this))
        //     } else {
        //         this.initializeCompilerWidget(widget)
        //     }
        // })
    }

    async initializeLayout(app: FrontendApplication): Promise<void> {
        await this.openView()
    }

    onStart(): void {
        this.statusbar.setElement('request-systems', {
            alignment: StatusBarAlignment.LEFT,
            priority: requestSystemStatusPriority,
            text: '$(spinner fa-pulse fa-fw) No editor focused... waiting',
            tooltip: 'No editor focused... waiting'
        })
    }

    private async initializeCompilerWidget(widget: Widget | undefined) {
        if (widget) {
            this.compilerWidget = widget as CompilerWidget
            this.compilerWidget.requestSystemDescriptions(this.requestSystemDescriptions.bind(this))
            this.compilerWidget.onActivateRequest(this.requestSystemDescriptions.bind(this))
            const lClient = await this.client.languageClient
            while (!this.client.running) {
                await delay(100)
            }
            if (!this.editorManager.currentEditor) {
                this.editorManager.all.forEach(editor => {
                    if (editor.isVisible) {
                        this.editor = editor
                    }
                })
            }
            if (this.editor) {
                this.compilerWidget.sourceModelPath = this.editor.editor.uri.toString()
                await this.requestSystemDescriptions()
            }
            lClient.onNotification(snapshotDescriptionMessageType, this.handleNewSnapshotDescriptions.bind(this))
            lClient.onNotification(cancelCompilationMessageType, this.cancelCompilation.bind(this))
            lClient.onNotification(compilationSystemsMessageType, this.handleReceiveSystemDescriptions.bind(this))
            this.showedNewSnapshot(this.handleNewShapshotShown.bind(this))
        }
    }
    handleNewShapshotShown(message: string) {
        this.requestSystemDescriptions()
    }

    onDidCreateWidget(e: DidCreateWidgetEvent): void {
        // This does not work, because sometimes you will write in an editor that is currently hidden.
        // if (e.widget instanceof EditorWidget) {
        //     e.widget.activate()
        // }
        if (e.factoryId === CompilerWidget.widgetId && !this.compilerWidget) {
            this.initializeCompilerWidget(e.widget)
        }
    }

    onFilesChanged(fileChange: FileChange) {
        // TODO receives two event if file is saved
        if (this.compilerWidget && this.compilerWidget.autoCompile) {
            // TODO autocompile does no longer work that way
            // this.compilerWidget.compileSelectedCompilationSystem()
        }
    }

    async onCurrentEditorChanged(editorWidget: EditorWidget | undefined): Promise<void> {
        // Ignore changes to user storage files, as they are have no representation on the server.
        if (!editorWidget || editorWidget.editor.uri.scheme === UserStorageUri.SCHEME) {
            return
        }
        this.editor = editorWidget
        if (!this.compilerWidget || this.compilerWidget.isDisposed) {
            const widgetPromise = this.widgetManager.getWidget(CompilerWidget.widgetId)
            widgetPromise.then(widget => {
                this.initializeCompilerWidget(widget)
            })
        } else {
            await this.requestSystemDescriptions()
        }
    }

    async requestSystemDescriptions() {
        if (this.editor && this.client.documentSelector.includes(this.editor.editor.document.languageId)) {
            // when systems are requested request systems status bar entry is updated
            this.statusbar.setElement('request-systems', {
                alignment: StatusBarAlignment.LEFT,
                priority: requestSystemStatusPriority,
                text: '$(spinner fa-pulse fa-fw) Request compilation systems',
                tooltip: 'Requesting compilation systems...'
            })
            this.compilerWidget.requestedSystems = true
            this.compilerWidget.update()
            const lClient = await this.client.languageClient
            const uri = this.editor.editor.uri.toString()
            // Check if language client was already initialized and wait till it is
            let initializeResult = lClient.initializeResult
            while (!initializeResult) {
                // language client was not initialized
                await delay(100)
                initializeResult = lClient.initializeResult
            }
            await lClient.sendNotification(GET_SYSTEMS, uri)
        } else {
            this.compilerWidget.systems = []
            this.addCompilationSystemToCommandPalette(this.compilerWidget.systems)
        }
    }

    handleReceiveSystemDescriptions(systems: CompilationSystem[], snapshotSystems: CompilationSystem[]) {
        // Remove status bar element after successfully requesting systems
        this.statusbar.removeElement('request-systems')
        // Sort all compilation systems by id
        systems.sort((a, b) => (a.id > b.id) ? 1 : -1)
        this.compilerWidget.systems = systems
        this.addCompilationSystemToCommandPalette(systems.concat(snapshotSystems))
        this.compilerWidget.sourceModelPath = this.editor.editor.uri.toString()
        this.compilerWidget.requestedSystems = false
        this.compilerWidget.lastRequestedUriExtension = this.editor.editor.uri.path.ext
        this.compilerWidget.update()

    }

    /**
     * Removes all old compilation systems from command palette and adds new ones.
     * @param systems compilation systems that should get a compile command
     */
    addCompilationSystemToCommandPalette(systems: CompilationSystem[]) {
        // remove existing commands
        this.kicoolCommands.forEach(command => {
            this.commandRegistry.unregisterCommand(command)
        })
        this.kicoolCommands = []
        // add new commands for original model
        systems.forEach(system => {
            const command: Command = {
                id: system.id + (system.snapshotSystem ? '.snapshot' : ''),
                label: `Compile ${system.snapshotSystem ? 'snapshot' : 'model'} with ${system.label}`, category: "Kicool"}
            this.kicoolCommands.push(command)
            const handler: CommandHandler = {
                execute: (inplace, doNotShowResultingModel) => { // on compile these options are undefined
                    this.compile(system.id, this.compilerWidget.compileInplace || !!inplace, !doNotShowResultingModel, system.snapshotSystem);
                },
                isVisible: () => {
                    return system.isPublic || this.compilerWidget.showPrivateSystems
                }
            }
            this.commandRegistry.registerCommand(command, handler)
        })
        const simulationSystems = systems.filter(system => system.simulation)
        // Register additional simulation commands
        this.newSimulationCommandsEmitter.fire(simulationSystems)
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        [
            {
                command: COMPILER.id,
                keybinding: OPEN_COMPILER_WIDGET_KEYBINDING
            }
        ].forEach(binding => {
            keybindings.registerKeybinding(binding);
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.VIEW_VIEWS, {
            commandId: COMPILER.id,
            label: this.options.widgetName
        });
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(COMPILER, {
            execute: async () => {
                this.openView({
                    toggle: true,
                    reveal: true
                })
            }
        })
        commands.registerCommand(TOGGLE_AUTO_COMPILE, {
            execute: () => {
                if (this.compilerWidget) {
                    this.compilerWidget.autoCompile = !this.compilerWidget.autoCompile
                    this.compilerWidget.update()
                }
            }
        })
        commands.registerCommand(TOGGLE_PRIVATE_SYSTEMS, {
            execute: () => {
                if (this.compilerWidget) {
                    this.compilerWidget.showPrivateSystems = !this.compilerWidget.showPrivateSystems
                    // Update compile commands accordingly
                    this.addCompilationSystemToCommandPalette(this.compilerWidget.systems)
                    this.compilerWidget.update()
                }
            }
        })
        commands.registerCommand(TOGGLE_INPLACE, {
            execute: () => {
                if (this.compilerWidget) {
                    this.compilerWidget.compileInplace = !this.compilerWidget.compileInplace
                    this.compilerWidget.update()
                }
            }
        })
        commands.registerCommand(REQUEST_CS, {
            execute: async () => {
                await this.requestSystemDescriptions()
                this.message("Registered compilation systems", "INFO")
            }
        })
        commands.registerCommand(TOGGLE_BUTTON_MODE, {
            execute: async () => {
                this.compilerWidget.showButtons = !this.compilerWidget.showButtons
                this.compilerWidget.update()
            }
        })
        commands.registerCommand(SELECT_COMPILATION_CHAIN, {
            isEnabled: widget => {
                return this.compilerWidget.showButtons || (widget !== undefined && !!this.editor) &&
                this.client.documentSelector.includes((widget as EditorWidget).editor.document.languageId)
            },
            execute: () => {
                this.quickOpenService.open('>Kicool: Compile model with ')
            },
            isVisible: widget => {
                return this.editor && (widget !== undefined) && (widget instanceof EditorWidget)
            }
        })
        commands.registerCommand(SELECT_SNAPSHOT_COMPILATION_CHAIN, {
            isEnabled: widget => {
                return widget !== undefined && widget instanceof KeithDiagramWidget
            },
            execute: () => {
                this.quickOpenService.open('>Kicool: Compile snapshot with ')
            },
            isVisible: widget => {
                return widget !== undefined && widget instanceof KeithDiagramWidget
            }
        })
        commands.registerCommand(REVEAL_COMPILATION_WIDGET, {
            isVisible: () => false,
            execute: () => {
                this.front.shell.revealWidget(compilerWidgetId)
            }
        })
    }

    registerToolbarItems(registry: TabBarToolbarRegistry): void {
        registry.registerItem({
            id: SELECT_COMPILATION_CHAIN.id,
            command: SELECT_COMPILATION_CHAIN.id,
            tooltip: SELECT_COMPILATION_CHAIN.label
        });
        registry.registerItem({
            id: SELECT_SNAPSHOT_COMPILATION_CHAIN.id,
            command: SELECT_SNAPSHOT_COMPILATION_CHAIN.id,
            tooltip: SELECT_SNAPSHOT_COMPILATION_CHAIN.label
        })
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
     *
     * @param id id of snapshot e.g. Signal
     * @param index index of snapshot
     */
    public async show(uri: string, index: number) {
        const lClient = await this.client.languageClient
        this.indexMap.set(uri, index)
        await lClient.sendRequest(SHOW, [uri, KeithDiagramManager.DIAGRAM_TYPE + '_sprotty', index])
        if (index >= 0) { // original model must not fire this emitter.
            this.showedNewSnapshotEmitter.fire("Hi")
        }
    }

    /**
     * Invoke compilation and update status in widget
     * @param command compilation system
     * @param inplace whether inplace compilation is on or off
     * @param showResultingModel whether the resulting model should be shown in the diagram. Simulation does not do this.
     */
    public async compile(command: string, inplace: boolean, showResultingModel: boolean, snapshot: boolean): Promise<void> {
        this.startTime = performance.now()
        this.compilerWidget.compiling = true
        this.compilerWidget.update()
        await this.executeCompile(command, inplace, showResultingModel, snapshot)
        this.compilerWidget.lastInvokedCompilation = command
        this.compilerWidget.lastCompiledUri = this.compilerWidget.sourceModelPath
        this.compilerWidget.update()
    }

    async executeCompile(command: string, inplace: boolean, showResultingModel: boolean, snapshot: boolean): Promise<void> {
        if (!this.editor) {
            this.message(EDITOR_UNDEFINED_MESSAGE, "error")
            return;
        }

        const uri = this.compilerWidget.sourceModelPath

        if (!this.compilerWidget.autoCompile) {
            this.message("Compiling " + uri + " with " + command, "info")
        }
        const lClient = await this.client.languageClient
        lClient.sendNotification(COMPILE, [uri, KeithDiagramManager.DIAGRAM_TYPE + '_sprotty', command, inplace, showResultingModel, snapshot])
        this.compilationStartedEmitter.fire(this)
    }

    /**
     * Handles the visualization of new snapshot descriptions send by the LS.
     */
    handleNewSnapshotDescriptions(snapshotsDescriptions: CodeContainer, uri: string, finished: boolean, currentIndex: number, maxIndex: number) {
        // Show next/previous command and keybinding if not already added
        if (!this.commandRegistry.getCommand(SHOW_NEXT.id)) {
            this.registerShowNext()
            this.registerShowPrevious()
        }
        this.isCompiled.set(uri as string, true)
        this.resultMap.set(uri as string, snapshotsDescriptions)
        const length = snapshotsDescriptions.files.reduce((previousSum, snapshots) => {
            return previousSum + snapshots.length
        }, 0)
        this.lengthMap.set(uri as string, length)
        this.indexMap.set(uri as string, length - 1)
        if (finished)  {
            this.compilerWidget.compiling = false
            this.compilationFinishedEmitter.fire(true)
            snapshotsDescriptions.files.forEach(array => {
                array.forEach(element => {
                    element.warnings.forEach(warning => {
                        this.outputManager.getChannel("SCTX").appendLine("WARNING: " + warning)
                    })
                    element.errors.forEach(error => {
                        this.outputManager.getChannel("SCTX").appendLine("ERROR: " + error)
                    })
                })
            });
            this.endTime = performance.now()
            // Set finished bar if the currentIndex of the processor is the maxIndex the compilation was not canceled
            this.statusbar.setElement('compile-status', {
                alignment: StatusBarAlignment.LEFT,
                priority: compilationStatusPriority,
                text: currentIndex === maxIndex ?
                    `$(check) (${(this.endTime - this.startTime).toPrecision(3)}ms)` :
                    `$(times) (${(this.endTime - this.startTime).toPrecision(3)}ms)`,
                tooltip: currentIndex === maxIndex ? 'Compilation finished' : 'Compilation stopped',
                command: REVEAL_COMPILATION_WIDGET.id
            })
        } else {
            // Set progress bar for compilation
            let progress: string = '█'.repeat(currentIndex) + '░'.repeat(maxIndex - currentIndex)

            this.statusbar.setElement('compile-status', {
                alignment: StatusBarAlignment.LEFT,
                priority: compilationStatusPriority,
                text: `$(spinner fa-pulse fa-fw) ${progress}`,
                tooltip: 'Compiling...',
                command: REVEAL_COMPILATION_WIDGET.id
            })
        }
        this.compilerWidget.update()
    }

    /**
     * Notifies the LS to cancel the compilation.
     */
    public async requestCancelCompilation(): Promise<void> {
        const lClient = await this.client.languageClient
        this.compilerWidget.cancellingCompilation = true
        lClient.sendNotification(CANCEL_COMPILATION)
        this.compilationFinishedEmitter.fire(false)
        this.compilerWidget.update()
    }

    /**
     * Notification from LS that the compilation was cancelled.
     * @param success wether cancelling the compilation was successful
     */
    public async cancelCompilation(success: boolean) {
        this.compilerWidget.cancellingCompilation = false
        if (success) {
            this.compilerWidget.compiling = false
        }
    }

    /**
     * Cancels compilation by stopping the compilation thread on the LS.
     */
    public async cancelGetSystems(): Promise<void> {
        this.message("This is currently not working, but try it anyway", "warn")
        const lClient = await this.client.languageClient
        const success = await lClient.sendRequest(CANCEL_GET_SYSTEMS)
        if (success) {
            this.compilerWidget.requestedSystems = false
        }
        this.compilerWidget.update()
    }

    registerShowNext() {
        this.commandRegistry.registerCommand(SHOW_NEXT, {
            execute: () => {
                if (!this.editor) {
                    this.message(EDITOR_UNDEFINED_MESSAGE, "error")
                    return false;
                }
                const uri = this.compilerWidget.sourceModelPath
                if (!this.isCompiled.get(uri)) {
                    this.message(uri + " was not compiled", "error")
                    return false
                }
                const lastIndex = this.indexMap.get(uri)
                if (lastIndex !== 0 && !lastIndex) {
                    this.message("Index is undefined", "error")
                    return false
                }
                const length = this.lengthMap.get(uri)
                if (length !== 0 && !length) {
                    this.message("Length is undefined", "error")
                    return false
                }
                if (lastIndex === length - 1) { // No show necessary, since the last snapshot is already drawn.
                    return
                }
                this.show(uri, Math.min(lastIndex + 1, length - 1))
            }
        })
        this.keybindingRegistry.registerKeybinding({
            command: SHOW_NEXT.id,
            context: this.kicoolKeybindingContext.id,
            keybinding: SHOW_NEXT_KEYBINDING
        })
    }

    registerShowPrevious() {
        this.commandRegistry.registerCommand(SHOW_PREVIOUS, {
            execute: () => {
                if (!this.editor) {
                    this.message(EDITOR_UNDEFINED_MESSAGE, "error")
                    return false;
                }
                const uri = this.compilerWidget.sourceModelPath
                if (!this.isCompiled.get(uri)) {
                    this.message(uri + " was not compiled", "error")
                    return false
                }
                const lastIndex = this.indexMap.get(uri)
                if (lastIndex !== 0 && !lastIndex) {
                    this.message("Index is undefined", "error")
                    return false
                }
                if (lastIndex === -1) { // No show necessary, since the original model is already drawn.
                    return
                }
                // Show for original model is on the lower bound of -1.
                this.show(uri, Math.max(lastIndex - 1, -1))
            }
        })
        this.keybindingRegistry.registerKeybinding({
            command: SHOW_PREVIOUS.id,
            context: this.kicoolKeybindingContext.id,
            keybinding: SHOW_PREVIOUS_KEYBINDING
        })
    }
}