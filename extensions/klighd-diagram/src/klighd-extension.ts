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
 * This code is provided under the terms of the Eclipse Public License (EPL).
 */
import { ExtensionContext } from "vscode";
import {
    SprottyDiagramIdentifier,
    SprottyLspVscodeExtension,
    SprottyLspWebview,
} from "sprotty-vscode/lib/lsp";
import { SprottyWebview } from "sprotty-vscode";
import { LanguageClient } from "vscode-languageclient";
import { diagramType, extensionId } from "./constants";

/**
 * Bootstrap an extension with `sprotty-vscode` that manages a webview which
 * contains a Sprotty container to display diagrams.
 * 
 * @see https://github.com/eclipse/sprotty-vscode
 */
export class KLighDExtension extends SprottyLspVscodeExtension {
    // Ideally this should be an instance property and not a static field. However,
    // SprottyLspVscodeExtension calls activateLanguageClient in its constructor
    // which happens before an instance property would be assigned by our
    // constructor, since the super call has to be the first expression in the
    // constructor.
    static lsClient: LanguageClient;

    constructor(context: ExtensionContext) {
        super(extensionId, context);
    }

    protected createWebView(identifier: SprottyDiagramIdentifier): SprottyWebview {
        const webview = new SprottyLspWebview({
            extension: this,
            identifier,
            localResourceRoots: [this.getExtensionFileUri("dist")],
            scriptUri: this.getExtensionFileUri("dist", "webview.js"),
            singleton: true,
        });

        return webview;
    }

    protected getDiagramType(_: any[]): string | Promise<string | undefined> | undefined {
        return diagramType;
    }

    protected activateLanguageClient(_: ExtensionContext): LanguageClient {
        // This extension does not manage any language clients. It receives it's
        // clients from a host extension. See the "setLanguageClient" command.
        return KLighDExtension.lsClient;
    }
}
