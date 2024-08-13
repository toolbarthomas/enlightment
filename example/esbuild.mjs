import esbuild from 'esbuild'
import { stylePlugin } from '@toolbarthomas/enlightenment/stylePlugin'
import { resolvePlugin } from '@toolbarthomas/enlightenment/resolvePlugin'
;(async () => {
  esbuild
    .build({
      bundle: true,
      entryPoints: ['./index.ts'],
      format: 'esm',
      keepNames: true,
      outdir: 'dist',
      plugins: [resolvePlugin({ destination: './framework.js' }), stylePlugin()]
    })
    .then(() => {
      console.log('Done')
    })
})()
