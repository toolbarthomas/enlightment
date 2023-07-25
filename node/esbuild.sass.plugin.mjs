import * as sass from "sass";
import { readFileSync } from "node:fs";

/**
 * Sass Plugin that should be used to process the styles for the components
 * and DOM. The DOM components are returned as plain stylesheet; these styles
 * should be structured within src/styles.
 *
 * Other stylesheets are resolved as JSON so it can be included within the
 * custom element as UnsafeCSS.
 */
export const SassPlugin = {
  name: "Sass",
  setup(build) {
    // Load ".txt" files and return an array of words
    build.onLoad({ filter: /\.scss$/ }, async (args) => {
      const data = readFileSync(args.path);
      const { css } = sass.compileString(data.toString(), {
        loadPaths: ["./src", "./node_modules"],
      });

      // Use the dynamic name alias in order to resolve to actual Enlightment
      // package. The development version uses the relative path defined from
      // the first CLI argument. This enables the usage of this Esbuild Plugin
      // outside the actual Enlightment package and will resolve Sass imports:
      // import { SassPlugin } from '@toolbarthomas/Enlightment'
      const [name] = process.argv.slice(2);

      // Enclose the rendered style as a Component stylesheet if the
      // defined stylesheet exists within the components directory.
      return {
        contents: [
          `import { css } from '${name || "@toolbarthomas/Enlightment"}'`,
          `export default css\`${css}\``,
        ].join("\n"),
        loader: "js",
      };
    });
  },
};
