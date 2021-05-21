# KLighD Diagrams

This extension visualizes generated KLighD diagrams for other extensions.

## Features

-   Open a diagram for a file in your language
-   Export diagrams as SVG
-   Interactively explore the visualized diagram

## Requirements

> **This extension is not intended to be used directly!**

Instead, it should be used as a dependency by other extensions to easily
support diagram visualization with KLighD.
Your host extension is responsible for configuring a language client, while the KLighD
extension handles everything related to diagrams.

### Usage in your extension

1. Add an extension dependency to your extension's `package.json`.

```json
    "extensionDependencies": [
        "kieler.klighd-diagram"
    ],
```

2. Notify the KLighD extension about your language client.

```typescript
export async function activate(context: vscode.ExtensionContext) {
    // ... configuring the language client options

    const lsClient = new LanguageClient("Language Server", serverOptions, clientOptions);

    // Inform the KLighD extension about the LS client
    // The first argument is your language client
    // The second argument is an array of language file endings that are supported by your LS client
    await vscode.commands.executeCommand("klighd-diagram.setLanguageClient", lsClient, ["sctx"]);

    console.debug("Starting Language Server...");
    lsClient.start();
}
```

3. Configure extension contribution points to open a diagram view for your language.

```json
"contributes": {
    "menus": {
            "editor/title": [
                {
                    "when": "resourceLangId == sctx",
                    "command": "klighd-diagram.diagram.open",
                    "group": "navigation"
                }
            ],
            "editor/context": [
                {
                    "when": "resourceLangId == sctx",
                    "command": "klighd-diagram.diagram.open",
                    "group": "navigation"
                }
            ],
            "explorer/context": [
                {
                    "when": "resourceLangId == sctx",
                    "command": "klighd-diagram.diagram.open",
                    "group": "navigation"
                }
            ]
        }
}
```

## Known Issues
