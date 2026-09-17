import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  plugins: [
    {
      name: 'name-complete-stylesheet',
      generateBundle(_options, bundle) {
        const stylesheet = bundle['auto.css']
        if (!stylesheet || stylesheet.type !== 'asset') return

        this.emitFile({
          type: 'asset',
          fileName: 'sds.css',
          source: stylesheet.source,
        })
        delete bundle['auto.css']
      },
    },
  ],
  build: {
    cssCodeSplit: true,
    lib: {
      entry: {
        auto: 'src/auto.ts',
        brand: 'src/brand.css',
        core: 'src/core.css',
        dialog: 'src/elements/dialog.ts',
        dropdown: 'src/elements/dropdown.ts',
        floating: 'src/elements/floating.ts',
        layouts: 'src/layouts.css',
        popover: 'src/elements/popover.ts',
        prose: 'src/prose.css',
        sds: 'src/sds.ts',
        tabs: 'src/elements/tabs.ts',
        toast: 'src/elements/toast.ts',
        tooltip: 'src/elements/tooltip.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'sds',
    },
    outDir: 'package',
    emptyOutDir: true,
  },
})
