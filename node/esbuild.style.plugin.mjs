import * as sass from 'sass'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import autoprefixer from 'autoprefixer'
import combineDuplicateSelectors from 'postcss-combine-duplicated-selectors'
import cssnano from 'cssnano'
import postcss from 'postcss'

import { argv } from './argv.mjs'
import { globSync } from 'glob'
import { fileURLToPath } from 'node:url'

/**
 * Load the required BrowserList configuration from the Node context or this
 * package as fallback.
 */
const [browserlistCustomConfig] = globSync('.browserlistrc*')
const browserlistDefaultConfig = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../.browserlistrc'
)

/**
 * Minifies the defined data value with the installed minifiers.
 *
 * @param {String} data The actual data to minify.
 * @param {String} context Actual context path of the defined data.
 */
const optimize = (data, context) => {
  return new Promise((done) => {
    const plugins = {
      autoprefixer: browserlistCustomConfig
        ? {}
        : {
            overrideBrowserslist: [('> 2%', 'last 2 versions')]
          },

      cssnano: {
        mergeLonghand: false,
        discardComments: true
      }
    }

    const config = [
      autoprefixer(plugins.autoprefixer),
      argv.m || argv.minify ? cssnano(plugins.cssnano) : undefined,
      combineDuplicateSelectors(plugins.combineDuplicateSelectors)
    ].filter((_) => _)

    postcss(config)
      .process(data, {
        from: context || process.cwd()
      })
      .then((result) => {
        return done(result.css || data)
      })
  })
}

/**
 * Esbuild Plugin that compiles the defined scss imports with the Sass library.
 * The rendered styles are included within the actual enlightenment Web Component
 * source script.
 *
 * Global styles should not be defined within the root Enlightenment class, but
 * included as static file from the <HEAD>. Keep in mind that the global styling
 * cannot define all styles within a Shadow DOM ans should mainly be used for
 * defining body related properties like typography and inline element layouts.
 */
export const stylePlugin = (options) => ({
  name: 'Sass',
  setup(build) {
    build.onLoad({ filter: /\.scss|css$/ }, async (args) => {
      const data = readFileSync(args.path)
      let css = ''

      if (String(args.path).endsWith('.scss')) {
        css = sass.compileString(data.toString(), {
          loadPaths: [process.cwd(), dirname(args.path), './node_modules']
        }).css
      } else {
        css = data.toString()
      }

      css = await optimize(css, args.path)

      // Use the dynamic name alias in order to resolve to actual Enlightenment
      // package. The development version uses the relative path defined from
      // the first CLI argument. This enables the usage of this Esbuild Plugin
      // outside the actual enlightenment package and will resolve Sass imports:
      // import { stylePlugin } from '@toolbarthomas/enlightenment'
      const { s, split } = argv || {}
      const { name } = options || {}
      const packageName = name || '@toolbarthomas/enlightenment'

      // Enclose the rendered style as a Component stylesheet if the
      // defined stylesheet exists within the components directory.
      return s || split
        ? { contents: css, loader: 'css' }
        : {
            contents: [`import { css } from '${packageName}'`, `export default css\`${css}\``].join(
              '\n'
            ),
            loader: 'js'
          }
    })
  }
})
