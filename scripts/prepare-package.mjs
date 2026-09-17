import { readFile, rm, writeFile } from 'node:fs/promises'

const stylesheets = [
  'brand.css',
  'core.css',
  'layouts.css',
  'prose.css',
  'sds.css',
]
for (const filename of stylesheets) {
  const source = await readFile(`package/${filename}`, 'utf8')
  await writeFile(
    filename,
    source.replaceAll(
      'url("./assets/sei-wordmark.svg")',
      'url("./package/assets/sei-wordmark.svg")',
    ),
  )
  await rm(`package/${filename}`)
}

await Promise.all([
  rm('package/elements/floating.d.ts'),
  rm('package/elements/internals.d.ts'),
])
const browserModules = [
  'dialog',
  'dropdown',
  'popover',
  'sds',
  'tabs',
  'toast',
  'tooltip',
]
await Promise.all([
  writeFile('auto.js', "import './package/auto.js'\n"),
  ...browserModules.map((name) =>
    writeFile(`${name}.js`, `export * from './package/${name}.js'\n`),
  ),
])
