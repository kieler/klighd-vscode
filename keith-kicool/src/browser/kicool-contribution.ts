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
import { KeithLanguageClientContribution } from "@kieler/keith-language/lib/browser/keith-language-client-contribution";
import {
    AbstractViewContribution, CommonMenus, DidCreateWidgetEvent, FrontendApplication, FrontendApplicationContribution, KeybindingRegistry, Widget, WidgetManager
} from "@theia/core/lib/browser";
import { Command, CommandHandler, CommandRegistry, MenuModelRegistry, MessageService } from '@theia/core/lib/common';
import { EditorManager, EditorWidget } from "@theia/editor/lib/browser";
import { FileChange, FileSystemWatcher } from "@theia/filesystem/lib/browser";
import { Workspace } from "@theia/languages/lib/browser";
import { OutputChannelManager } from "@theia/output/lib/common/output-channel";
import { inject, injectable } from "inversify";
import { COMPILE, compilerWidgetId, EDITOR_UNDEFINED_MESSAGE, GET_SYSTEMS, OPEN_COMPILER_WIDGET_KEYBINDING, SHOW, SHOW_NEXT_KEYBINDING, SHOW_PREVIOUS_KEYBINDING,
    CANCEL_COMPILATION,
    CANCEL_GET_SYSTEMS} from "../common";
import { delay } from "../common/helper";
import { CodeContainer, CompilationSystems, Snapshot } from "../common/kicool-models";
import { CompilerWidget } from "./compiler-widget";
import { KiCoolKeybindingContext } from "./kicool-keybinding-context";

export const SAVE: Command = {
    id: 'core.save',
    label: 'Save'
};

export const SHOW_NEXT: Command = {
    id: 'kicool:show_next',
    label: 'kicool: Show next'
}
export const SHOW_PREVIOUS: Command = {
    id: 'kicool:show_previous',
    label: 'kicool: Show previous'
}
export const COMPILER: Command = {
    id: 'compiler:toggle',
    label: 'Compiler'
}
export const REQUEST_CS: Command = {
    id: 'kicool:request-compilation-systems',
    label: 'kicool: Request compilation systems'
}
export const TOGGLE_INPLACE: Command = {
    id: 'kicool:toggle-inplace',
    label: 'kicool: Toggle inplace compilation'
}
export const TOGGLE_PRIVATE_SYSTEMS: Command = {
    id: 'kicool:toggle-private-systems',
    label: 'kicool: Toggle show private systems'
}
export const TOGGLE_AUTO_COMPILE: Command = {
    id: 'kicool:toggle-auto-compile',
    label: 'kicool: Toggle auto compile'
}
export const TOGGLE_ENABLE_CP: Command = {
    id: 'kicool:toggle-cp',
    label: 'kicool: Toggle command palette enabled'
}

/**
 * Contribution for CompilerWidget to add functionality to it and link with the current editor.
 */
@injectable()
export class KiCoolContribution extends AbstractViewContribution<CompilerWidget> implements FrontendApplicationContribution {

    isCompiled: Map<string, boolean> = new Map
    sourceURI: Map<string, string> = new Map
    resultMap: Map<string, CodeContainer> = new Map
    indexMap: Map<string, number> = new Map
    lengthMap: Map<string, number> = new Map

    editor: EditorWidget
    compilerWidget: CompilerWidget

    /**
     * Holds all commands, updates after new compilation systems are requested.
     */
    kicoolCommands: Command[] = []

    /**
     * Holds all commands, updates after new compilation systems are requested.
     */
    showCommands: Command[] = []

    /**
     * Enables dynamic registration of command palette commands
     */
    commandPaletteEnabled: boolean = false

    constructor(
        @inject(Workspace) protected readonly workspace: Workspace,
        @inject(WidgetManager) protected readonly widgetManager: WidgetManager,
        @inject(MessageService) protected readonly messageService: MessageService,
        @inject(FrontendApplication) public readonly front: FrontendApplication,
        @inject(KeithLanguageClientContribution) public readonly client: KeithLanguageClientContribution,
        @inject(EditorManager) public readonly editorManager: EditorManager,
        @inject(OutputChannelManager) protected readonly outputManager: OutputChannelManager,
        @inject(KiCoolKeybindingContext) protected readonly kicoolKeybindingContext: KiCoolKeybindingContext,
        @inject(FileSystemWatcher) protected readonly fileSystemWatcher: FileSystemWatcher,
        @inject(KeithDiagramManager) public readonly diagramManager: KeithDiagramManager,
        @inject(CommandRegistry) protected commandRegistry: CommandRegistry,
        @inject(KeybindingRegistry) protected keybindingRegistry: KeybindingRegistry
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
        if (editorManager.activeEditor) {
            // if there is already an active editor, use that to initialize
            this.editor = editorManager.activeEditor
            this.onCurrentEditorChanged(this.editor)
        }
        this.widgetManager.onDidCreateWidget(this.onDidCreateWidget.bind(this))
        // TODO: when the diagram closes, also update the view to the default one
        const widgetPromise = this.widgetManager.getWidget(CompilerWidget.widgetId)
        widgetPromise.then(widget => {
            if (this.compilerWidget === undefined || this.compilerWidget === null) {
                // widget has to be created
                this.initializeCompilerWidget(new CompilerWidget(this))
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
            this.compilerWidget = widget as CompilerWidget
            this.compilerWidget.requestSystemDescriptions(this.requestSystemDescriptions.bind(this))
            this.compilerWidget.onActivateRequest(this.requestSystemDescriptions.bind(this))
            if (this.editor) {
                this.compilerWidget.sourceModelPath = this.editor.editor.uri.toString()
                this.requestSystemDescriptions()
            }
        }
    }

    onDidCreateWidget(e: DidCreateWidgetEvent): void {
        // This does not work, because sometimes you will write in an editor that is currently hidden.
        // if (e.widget instanceof EditorWidget) {
        //     e.widget.activate()
        // }
        if (e.factoryId === CompilerWidget.widgetId) {
            this.initializeCompilerWidget(e.widget)
        }
    }

    onFilesChanged(fileChange: FileChange) {
        // TODO receives two event if file is saved
        if (this.compilerWidget && this.compilerWidget.autoCompile) {
            this.compilerWidget.compileSelectedCompilationSystem()
        }
    }

    onCurrentEditorChanged(editorWidget: EditorWidget | undefined): void {
        if (editorWidget) {
            this.editor = editorWidget
        }
        if (!this.compilerWidget || this.compilerWidget.isDisposed) {
            const widgetPromise = this.widgetManager.getWidget(CompilerWidget.widgetId)
            widgetPromise.then(widget => {
                this.initializeCompilerWidget(widget)
            })
        } else {
            this.requestSystemDescriptions()
        }
        if (this.commandPaletteEnabled) {
            this.kicoolCommands.forEach(command => this.commandRegistry.unregisterCommand(command))
            this.showCommands.forEach(command => this.commandRegistry.unregisterCommand(command))
            this.addCompilationSystemToCommandPalette(this.compilerWidget.systems)
            const codeContainer = this.resultMap.get(this.compilerWidget.sourceModelPath)
            if (codeContainer) {
                this.addShowSnapshotToCommandPalette(codeContainer.files)
            }
        }
    }

    async requestSystemDescriptions() {
        if (this.editor) {
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
            const systems: CompilationSystems[] = await lClient.sendRequest(GET_SYSTEMS, [uri, true]) as CompilationSystems[]
            this.compilerWidget.systems = systems
            if (this.commandPaletteEnabled) {
                this.addCompilationSystemToCommandPalette(systems)
            }
            this.compilerWidget.sourceModelPath = this.editor.editor.uri.toString()
            this.compilerWidget.requestedSystems = false
            this.compilerWidget.lastRequestedUriExtension = this.editor.editor.uri.path.ext
            this.compilerWidget.update()
            this.compilerWidget.onNewSystemsAddedEmitter.fire(this.compilerWidget)
        }
    }

    /**
     * Removes all old compilation systems from command palette and adds new ones.
     * @param systems compilation systems that should get a compile command
     */
    addCompilationSystemToCommandPalette(systems: CompilationSystems[]) {
        // remove existing commands
        this.kicoolCommands.forEach(command => {
            this.commandRegistry.unregisterCommand(command)
        })
        // add new commands
        systems.forEach(system => {
            if (system.isPublic || this.compilerWidget.showPrivateSystems) {
                const command: Command = {id: "kicool: " + system.id, label: "kicool: " + system.label}
                this.kicoolCommands.push(command)
                const handler: CommandHandler = {
                    execute: () => {
                        this.compile(system.id, this.compilerWidget.compileInplace);
                    }
                }
                this.commandRegistry.registerCommand(command, handler)
            } else {
                // Do not register this command, since it is private
            }
        })
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
        if (this.commandPaletteEnabled) {
            this.registerGeneralKiCoolCommands()
        }
        commands.registerCommand(TOGGLE_ENABLE_CP, {
            execute: () => {
                this.commandPaletteEnabled = !this.commandPaletteEnabled
                if (this.commandPaletteEnabled) {
                    this.registerGeneralKiCoolCommands()
                    this.registerShowNext()
                    this.registerShowPrevious()
                    this.addCompilationSystemToCommandPalette(this.compilerWidget.systems)
                    const codeContainer = this.resultMap.get(this.compilerWidget.sourceModelPath)
                    if (codeContainer) {
                        this.addShowSnapshotToCommandPalette(codeContainer.files)
                    }
                } else {
                    commands.unregisterCommand(TOGGLE_AUTO_COMPILE)
                    commands.unregisterCommand(TOGGLE_PRIVATE_SYSTEMS)
                    commands.unregisterCommand(TOGGLE_INPLACE)
                    commands.unregisterCommand(REQUEST_CS)
                    commands.unregisterCommand(SHOW_NEXT)
                    commands.unregisterCommand(SHOW_PREVIOUS)
                    this.kicoolCommands.forEach(command => commands.unregisterCommand(command))
                    this.showCommands.forEach(command => commands.unregisterCommand(command))
                }
            }
        })
        commands.registerCommand(COMPILER, {
            execute: async () => {
                this.openView({
                    toggle: true,
                    reveal: true
                })
            }
        })
    }

    registerGeneralKiCoolCommands() {
        this.commandRegistry.registerCommand(TOGGLE_AUTO_COMPILE, {
            execute: () => {
                if (this.compilerWidget) {
                    this.message("Set autoCompile from " + this.compilerWidget.autoCompile + " to " + !this.compilerWidget.autoCompile, "INFO")
                    this.compilerWidget.autoCompile = !this.compilerWidget.autoCompile
                    this.compilerWidget.update()
                }
            }
        })
        this.commandRegistry.registerCommand(TOGGLE_PRIVATE_SYSTEMS, {
            execute: () => {
                if (this.compilerWidget) {
                    this.message("Set showPrivateSystems from " + this.compilerWidget.showPrivateSystems + " to " + !this.compilerWidget.showPrivateSystems, "INFO")
                    this.compilerWidget.showPrivateSystems = !this.compilerWidget.showPrivateSystems
                    // Update compile commands accordingly
                    if (this.commandPaletteEnabled) {
                        this.addCompilationSystemToCommandPalette(this.compilerWidget.systems)
                    }
                    this.compilerWidget.update()
                }
            }
        })
        this.commandRegistry.registerCommand(TOGGLE_INPLACE, {
            execute: () => {
                if (this.compilerWidget) {
                    this.message("Set compileInplace from " + this.compilerWidget.compileInplace + " to " + !this.compilerWidget.compileInplace, "INFO")
                    this.compilerWidget.compileInplace = !this.compilerWidget.compileInplace
                    this.compilerWidget.update()
                }
            }
        })
        this.commandRegistry.registerCommand(REQUEST_CS, {
            execute: async () => {
                this.requestSystemDescriptions()
                this.message("Registered compilation systems", "INFO")
            }
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
        const lclient = await this.client.languageClient
        this.indexMap.set(uri, index)
        await lclient.sendRequest(SHOW, [uri, KeithDiagramManager.DIAGRAM_TYPE + '_sprotty', index])
    }


    public async compile(command: string, inplace: boolean): Promise<void> {
        if (!this.compilerWidget.autoCompile) {
            this.message("Compiling with " + command, "info")
        }
        this.compilerWidget.compiling = true
        this.compilerWidget.update()
        await this.executeCompile(command, inplace)
        this.compilerWidget.lastInvokedCompilation = command
        this.compilerWidget.update()
    }

    async executeCompile(command: string, inplace: boolean): Promise<void> {
        if (!this.editor) {
            this.message(EDITOR_UNDEFINED_MESSAGE, "error")
            return;
        }

        const uri = this.compilerWidget.sourceModelPath
        const lclient = await this.client.languageClient
        const snapshotsDescriptions: CodeContainer = await lclient.sendRequest(COMPILE, [uri, KeithDiagramManager.DIAGRAM_TYPE + '_sprotty', command, inplace]) as CodeContainer
        // Show next/previous command and keybinding if not already added
        if (!this.commandRegistry.getCommand(SHOW_NEXT.id)) {
            this.registerShowNext()
            this.registerShowPrevious()
        }
        // Add show commands to command palette if needed
        if (this.commandPaletteEnabled) {
            this.addShowSnapshotToCommandPalette(snapshotsDescriptions.files)
        }
        if (!this.compilerWidget.autoCompile) {
            this.message("Got compilation result for " + uri, "info")
        }
        if (uri.startsWith("\"")) {
            this.message("Found error in " + uri, "error")
        }
        this.isCompiled.set(uri as string, true)
        this.resultMap.set(uri as string, snapshotsDescriptions)
        const length = snapshotsDescriptions.files.reduce((previousSum, snapshots) => {
            return previousSum + snapshots.length
        }, 0)
        this.lengthMap.set(uri as string, length)
        this.indexMap.set(uri as string, length - 1)
        this.compilerWidget.compiling = false
        this.compilerWidget.update()
    }

    /**
     * Cancels compilation by stopping the compilation thread on the LS.
     */
    public async cancelCompilation(): Promise<void> {
        const lclient = await this.client.languageClient
        const success = await lclient.sendRequest(CANCEL_COMPILATION)
        if (success) {
            this.compilerWidget.compiling = false
        }
        this.compilerWidget.update()
    }

    /**
     * Cancels compilation by stopping the compilation thread on the LS.
     */
    public async cancelGetSystems(): Promise<void> {
        const lclient = await this.client.languageClient
        const success = await lclient.sendRequest(CANCEL_GET_SYSTEMS)
        if (success) {
            this.compilerWidget.requestedSystems = false
        }
        this.compilerWidget.update()
    }

    addShowSnapshotToCommandPalette(snapshots: Snapshot[][]) {
        let resultingMaxIndex = 0
        this.showCommands.forEach(command => {
            this.commandRegistry.unregisterCommand(command)
        })
        snapshots.forEach(list => {
            const currentIndex = resultingMaxIndex
            list.forEach(snapshot => {
                const command = {id: snapshot.name + snapshot.snapshotIndex, label: "kicool: Show " + snapshot.name + " " + snapshot.snapshotIndex}
                this.showCommands.push(command)
                const handler = {
                    execute: () => {
                        this.show(this.compilerWidget.sourceModelPath, currentIndex)
                    }
                }
                this.commandRegistry.registerCommand(command, handler)
                resultingMaxIndex++
            })
        })
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