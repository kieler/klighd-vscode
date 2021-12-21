/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2021 by
 * + Kiel University
 *   + Department of Computer Science
 *     + Real-Time and Embedded Systems Group
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {
    KlighdFitToScreenAction,
    RefreshDiagramAction,
    RefreshLayoutAction,
} from "@kieler/klighd-core";
import { RequestExportSvgAction } from "sprotty";
import { Action, CenterAction } from "sprotty-protocol";
import { serializeUri, SprottyWebview } from "sprotty-vscode";
import { ActionHandler } from "sprotty-vscode/lib/action-handler";
import { SprottyDiagramIdentifier, SprottyLspVscodeExtension } from "sprotty-vscode/lib/lsp";
import { commands, ExtensionContext, Uri } from "vscode";
import { CommonLanguageClient } from "vscode-languageclient";
import { command, diagramType, extensionId } from "./constants";
import { StorageService } from "./storage/storage-service";
import { KLighDWebview } from "./klighd-webview";

/** Options required to construct a KLighDExtension */
interface KLighDExtensionOptions {
    lsClient: CommonLanguageClient;
    supportedFileEnding: string[];
    storageService: StorageService;
}

/**
 * Callback provided for other extension to register an {@link ActionHandler}.
 * To simplify the implementation for other extensions, which do not have access to
 * the type definition, we simplify the requirements to provide an action kind and
 * callback instead of an class.
 * @returns `true` if the action should be forwarded to the server.
 */
export type ActionHandlerCallback = (action: Action) => Promise<boolean>;

/**
 * Type definition for a class that implements an {@link ActionHandler}.
 * Corresponds to the expected type of `sprotty-vscode` for `SprottyWebview.addActionHandler`.
 */
type ActionHandlerClass = new (webview: SprottyWebview) => ActionHandler;

/**
 * Bootstrap an extension with `sprotty-vscode` that manages a webview which
 * contains a Sprotty container to display diagrams.
 *
 * @see https://github.com/eclipse/sprotty-vscode
 */
export class KLighDExtension extends SprottyLspVscodeExtension {
    // SprottyLspVscodeExtension calls "activateLanguageClient" in its constructor
    // to receive a language client that is used for the diagrams and register
    // event handlers on the client.
    // We have to store our given client somewhere so it is available for "activateLanguageClient"
    // to return. Using a instance property does not work because the super() call
    // in the constructor, and therefore the "activateLanguageClient" call, has to happen
    // before modifications to the instance. The only possible hack around this
    // problem is a static property.
    // PS. This hack is approved by "als".
    private static lsClient: CommonLanguageClient;
    private supportedFileEndings: string[];

    // This service is required here, so it can be hooked into created webviews.
    private storageService: StorageService;

    /**
     * Stored action handlers that where registered by another extension.
     * They are added to the web views created for their languageclient.
     */
    private actionHandlers: ActionHandlerClass[];

    constructor(context: ExtensionContext, options: KLighDExtensionOptions) {
        // The static property has to be set before super is called. Otherwise,
        // the Sprotty glue-code has no language client.
        KLighDExtension.lsClient = options.lsClient;
        super(extensionId, context);

        this.storageService = options.storageService;
        this.supportedFileEndings = options.supportedFileEnding;
        this.actionHandlers = [];
    }

    /** Register an action handler that intercepts action messages that are sent to the server. */
    addActionHandler(kind: string, handler: ActionHandlerCallback): void {
        // Dynamically create an ActionHandler class for other extensions.
        // This simplifies their implementation requirements to intercept actions.
        class ActionHandlerImpl implements ActionHandler {
            kind = kind;
            handleAction = handler;
        }
        this.actionHandlers.push(ActionHandlerImpl);
    }

    /** @override */
    protected override createWebView(identifier: SprottyDiagramIdentifier): SprottyWebview {
        const webview = new KLighDWebview({
            extension: this,
            identifier,
            localResourceRoots: [this.getExtensionFileUri("dist")],
            scriptUri: this.getExtensionFileUri("dist", "webview.js"),
            singleton: true,
        });

        // Hook up the new webview so it can report data for persistence.
        this.storageService.addWebview(webview);

        // Attach all action handlers, registered in this instance, to the created Sprotty webview.
        for (const handler of this.actionHandlers) {
            webview.addActionHandler(handler);
        }

        return webview;
    }
    
    /** @override */
    protected override async createDiagramIdentifier(commandArgs: any[]): Promise<SprottyDiagramIdentifier | undefined> {
        const uri = await this.getURI(commandArgs);
        const diagramType = await this.getDiagramType(commandArgs);
        if (!uri || !diagramType)
            return undefined;
        const clientId = diagramType + '_sprotty';
        return {
            diagramType,
            uri: serializeUri(uri),
            clientId
        };
    }

    /** All {@link KLighDWebview}s that are created by this {@link SprottyLspVscodeExtension}. */
    get webviews(): KLighDWebview[] {
        // Casting is alright since we only spawn a KLighDWebview. However, sprotty-vscode
        // doesn't know it and the webviewMap is managed by sprotty-vscode.
        return Array.from(this.webviewMap.values()) as KLighDWebview[];
    }

    /**
     * `commandArgs` are the args passed to the diagram open command.
     * Only returning a diagramType for support fileEndings (defined by host extension)
     * prevents the webview content from changing if an unsupported editor is focused,
     * while the diagram view is open.
     *
     * For example: Focusing the output/task panel causes the webview to update and
     * trying to render a model in the clearly unsupported situation.
     */
    protected getDiagramType(commandArgs: any[]): string | Promise<string | undefined> | undefined {
        if (commandArgs[0] instanceof Uri && this.pathHasSupportedFileEnding(commandArgs[0].path)) {
            return diagramType;
        }
        return undefined;
    }

    private pathHasSupportedFileEnding(path: string) {
        return this.supportedFileEndings.some((ending) => path.endsWith(ending));
    }

    protected override activateLanguageClient(): CommonLanguageClient {
        // This extension does not manage any language clients. It receives it's
        // clients from a host extension. See the "setLanguageClient" command.
        return KLighDExtension.lsClient;
    }

    /**
     * Overwrite register from {@link SprottyLspVscodeExtension} commands to
     * fix zooming problems with diagram.fit when an element is selected.
     *
     * _Note: This can not call the super implementation since VS Code is not able
     * to overwrite commands and would throw an error._
     */
    protected override registerCommands(): void {
        this.context.subscriptions.push(
            commands.registerCommand(command.diagramOpen, async (...commandArgs: any[]) => {
                const identifier = await this.createDiagramIdentifier(commandArgs);
                if (identifier) {
                    const key = this.getKey(identifier);
                    let webView = this.singleton || this.webviewMap.get(key);
                    if (webView) {
                        // Force reloading allows the user to update the diagram view
                        // even if "sync with editor" is disabled
                        (webView as KLighDWebview).forceReloadContent(identifier);
                        webView.diagramPanel.reveal(webView.diagramPanel.viewColumn);
                    } else {
                        webView = this.createWebView(identifier);
                        this.webviewMap.set(key, webView);
                        if (webView.singleton) {
                            this.singleton = webView;
                        }
                    }
                }
            })
        );
        this.context.subscriptions.push(
            commands.registerCommand(command.diagramCenter, () => {
                const activeWebview = this.findActiveWebview();
                if (activeWebview) {
                    activeWebview.dispatch(CenterAction.create([], { animate: true }));
                }
            })
        );
        this.context.subscriptions.push(
            commands.registerCommand(command.diagramFit, () => {
                const activeWebview = this.findActiveWebview();
                if (activeWebview) {
                    activeWebview.dispatch(KlighdFitToScreenAction.create(true));
                }
            })
        );
        this.context.subscriptions.push(
            commands.registerCommand(command.diagramLayout, () => {
                const activeWebview = this.findActiveWebview();
                if (activeWebview) {
                    activeWebview.dispatch(RefreshLayoutAction.create());
                }
            })
        );
        this.context.subscriptions.push(
            commands.registerCommand(command.diagramRefresh, () => {
                const activeWebview = this.findActiveWebview();
                if (activeWebview) {
                    activeWebview.dispatch(RefreshDiagramAction.create());
                }
            })
        );
        this.context.subscriptions.push(
            commands.registerCommand(command.diagramExport, () => {
                const activeWebview = this.findActiveWebview();
                if (activeWebview) {
                    activeWebview.dispatch(RequestExportSvgAction.create());
                }
            })
        );
        this.context.subscriptions.push(
            commands.registerCommand(command.diagramSync, () => {
                const activeWebview = this.findActiveWebview();

                (activeWebview as KLighDWebview)?.setSyncWithEditor?.(true);
            })
        );
        this.context.subscriptions.push(
            commands.registerCommand(command.diagramNoSync, () => {
                const activeWebview = this.findActiveWebview();

                (activeWebview as KLighDWebview)?.setSyncWithEditor?.(false);
            })
        );
    }
}
