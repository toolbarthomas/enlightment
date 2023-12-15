import { existsSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, extname, dirname, join, resolve } from 'node:path'

/**
 * Resolve the requested Enlightenment Extensions from the core package and
 * use the relative module path instead without bundling the actual extensions.
 */
export const extensionPlugin = (options) => ({
  name: 'extension-plugin',
  setup: (build) => {
    build.onResolve({ filter: /extensions\// }, (args) => {
      const { destination, minify, namespace } = options || {}
      const n = namespace || 'Enlightenment'
      const m = minify || false
      const filename = `${basename(args.path, extname(args.path))}.extension`
      const file = m ? `./${filename}.min.js` : `./${filename}.js`

      return {
        path: file || args.path,
        external: true,
        namespace: n
      }
    })
  }
})
