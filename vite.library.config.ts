import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: 'src/bundle.ts',
      formats: ['es'],
      fileName: 'sds',
      cssFileName: 'sds',
    },
    outDir: 'package',
    emptyOutDir: true,
  },
})
