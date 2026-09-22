import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: 'src/auto.ts',
      formats: ['es'],
      fileName: () => 'auto.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
})
