import { existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

/**
 * Resolve the requested Enlightment package from @toolbarthomas/enlightment
 * to the actual compiled source (default: '/Enlightment.js'). A custom
 * destination can be defined from the destination parameter.
 *
 * @param {String} options.destination Resolve the actual import from source to the
 * defined Enlightment library destination. (Should follow the path
 * requirements for the ESM module specification.)
 * @param {String} options.namespace Optional namespace to assign within the
 * Esbuild Plugin.
 */
export const resolvePlugin = (options) => ({
  name: "resolve-plugin",
  setup: (build) => {
    const { destination, namespace } = options || {};
    const d = destination || "/Enlightment.js";
    const n = namespace || "enlightment";
    const { initialOptions } = build || {};
    const { outdir } = initialOptions;

    if (d && !existsSync(d)) {
      const from = resolve(
        fileURLToPath(import.meta.url),
        "../../dist/Enlightment.js"
      );
      const to = join(process.cwd(), outdir || "", d);

      try {
        existsSync(from) && copyFileSync(from, to);
      } catch (exception) {
        exception && Error(exception);
      }
    }

    build.onResolve({ filter: /@toolbarthomas\/enlightment$/ }, (args) => {
      return {
        path: d,
        external: true,
        namespace: n,
      };
    });
  },
});
