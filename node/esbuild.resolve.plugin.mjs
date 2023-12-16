import { existsSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, normalize, relative, resolve } from 'node:path'

/**
 * Resolve the requested Enlightenment package from @toolbarthomas/enlightenment
 * to the actual compiled source (default: '/Enlightenment.js'). A custom
 * destination can be defined from the destination parameter.
 *
 * @param {String} options.destination Resolve the actual import from source to the
 * defined enlightenment library destination. (Should follow the path
 * requirements for the ESM module specification.)
 * @param {String} options.namespace Optional namespace to assign within the
 * Esbuild plugin.
 */
export const resolvePlugin = (options) => ({
  name: 'resolve-plugin',
  setup: (build) => {
    const { destination, minify, name, namespace, cwd } = options || {}
    const d = destination || '/Enlightenment.js'
    const packageName = name || /@toolbarthomas\/enlightenment$/
    const n = namespace || 'Enlightenment'
    const { initialOptions } = build || {}
    const { outdir } = initialOptions
    const m = minify || false

    if (d && !existsSync(d)) {
      const from = resolve(
        fileURLToPath(import.meta.url),
        `../../dist/Enlightenment${minify ? '.min' : ''}.js`
      )

      const to = join(process.cwd(), outdir || '', d.split('../').join('/'))

      try {
        existsSync(from) && copyFileSync(from, to)
      } catch (exception) {
        exception && Error(exception)
      }
    }

    build.onResolve({ filter: packageName }, (args) => {
      return {
        path: cwd ? `${cwd}${join(cwd, d)}` : d,
        external: true,
        namespace: n
      }
    })
  }
})
