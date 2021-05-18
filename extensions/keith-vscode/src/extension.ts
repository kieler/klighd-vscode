import { join } from "path";
import * as vscode from "vscode";
import { LanguageClient, ServerOptions, LanguageClientOptions, Trace } from "vscode-languageclient";

let lsClient: LanguageClient;

const klighd = {
    setLSClient: "klighd-diagram.setLanguageClient",
    showDiagram: "klighd-diagram.showDiagram",
};

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    const lsPath = context.asAbsolutePath("kieler-language-server.linux.jar");

    const serverOptions: ServerOptions = {
        run: { command: "java", args: ["-jar", lsPath] },
        debug: { command: "java", args: ["-jar", lsPath] },
    };
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: "file", language: "sctx" }],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher("**/*.*"),
        },
    };

    lsClient = new LanguageClient("KIELER Language Server", serverOptions, clientOptions, true);

    // Inform the KLighD extension about the LS client
    vscode.commands.executeCommand(klighd.setLSClient, lsClient);

    console.debug("Starting Language Server...");
    lsClient.start();
}

// this method is called when your extension is deactivated
export function deactivate() {
    if (!lsClient) {
        return;
    }
    return lsClient.stop();
}
