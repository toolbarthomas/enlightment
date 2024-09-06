import esbuild from 'esbuild'
import path from 'node:path'

import { stylePlugin } from './esbuild.style.plugin.mjs'
import { extensionPlugin } from './esbuild.extension.plugin.mjs'

import { parse } from '@toolbarthomas/argumentje'
const argv = parse()

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

  const defaults = {
    bundle: true,
    entryPoints: ['./src/Enlightenment.ts'],
    format,
    keepNames: true,
    metafile: false,
    minify: argv.m || argv.minify || false,
    outdir: 'dist',
    outExtension,
    platform: 'node',
    plugins: [
      extensionPlugin({ extension: outExtension['.js'], minify: argv.m || argv.minify || false }),
      stylePlugin()
    ]
  }

  if (watch) {
    console.log(`Watching on Enlightment source changes...`)
    ;(await esbuild.context(defaults)).watch()
  } else {
    await esbuild.build(defaults)
    console.log(`Enlightenment ${format} bundle created`)
  }
})()
