import * as sass from "sass";
import { readFileSync } from "node:fs";
import { dirname } from "node:path";

import { argv } from "./argv.mjs";

/**
 * Esbuild Plugin that compiles the defined scss imports with the Sass library.
 * The rendered styles are included within the actual Enlightment Web Component
 * source script.
 *
 * Global styles should not be defined within the root Enlightment class, but
 * included as static file from the <HEAD>. Keep in mind that the global styling
 * cannot define all styles within a Shadow DOM ans should mainly be used for
 * defining body related properties like typography and inline element layouts.
 */
export const SassPlugin = () => ({
  name: "Sass",
  setup(build) {
    build.onLoad({ filter: /\.scss$/ }, async (args) => {
      const data = readFileSync(args.path);
      const { css } = sass.compileString(data.toString(), {
        loadPaths: [process.cwd(), dirname(args.path), "./node_modules"],
      });

      // Use the dynamic name alias in order to resolve to actual Enlightment
      // package. The development version uses the relative path defined from
      // the first CLI argument. This enables the usage of this Esbuild Plugin
      // outside the actual Enlightment package and will resolve Sass imports:
      // import { SassPlugin } from '@toolbarthomas/Enlightment'
      const { r, resolve, s, split } = argv;
      const name = r || resolve || "@toolbarthomas/Enlightment";

      // Enclose the rendered style as a Component stylesheet if the
      // defined stylesheet exists within the components directory.
      return s || split
        ? { contents: css, loader: "css" }
        : {
            contents: [
              `import { css } from '${name}'`,
              `export default css\`${css}\``,
            ].join("\n"),
            loader: "js",
          };
    });
  },
});
