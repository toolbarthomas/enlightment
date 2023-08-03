import esbuild from "esbuild";

import { resolvePlugin } from "./esbuild.resolve.plugin.mjs";
import { stylePlugin } from "./esbuild.style.plugin.mjs";

/**
 * Esbuild example workflow for transforming an actual Enlightenment Element.
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
    external: ["@toolbarthomas/enlightenment"],
    format: "esm",
    outdir: "dist",
    platform: "browser",
    plugins: [resolvePlugin(), stylePlugin()],
  });

  context
    .serve({
      servedir: "dist",
    })
    .then((result) => {
      console.log(
        `Enlightenment test server started: ${result.host}:${result.port}`
      );
    });
})();
