# KLighD Diagrams for Visual Studio Code

<figure style="text-align: center;">
<img style="width: 75%;" src="./media/banner.png" alt="Example with a visualized SCChart"/>
<figcaption>Example of the KLighD diagram extension used to visualize a SCChart.</figcaption>
</figure>

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

### Disclaimer

Developing a language server for your extension that uses [KLighD](https://github.com/kieler/KLighD)
to fulfill all requirements to be usable with this extension is no easy task. Until the documentation about building your own language
server is improved, feel free to seek advice from a member of the KIELER working group.

An example for a simple language server with KLighD synthesis support can be found
[here](https://github.com/kieler/osgiviz/tree/master/plugins/de.cau.cs.kieler.osgiviz.language.server).
Configuration for the build process using Maven Tycho can be found
[here](https://github.com/kieler/osgiviz/tree/master/build/de.cau.cs.kieler.osgiviz.language.server.cli).
The VS Code extension for this language server can be found
[here](https://github.com/kieler/osgiviz/tree/master/extension/osgiviz).

### Usage in your extension

1. Add an extension dependency to your extension's `package.json`.

```json
    "extensionDependencies": [
        "kieler.klighd-vscode"
    ],
```

2. Notify the KLighD extension about your language client.

```typescript
export async function activate(context: vscode.ExtensionContext) {
    // ... configuring the language client options

    const lsClient = new LanguageClient('Language Server', serverOptions, clientOptions)

    // Inform the KLighD extension about the LS client.
    // The first argument is your language client.
    // The second argument is an array of language file endings
    // that are supported by your LS client.
    await vscode.commands.executeCommand('klighd-vscode.setLanguageClient', lsClient, ['sctx'])

    console.debug('Starting Language Server...')
    lsClient.start()
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

### Intercepting Messages

The KLighD diagram extension provides the option to intercept diagram actions that are about to be
sent to the language server. Each action has an identifier named `kind`.

To intercept an action, your extension has to provide an action handler with the following
signature:

```typescript
type ActionHandler = (action: { kind: string }) => Promise<void>
```

To register your action handler with the `klighd-vscode` extension call the following command:

```typescript
// - kind: the action kind that should be intercepted by the handler
// - handler: the action handler that is called for the provided action type.
vscode.commands.executeCommand("klighd-vscode.addActionHandler", kind: string, handler: ActionHandler);
```

### Dispatching Actions

The KLighD diagram extension provides the ability to send an action to the open diagram view that
belongs to the host extension. The action will be handled by the diagram core and potentially sent to
the language server if it is handled that way.

To send an action to a `klighd-vscode` webview, execute the following command:

```typescript
// - action: a valid Sprotty action that is sent to open diagram views.
vscode.commands.executeCommand("klighd-vscode.dispatchAction", action: Action)
```

## Known Issues

-   Currently, only at most one extension that depends on `kieler.klighd-vscode` can be activated at
    the same time. This causes problems if a workspace opens multiple files that are handled by
    different KLighD dependent extensions. This issue is tracked
    [here](https://github.com/kieler/klighd-vscode/issues/6).
-   See [here](https://github.com/kieler/klighd-vscode/issues) for further issues.
