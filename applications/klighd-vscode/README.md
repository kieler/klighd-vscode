# KLighD Diagrams

<!-- TODO: Images must come from an https source. They are not packages by vsce. This should be resolved, when this extension is hosted on GitHub. Rename "imagine" to "img" when ready. -->
<!-- <figure style="text-align: center;">
<imagine style="width: 75%;" src="./media/banner.png" alt="Example with a visualized SCChart"/>
<figcaption>Example of the KLighD diagram extension used to visualize a SCChart.</figcaption>
</figure> -->

## Features

This extension visualizes generated KLighD diagrams for other extensions. Some notable features are:

-   Open a diagram for a file in your language
-   Export diagrams as SVG
-   Interactively explore the visualized diagram

## Requirements

> **This extension is not intended to be used directly!**

Instead, it should be used as a dependency by other extensions to easily support diagram
visualization with KLighD. Your host extension is responsible for configuring a language client,
while the KLighD extension handles everything related to diagrams.

### Usage in your extension

1. Add an extension dependency to your extension's `package.json`.

```json
    "extensionDependencies": [
        "kieler.klighd-vscode"
    ],
```

2. Notify the KLighD extension about your language client.

```typescript
import { command } from "klighd-vscode";

export async function activate(context: vscode.ExtensionContext) {
    // ... configuring the language client options

    const lsClient = new LanguageClient("Language Server", serverOptions, clientOptions);

    // Inform the KLighD extension about the LS client.
    // The first argument is your language client.
    // The second argument is an array of language file endings
    // that are supported by your LS client.
    // Returns an ID that is used to identify this extension when future
    // commands are sent to klighd-vscode.
    const refId = await vscode.commands.executeCommand(
        "klighd-vscode.setLanguageClient",
        lsClient,
        ["sctx"]
    );

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
                    "command": "klighd-vscode.diagram.open",
                    "group": "navigation"
                }
            ],
            "editor/context": [
                {
                    "when": "resourceLangId == sctx",
                    "command": "klighd-vscode.diagram.open",
                    "group": "navigation"
                }
            ],
            "explorer/context": [
                {
                    "when": "resourceLangId == sctx",
                    "command": "klighd-vscode.diagram.open",
                    "group": "navigation"
                }
            ]
        }
}
```

### Advanced

The KLighD diagram extension provides the option to intercept diagram actions that are send to the
language server.

_TODO: Write about action handlers. The API is currently quite complex as it simply relies on
Sprotty functionality and might be further abstracted before it is finalized._

## Known Issues

-   Currently, only at most one extension that depends on `kieler.klighd-vscode` can be activated
    at the same time. This causes problems if a workspace opens multiple files that are handled by
    different KLighD dependent extensions.
