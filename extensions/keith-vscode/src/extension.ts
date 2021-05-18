import * as vscode from "vscode";

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    console.log('"keith-vscode" extension is now active!');

    const testObj = { a: "123", b: 123 };

    context.subscriptions.push(
        vscode.commands.registerCommand("keith-vscode.helloWorld", async () => {
            // The code you place here will be executed every time your command is executed

            // Display a message box to the user
            vscode.window.showInformationMessage("Hello World from keith-vscode!");

            const res = await vscode.commands.executeCommand(
                "klighd-diagram.showDiagram",
                testObj
            );
            console.log("Received res: ", res);
            // eslint-disable-next-line eqeqeq
            console.log("Exchanged object is the same:", testObj == res);
        })
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
