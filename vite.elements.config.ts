import { defineConfig } from 'vite'

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: {
        dialog: 'src/elements/dialog.ts',
        dropdown: 'src/elements/dropdown.ts',
        floating: 'src/elements/floating.ts',
        popover: 'src/elements/popover.ts',
        tabs: 'src/elements/tabs.ts',
        tooltip: 'src/elements/tooltip.ts',
        toast: 'src/elements/toast.ts',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: 'package',
    emptyOutDir: false,
  },
})
