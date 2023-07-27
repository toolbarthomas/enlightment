const esbuild = require("esbuild");

(async () => {
  const { sassPlugin } = await import(
    "@toolbarthomas/enlightment/node/esbuild.sass.plugin.mjs"
  );

  esbuild
    .build({
      bundle: true,
      entryPoints: ["./index.ts"],
      keepNames: true,
      outdir: "dist",
      outExtension: { ".js": ".cjs.js" },
      plugins: [sassPlugin()],
    })
    .then(() => {
      console.log("Done");
    });
})();
