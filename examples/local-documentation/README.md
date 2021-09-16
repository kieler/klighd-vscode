# Using the CLI for Local Documentation

This example highlights how the CLI can be used to embed a diagram visualization in local web-based
documentation.

> The key ingredients are `iframe` elements and the `klighd serve` command.

`Serve` starts the web server, but does not open a diagram view. Instead, `iframe` elements embed
diagram views into the documentation by pointing to the started web server and provide paths to the
files that should be visualized.

An example for a documentation that relies on the
[KIELER language server](https://rtsys.informatik.uni-kiel.de/~kieler/files/release_sccharts_1.2.0/ls)
can be found in the `index.html` file.

Steps required to try the example yourself:

1. Download the content of this (`local-documentation`) folder or clone this repo.
2. Download the latest version of the CLI [here](https://github.com/kieler/klighd-vscode/releases)
   if not done already.
3. In the `index.html` file, modify the absolute paths in the `iframe` elements to match your local
   file structure. (Relative paths do not work)
4. Run `klighd serve -p 8000`.
5. Open the `index.html` file in a browser and enjoy!
