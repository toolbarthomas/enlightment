import esbuild from 'esbuild'
import path from 'node:path'

import { argv } from './argv.mjs'

import { resolvePlugin } from './esbuild.resolve.plugin.mjs'
import { stylePlugin } from './esbuild.style.plugin.mjs'

/*
 * Creates a new Enlightenment bundle with optional styles that will be included
 * on classes that are extending from the Enlightenment package. Enlightenment
 * packages should import the required Lit Element Class, Decorators & Helpers
 * from this package: '@toolbarthomas/enlightenment'.
 *
 * This means that each package should be included as module:
 * <script type="module" ...> in order to import the actual Enlightenment
 * exports. The package should also be loaded before everything else.
 */
;(async () => {
  const format = argv.f || argv.format || 'esm'
  const suffix = argv.m || argv.minify ? '.min' : ''
  const outExtension = {
    '.js': `${suffix}${format === 'cjs' ? '.cjs' : '.js'}`
  }
  const watch = argv.w || argv.watch || false

  const cwd = 'src/Enlightenment'
  const dist = `./Enlightenment${suffix}${outExtension['.js']}`

  const defaults = {
    bundle: true,
    entryPoints: ['./src/extensions/*.ts'],
    external: ['@toolbarthomas/enlightenment', '*Enlightenment'],
    format,
    keepNames: true,
    metafile: false,
    minify: argv.m || argv.minify || false,
    outdir: 'dist',
    outExtension: Object.entries(outExtension).reduce((previous, current) => {
      previous[current[0]] = `.extension${current[1]}`

      return previous
    }, {}),
    platform: 'browser',
    plugins: [
      resolvePlugin({ cwd: './', extension: outExtension['.js'], name: /src\/Enlightenment$/ }),
      stylePlugin({ destination: `./Enlightenment${outExtension}`, name: cwd })
    ]
  }

  if (watch) {
    console.log(`Watching on Enlightment extension source changes...`)
    ;(await esbuild.context(defaults)).watch()
  } else {
    await esbuild.build(defaults)
    console.log(`Enlightenment ${format} extension bundle created`)
  }
})()
