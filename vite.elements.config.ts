import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: {
        dialog: 'src/elements/dialog.ts',
        dropdown: 'src/elements/dropdown.ts',
        tabs: 'src/elements/tabs.ts',
        toast: 'src/elements/toast.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: 'package',
    emptyOutDir: false,
  },
})
