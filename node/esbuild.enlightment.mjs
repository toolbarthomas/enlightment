import esbuild from "esbuild";
import path from "node:path";

import { SassPlugin } from "./esbuild.sass.plugin.mjs";

/*
 * Creates a new production bundle with
 */
(async () => {
  const defaults = {
    bundle: true,
    entryPoints: ["./src/Enlightment.ts"],
    format: "esm",
    keepNames: true,
    metafile: false,
    minify: false,
    outdir: "dist",
    platform: "node",
    plugins: [SassPlugin],
  };

  const node = await esbuild.build(defaults);

  console.info(`Enlightment bundle created`);
})();
