import esbuild from "esbuild";

import { resolvePlugin } from "./esbuild.resolve.plugin.mjs";
import { sassPlugin } from "./esbuild.sass.plugin.mjs";

/**
 * Esbuild example workflow for transforming an actual Enlightment Element.
 *
 * The initial element will include any Sass stylesheet within the component
 * bundle and is only exposed within the element context, see the
 * Web Component specification for more information:
 * https://github.com/WICG/webcomponents.
 *
 *
 */
(async () => {
  const context = await esbuild.context({
    bundle: true,
    entryPoints: ["./src/hello-world.ts"],
    external: ["@toolbarthomas/enlightment"],
    format: "esm",
    outdir: "dist",
    platform: "browser",
    plugins: [resolvePlugin(), sassPlugin()],
  });

  context
    .serve({
      servedir: "dist",
    })
    .then((result) => {
      console.log(
        `Enlightment test server starter: ${result.host}:${result.port}`
      );
    });
})();
