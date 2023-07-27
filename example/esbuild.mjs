import esbuild from "esbuild";
import { sassPlugin } from "@toolbarthomas/enlightenment/node/esbuild.sass.plugin.mjs";
import { resolvePlugin } from "../node/esbuild.resolve.plugin.mjs";

(async () => {
  esbuild
    .build({
      bundle: true,
      entryPoints: ["./index.ts"],
      format: "esm",
      keepNames: true,
      outdir: "dist",
      plugins: [resolvePlugin({ destination: "./framework.js" }), sassPlugin()],
    })
    .then(() => {
      console.log("Done");
    });
})();
