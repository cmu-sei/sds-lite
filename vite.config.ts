import { cp } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'

const documentationDirectory = fileURLToPath(
  new URL('./docs', import.meta.url),
)

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [
    {
      name: 'copy-documentation',
      async writeBundle(options) {
        await cp(
          documentationDirectory,
          resolve(options.dir ?? 'dist', 'docs'),
          { recursive: true },
        )
      },
    },
  ],
})
