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

import {
    AbstractViewContribution, CommonMenus, DidCreateWidgetEvent, FrontendApplication, FrontendApplicationContribution, KeybindingRegistry, Widget, WidgetManager
} from "@theia/core/lib/browser";
import { Command, CommandRegistry, MenuModelRegistry, MessageService } from '@theia/core/lib/common';
import { EditorManager, EditorWidget } from "@theia/editor/lib/browser";
import { FileChange, FileSystemWatcher } from "@theia/filesystem/lib/browser";
import { Workspace } from "@theia/languages/lib/browser";
import { OutputChannelManager } from "@theia/output/lib/common/output-channel";
import { inject, injectable } from "inversify";
import { KeithDiagramManager } from 'keith-diagram/lib/keith-diagram-manager';
import { KeithLanguageClientContribution } from "keith-language/lib/browser/keith-language-client-contribution";
import { COMPILE, compilerWidgetId, EDITOR_UNDEFINED_MESSAGE, GET_SYSTEMS, OPEN_COMPILER_WIDGET_KEYBINDING, SHOW, SHOW_NEXT_KEYBINDING, SHOW_PREVIOUS_KEYBINDING } from "../common";
import { CodeContainer, CompilationSystems } from "../common/kicool-models";
import { CompilerWidget } from "./compiler-widget";
import { KiCoolKeybindingContext } from "./kicool-keybinding-context";
import { delay } from "../common/helper"

export const SAVE: Command = {
    id: 'core.save',
    label: 'Save'
};

export const SHOW_NEXT: Command = {
    id: 'show_next',
    label: 'Show next'
}
export const SHOW_PREVIOUS: Command = {
    id: 'show_previous',
    label: 'Show previous'
}
export const COMPILER: Command = {
    id: 'compiler:toggle',
    label: 'Compiler'
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
        @inject(KeithDiagramManager) public readonly diagramManager: KeithDiagramManager
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
            this.initializeCompilerWidget(widget)
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
    }

    async requestSystemDescriptions() {
        if (this.editor) {
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
            this.compilerWidget.sourceModelPath = this.editor.editor.uri.toString()
            this.compilerWidget.update()
        }
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        [
            {
                command: SHOW_PREVIOUS.id,
                context: this.kicoolKeybindingContext.id,
                keybinding: SHOW_PREVIOUS_KEYBINDING
            },
            {
                command: SHOW_NEXT.id,
                context: this.kicoolKeybindingContext.id,
                keybinding: SHOW_NEXT_KEYBINDING
            },
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
        commands.registerCommand(SHOW_NEXT, {
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
                const index = this.indexMap.get(uri)
                if (index !== 0 && !index) {
                    this.message("Index is undefined", "error")
                    return false
                }
                const length = this.lengthMap.get(uri)
                if (length !== 0 && !length) {
                    this.message("Length is undefined", "error")
                    return false
                }
                if (index === length - 1) { // no show necessary, since the last snapshot is already drawn
                    return
                }
                this.show(uri, Math.min(index + 1, length - 1))
            }
        })
        commands.registerCommand(SHOW_PREVIOUS, {
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
                const index = this.indexMap.get(uri)
                if (index !== 0 && !index) {
                    this.message("Index is undefined", "error")
                    return false
                }
                if (index === 0) { // no show necessary, since the first snapshot is already drawn
                    return
                }
                // TODO add show for original model here
                this.show(uri, Math.max(index - 1, 0))
            }
        })
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


    public compile(command: string) {
        if (!this.compilerWidget.autoCompile) {
            this.message("Compiling with " + command, "info")
        }
        this.executeCompile(command)
    }

    async executeCompile(command: string): Promise<void> {
        if (!this.editor) {
            this.message(EDITOR_UNDEFINED_MESSAGE, "error")
            return;
        }

        const uri = this.compilerWidget.sourceModelPath
        const lclient = await this.client.languageClient
        const snapshotsDescriptions: CodeContainer = await lclient.sendRequest(COMPILE, [uri, KeithDiagramManager.DIAGRAM_TYPE + '_sprotty', command,
            this.compilerWidget.compileInplace]) as CodeContainer
        if (!this.compilerWidget.autoCompile) {
            this.message("Got compilation result for " + uri, "info")
        }
        if (uri.startsWith("\"")) {
            this.message("Found error in " + uri, "error")
        }
        this.isCompiled.set(uri as string, true)
        this.resultMap.set(uri as string, snapshotsDescriptions)
        this.indexMap.set(uri as string, -1)
        this.lengthMap.set(uri as string, snapshotsDescriptions.files.length)
        const widget = this.front.shell.revealWidget(compilerWidgetId)
        if (widget) {
            widget.update()
        }
    }
}