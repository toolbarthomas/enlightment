import esbuild from "esbuild";
import path from "node:path";

import { SassPlugin } from "./esbuild.sass.plugin.mjs";

import { argv } from "./argv.mjs";

/*
 * Creates a new Enlightment bundle with optional styles that will be included
 * on classes that are extending from the Enlightment package. Enlightment
 * packages should import the required Lit Element Class, Decorators & Helpers
 * from this package: '@toolbarthomas/enlightment'.
 *
 * This means that each package
 * should be included as module: <script type="module" ...> in order to import
 * the actual Enlightment exports. The Enlightment package should also be
 * loaded before everything else.
 */
(async () => {
  const defaults = {
    bundle: true,
    entryPoints: ["./src/Enlightment.ts"],
    format: "esm",
    keepNames: true,
    metafile: false,
    minify: argv.m || argv.minify || false,
    outdir: "dist",
    platform: "node",
    plugins: [SassPlugin()],
  };

  const node = await esbuild.build(defaults);

  console.info(`Enlightment bundle created`);
})();
