/*
 * KIELER - Kiel Integrated Environment for Layout Eclipse RichClient
 *
 * http://rtsys.informatik.uni-kiel.de/kieler
 *
 * Copyright 2023 by
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
import { KlighdFitToScreenAction, KlighdRequestExportSvgAction, RefreshDiagramAction, RefreshLayoutAction } from '@kieler/klighd-core';
import "reflect-metadata";
import { CenterAction } from "sprotty-protocol";
import * as vscode from "vscode";
import { command } from "./constants";
import { KLighDWebviewPanelManager } from './webview-panel-manager';


/**
 * Overwrite register from sprotty-vscode's default contributions commands to
 * fix zooming problems with diagram.fit when an element is selected.
 *
 * _Note: This can not call the default implementation since VS Code is not able
 * to overwrite commands and would throw an error._
 */
export function registerCommands(manager: KLighDWebviewPanelManager, context: vscode.ExtensionContext): void {
    function getURI(commandArgs: any[]): vscode.Uri | undefined {
        if (commandArgs.length > 0 && commandArgs[0] instanceof vscode.Uri) {
            return commandArgs[0];
        }
        if (vscode.window.activeTextEditor) {
            return vscode.window.activeTextEditor.document.uri;
        }
        return undefined;
    }
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramOpen, async (...commandArgs: any[]) => {
            const uri = getURI(commandArgs);
            if (uri) {
                manager.storageService.setItem('diagramOpen', true)
                manager.openDiagram(uri, { reveal: true });
            }
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramCenter, () => {
            const activeWebview = manager.findActiveWebview();
            if (activeWebview) {
                activeWebview.sendAction(CenterAction.create([], { animate: true }));
            }
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramFit, () => {
            const activeWebview = manager.findActiveWebview();
            if (activeWebview) {
                activeWebview.sendAction(KlighdFitToScreenAction.create(true));
            }
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramLayout, () => {
            const activeWebview = manager.findActiveWebview();
            if (activeWebview) {
                activeWebview.sendAction(RefreshLayoutAction.create());
            }
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramRefresh, () => {
            const activeWebview = manager.findActiveWebview();
            if (activeWebview) {
                activeWebview.sendAction(RefreshDiagramAction.create());
            }
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramExport, () => {
            const activeWebview = manager.findActiveWebview();
            if (activeWebview) {
                // TODO: check if this is fixed in a newer Sprotty release.
                activeWebview.sendAction(KlighdRequestExportSvgAction.create());
            }
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramSync, () => {
            manager.setSyncWithEditor(true)
            const activeTextEditor = vscode.window.activeTextEditor
            if (activeTextEditor) {
                const uri = activeTextEditor.document.fileName
                vscode.commands.executeCommand(command.diagramOpen, vscode.Uri.file(uri))
            }
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(command.diagramNoSync, () => {
            manager.setSyncWithEditor(false)
        })
    );
}

/**
 * Register a listener to active text editor switching. After every switch, the diagram view attempts to
 * open the text editor's document.
 * Turns this behavior off if sync with editor is disabled.
 */
export function registerTextEditorSync(manager: KLighDWebviewPanelManager, context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(async editor => {
            const activeWebview = manager.findActiveWebview()
            const alreadyOpen = editor?.document.uri.scheme + "://" + editor?.document.uri.path === activeWebview?.diagramIdentifier?.uri
            const shouldOpen = manager.storageService.getItem('diagramOpen')
            if (editor && manager.getSyncWithEdior() && !alreadyOpen && shouldOpen) {
                manager.openDiagram(editor.document.uri);
            }
        })
    );
}