import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient";

const commandKey = {
    setLSClient: "klighd-diagram.setLanguageClient",
    showDiagram: "klighd-diagram.showDiagram",
};

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    let lsClient: LanguageClient;

    // Command provided for other extensions to register the LS used to generate
    // diagrams with KLighD.
    context.subscriptions.push(
        vscode.commands.registerCommand(
            commandKey.setLSClient,
            (client: LanguageClient) => {
                // TODO: Check if client is really a LanguageClient. Instanceof check does not work...
                lsClient = client;
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(commandKey.showDiagram, (args) => {
            vscode.window.showInformationMessage("This would start to display a diagram");
            console.log("Received args: ", args);
            return args;
        })
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
