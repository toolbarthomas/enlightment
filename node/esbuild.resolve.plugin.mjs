import { existsSync, copyFileSync, writeFile, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { mkdirpSync } from 'mkdirp'
import { basename, dirname, join, normalize, relative, resolve } from 'node:path'
import glob from 'glob'

/**
 * Resolve the requested Enlightenment package from @toolbarthomas/enlightenment
 * to the actual compiled source (default: '/Enlightenment.js'). A custom
 * destination can be defined from the destination parameter.
 *
 * @param {String} options.cwd Use the optional working directory as final Path.
 * @param {String} options.destination Resolve the actual import from source to the
 * defined enlightenment library destination. (Should follow the path
 * requirements for the ESM module specification.)
 * @param {String} options.extension Use the optional extension instead.
 * @param {boolean} options.includeExtensions Resolve the optional extensions
 * as well.
 * @param {String} options.name Imports from the defined name instead of the
 * default package name.
 * @param {String} options.namespace Optional namespace to assign within the
 * Esbuild plugin.
 */
export const resolvePlugin = (options) => ({
  name: 'resolve-plugin',
  setup: (build) => {
    const { cwd, destination, extension, includeExtensions, name, namespace } = options || {}
    const suffix = extension || '.js'
    const d = destination || `/Enlightenment${suffix}`
    const packageName = name || /@toolbarthomas\/enlightenment$/
    const n = namespace || 'Enlightenment'
    const { initialOptions } = build || {}
    const { outdir } = initialOptions

    if (d && !existsSync(d)) {
      const from = resolve(fileURLToPath(import.meta.url), `../../dist/Enlightenment${suffix}`)

      const to = join(process.cwd(), outdir || '', d.split('../').join('/'))

      const baseDir = dirname(from)
      const finalDir = dirname(to)
      const extensions = includeExtensions ? glob.sync(join(baseDir, `*.extension${suffix}`)) : []

      try {
        if (existsSync(from)) {
          mkdirpSync(dirname(from))
          copyFileSync(from, to)
        }

        // Resolve the optional Framework Extensions as well.
        extensions.forEach((e) => {
          const clone = join(finalDir, basename(e))
          const data = readFileSync(e)
            .toString()
            .replace(new RegExp(basename(from), 'g'), basename(to))

          data && writeFileSync(clone, data)
        })
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
