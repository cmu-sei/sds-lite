import { cp, readFile, rm, writeFile } from 'node:fs/promises'

const distributionDirectory = 'dist'
const packageDirectory = `${distributionDirectory}/package`

const stylesheets = new Map([
  ['brand.css', 'brand.css'],
  ['sds.css', 'styles.css'],
])
for (const [filename, sourceFilename] of stylesheets) {
  const source = await readFile(
    `${packageDirectory}/${sourceFilename}`,
    'utf8',
  )
  await writeFile(
    `${distributionDirectory}/${filename}`,
    source.replaceAll(
      'url("./assets/sei-wordmark.svg")',
      'url("./package/assets/sei-wordmark.svg")',
    ),
  )
  await rm(`${packageDirectory}/${sourceFilename}`)
}

const autoDeclaration = await readFile(`${packageDirectory}/auto.d.ts`, 'utf8')
if (autoDeclaration !== 'export {};\n') {
  throw new Error('Expected auto.d.ts to contain no public declarations')
}
await writeFile(
  `${packageDirectory}/auto.d.ts`,
  "import './sds.js'\n",
)

await Promise.all([
  rm(`${packageDirectory}/elements/floating.d.ts`),
  rm(`${packageDirectory}/elements/internals.d.ts`),
])
await Promise.all([
  writeFile(
    `${distributionDirectory}/sds.js`,
    "export * from './package/sds.js'\n",
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
