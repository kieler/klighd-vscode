# KLighD for the web

The repository contains multiple projects that use web technologies to visualize
[KLighD](https://github.com/kieler/KLighD) generated diagrams.

## Packages

-   [klighd-core](./packages/klighd-core): Core package to visualize KLighD generated diagrams. Based on [Sprotty](https://github.com/eclipse/sprotty).
-   [klighd-interactive](./packages/klighd-interactive): Support module for `klighd-core` to
    interactively apply constraints to the diagram.
-   [klighd-cli](./applications/klighd-cli): CLI + web-server to visualize diagrams in the browser
    using `klighd-core`.
-   [klighd-vscode](./applications/klighd-vscode): VSCode extension that uses `klighd-core` to add
    diagram support to VSCode. Should be used by other extensions to visualize their KLighD
    generated diagrams.

## Contributing

Developing this project requires Node.js v14.x and yarn v1.x.