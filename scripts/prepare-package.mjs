import { cp, readFile, rm, writeFile } from 'node:fs/promises'

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

const autoDeclaration = await readFile('package/auto.d.ts', 'utf8')
const publishableAutoDeclaration = autoDeclaration.replace(
  "import './style.css';\n",
  '',
)
if (publishableAutoDeclaration === autoDeclaration) {
  throw new Error('Expected auto.d.ts to import the source stylesheet')
}
await writeFile('package/auto.d.ts', publishableAutoDeclaration)

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
const topLevelModules = [
  'auto.js',
  ...browserModules.map((name) => `${name}.js`),
]
await Promise.all([
  writeFile('auto.js', "import './package/auto.js'\n"),
  ...browserModules.map((name) =>
    writeFile(`${name}.js`, `export * from './package/${name}.js'\n`),
  ),
])

const metadata = [
  'custom-elements.json',
  'html-data.json',
  'interface-manifest.json',
  'interface-manifest.schema.json',
]
await Promise.all([
  cp('package', 'dist/package', { recursive: true }),
  ...[...stylesheets, ...topLevelModules, ...metadata].map((filename) =>
    cp(filename, `dist/${filename}`),
  ),
])
