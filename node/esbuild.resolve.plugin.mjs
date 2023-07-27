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

    build.onResolve({ filter: /@toolbarthomas\/enlightment$/ }, (args) => {
      return {
        path: destination || "/Enlightment.js",
        external: true,
        namespace: namespace || "enlightment",
      };
    });
  },
});
