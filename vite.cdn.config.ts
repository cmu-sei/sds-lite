import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  publicDir: false,
  build: {
    lib: {
      entry: mode === 'documentation' ? 'src/documentation.ts' : 'src/auto.ts',
      formats: ['es'],
      fileName: () => mode === 'documentation' ? 'documentation.js' : 'auto.js',
      cssFileName: 'documentation',
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
}))
