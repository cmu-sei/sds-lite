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
        combobox: 'src/elements/combobox.ts',
        dialog: 'src/elements/dialog.ts',
        dropdown: 'src/elements/dropdown.ts',
        floating: 'src/elements/floating.ts',
        popover: 'src/elements/popover.ts',
        sds: 'src/sds.ts',
        sidebar: 'src/elements/sidebar.ts',
        styles: 'src/style.css',
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
