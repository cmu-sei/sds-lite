import { readFileSync } from 'node:fs'

import { defineConfig } from 'vite'

const wordmark = readFileSync(
  new URL('./src/assets/sei-wordmark.svg', import.meta.url),
  'utf8',
)

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
    {
      name: 'externalize-wordmark',
      generateBundle(_options, bundle) {
        const wordmarkDataUrl =
          /url\("data:image\/svg\+xml,[^"]*data-id='sds-sei-wordmark'[^"]*"\)/g
        let referenced = false

        for (const output of Object.values(bundle)) {
          if (
            output.type !== 'asset' ||
            !output.fileName.endsWith('.css') ||
            typeof output.source !== 'string'
          ) {
            continue
          }

          const source = output.source.replace(wordmarkDataUrl, () => {
            referenced = true
            return 'url("./assets/sei-wordmark.svg")'
          })
          output.source = source
        }

        if (referenced) {
          this.emitFile({
            type: 'asset',
            fileName: 'assets/sei-wordmark.svg',
            source: wordmark,
          })
        }
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
    outDir: 'dist/package',
    emptyOutDir: true,
  },
})
