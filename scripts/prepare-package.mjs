import { cp, readFile, rm, writeFile } from 'node:fs/promises'

const distributionDirectory = 'dist'
const packageDirectory = `${distributionDirectory}/package`

const stylesheets = [
  'brand.css',
  'core.css',
  'layouts.css',
  'prose.css',
  'sds.css',
]
for (const filename of stylesheets) {
  const source = await readFile(`${packageDirectory}/${filename}`, 'utf8')
  await writeFile(
    `${distributionDirectory}/${filename}`,
    source.replaceAll(
      'url("./assets/sei-wordmark.svg")',
      'url("./package/assets/sei-wordmark.svg")',
    ),
  )
  await rm(`${packageDirectory}/${filename}`)
}

const autoDeclaration = await readFile(`${packageDirectory}/auto.d.ts`, 'utf8')
const publishableAutoDeclaration = autoDeclaration.replace(
  "import './style.css';\n",
  '',
)
if (publishableAutoDeclaration === autoDeclaration) {
  throw new Error('Expected auto.d.ts to import the source stylesheet')
}
await writeFile(
  `${packageDirectory}/auto.d.ts`,
  publishableAutoDeclaration,
)

await Promise.all([
  rm(`${packageDirectory}/elements/floating.d.ts`),
  rm(`${packageDirectory}/elements/internals.d.ts`),
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
  writeFile(
    `${distributionDirectory}/auto.js`,
    "import './package/auto.js'\n",
  ),
  ...browserModules.map((name) =>
    writeFile(
      `${distributionDirectory}/${name}.js`,
      `export * from './package/${name}.js'\n`,
    ),
  ),
])

const metadata = [
  'custom-elements.json',
  'html-data.json',
  'interface-manifest.json',
  'interface-manifest.schema.json',
]
await Promise.all(
  metadata.map((filename) =>
    cp(filename, `${distributionDirectory}/${filename}`),
  ),
)
