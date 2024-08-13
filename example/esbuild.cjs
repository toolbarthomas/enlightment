const esbuild = require('esbuild')

;(async () => {
  const { stylePlugin } = await import('@toolbarthomas/enlightenment/stylePlugin')

  esbuild
    .build({
      bundle: true,
      entryPoints: ['./index.ts'],
      keepNames: true,
      outdir: 'dist',
      outExtension: { '.js': '.cjs.js' },
      plugins: [stylePlugin()]
    })
    .then(() => {
      console.log('Done')
    })
})()
