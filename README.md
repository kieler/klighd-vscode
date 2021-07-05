# KLighD for the web

The repository contains multiple projects that use web technologies to visualize
[KLighD](https://github.com/kieler/KLighD) generated diagrams.

## Packages

This repository contains a [monorepo](https://en.wikipedia.org/wiki/Monorepo) for different KLighD
related, web-based packages. The packages are seperated in two types:

-   Packages that produce **usable applications** are placed in the `applications` folder.
-   Packages that serve as **library code** are placed in the `packages` folder.

| Package name                                        | Type        | Description                                                                                                                                                              |
| :-------------------------------------------------- | :---------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [klighd-core](./packages/klighd-core)               | library     | Core package to visualize KLighD generated diagrams. Based on [Sprotty](https://github.com/eclipse/sprotty).                                                             |
| [klighd-interactive](./packages/klighd-interactive) | library     | Support module for `klighd-core` to interactively apply constraints to the diagram.                                                                                      |
| [klighd-cli](./applications/klighd-cli)             | application | CLI and web-server to visualize diagrams in the browser using klighd-core`.                                                                                              |
| [klighd-vscode](./applications/klighd-vscode)       | application | Visual Studio Code extension that uses `klighd-core` to add diagram support to VS Code. Should be used by other extensions to visualize their KLighD generated diagrams. |

## Contributing

### Requirements

Development of this project requires [Node.js _v14.x_](https://nodejs.org) and
[yarn _v1.x_](https://classic.yarnpkg.com/).

Developing the `klighd-vscode` extension requires an extension that has a dependency on
`klighd-vscode` and provides a language client with KLighD synthesis capabilities. A good candidate
for development is the `kieler.keith-vscode` ([under development](https://git.rtsys.informatik.uni-kiel.de/projects/KIELER/repos/keith/browse?at=cfr/monorepo-restructure)) extension.

Furthermore, development of the `klighd-cli` requires a language server with KLighD synthesis
capabilities. The server can either be started separately, using a socket for communication, or
placed as a jar named `language-server.jar` in the _applications/klighd-cli_ folder.

### Scripts

> All scripts that are available at the monorepo root. Run a script with `yarn <script>`. More
> specific scripts may be provided by each package.

| Script name | Description                                                                                                                                |
| :---------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| clean       | Removes all build results in each package.                                                                                                 |
| lint        | Runs eslint in all packages to identify style problems.                                                                                    |
| build       | Builds all packages for production.                                                                                                        |
| watch       | Builds all packages for development in watch mode.                                                                                         |
| package     | Builds and packages supported packages for distribution. E.g. creates a `klighd-vscode.vsix` file and creates self-contained CLI binaries. |

### Developing using the `klighd-cli`

1. Fulfill the requirements above.
1. Run `yarn` in the monorepo root to install all dependencies (if not already done).
1. Run `yarn watch` in the monorepo root to watch all packages for changes.
1. Run `yarn start` or `yarn socket` in the _applications/klighd-cli_ folder to start a web-server,
   serving the standalone view.
    - `yarn start` uses a `language-server.jar` file placed in the `klighd-cli` folder.
    - `yarn socket` uses a socket connection (default port 5007) to connect to the LS.
1. Navigate to `http://localhost:8000?source=file:///<path-to-diagram-file>` in your browser to
   inspect the standalone view.

### Create self-contained `klighd-cli` binaries

1. Fulfill the requirements above.
1. Run `yarn` in the monorepo root to install all dependencies (if not already done).
1. Run `yarn package`
1. The packaged CLI can be found in _applications/klighd-cli/bin_ with a version for each platform.

The self-contained CLI does not contain a language server to make it more flexible for different
language servers. Run `klighd-{os} -h` for information on how to provide a language server for the
CLI.

### Developing using the VS Code extension

We recommend VS Code to develop the VS Code extension to make use of the provided launch tasks. The
following steps have are required to start developing.

1. Fulfill the requirements above.
1. Install all
   [workspace recommended extensions](https://code.visualstudio.com/docs/editor/extension-marketplace#_recommended-extensions).
1. Run `yarn` in the monorepo root to install all dependencies (if not already done).
1. Run the "Launch VS Code Extension" launch configuration. This also runs a task to watch all packages.
1. A VS Code instance with the `klighd-vscode` extension should be started.
1. After changes to your files, run the "Reload Window" command in your dev VS Code instance.

### Locally install the VS Code extension

1. Fulfill the requirements above.
1. Run `yarn` in the monorepo root to install all dependencies (if not already done).
1. Run `yarn package`
1. Run `code --install-extension applications/klighd-vscode/klighd-vscode.vsix`
