import esbuild from "esbuild";
import { stylePlugin } from "@toolbarthomas/enlightenment/node/esbuild.style.plugin.mjs";
import { resolvePlugin } from "../node/esbuild.resolve.plugin.mjs";

(async () => {
  esbuild
    .build({
      bundle: true,
      entryPoints: ["./index.ts"],
      format: "esm",
      keepNames: true,
      outdir: "dist",
      plugins: [
        resolvePlugin({ destination: "./framework.js" }),
        stylePlugin(),
      ],
    })
    .then(() => {
      console.log("Done");
    });
})();
