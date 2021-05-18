import * as vscode from "vscode";
// import { LanguageClient } from "vscode-languageclient";

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    console.log('"klighd-diagram" is now active!');

    context.subscriptions.push(
        vscode.commands.registerCommand("klighd-diagram.showDiagram", (args) => {
            vscode.window.showInformationMessage("This would start to display a diagram");
            console.log("Received args: ", args);
            return args;
        })
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
