import esbuild from 'esbuild'
import path from 'node:path'

import { argv } from './argv.mjs'

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

  const defaults = {
    bundle: true,
    entryPoints: ['./tests/*.ts'],
    external: ['assert', 'mocha'],
    format,
    keepNames: true,
    metafile: false,
    minify: argv.m || argv.minify || false,
    outdir: 'dist/tests',
    platform: 'browser'
  }

  await esbuild.build(defaults)

  console.log(`Enlightenment Unit tests created`)
})()
