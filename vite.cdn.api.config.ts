import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: 'src/sds.ts',
      formats: ['es'],
      fileName: () => 'sds.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
})
