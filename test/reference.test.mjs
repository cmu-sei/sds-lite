import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

async function sourceFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return sourceFiles(entryPath, extension)
      return entry.name.endsWith(extension) ? [entryPath] : []
    }),
  )
  return files.flat()
}

const documentationFiles = [
  'README.md',
  ...(await sourceFiles('docs', '.md')),
]
const reference = (
  await Promise.all(documentationFiles.map((file) => readFile(file, 'utf8')))
).join('\n')

test('CDN documentation uses the versioned GitHub repository location', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
  const cdnGuide = await readFile('docs/installation/cdn.md', 'utf8')
  const sources = [
    reference,
    await readFile('index.html', 'utf8'),
    await readFile('interface-manifest.schema.json', 'utf8'),
  ].join('\n')
  const expectedBase =
    `https://cdn.jsdelivr.net/gh/cmu-sei/sds-lite@v${packageJson.version}/dist/`
  const urls = Array.from(
    sources.matchAll(
      /https:\/\/cdn\.jsdelivr\.net\/gh\/cmu-sei\/sds-lite@v\d+\.\d+\.\d+[^'"<>\s)]*/g,
    ),
    (match) => match[0],
  )

  assert.ok(urls.length > 0)
  assert.equal(urls.every((url) => url.startsWith(expectedBase)), true)
  assert.doesNotMatch(sources, /cdn\.jsdelivr\.net\/npm\/@cmu-sei\/sds-lite/)
  assert.doesNotMatch(sources, /cmu-sei\.github\.io\/sds-lite/)
  assert.match(
    cdnGuide,
    /cdn\.jsdelivr\.net\/gh\/cmu-sei\/sds-lite@vVERSION\/dist\/FILE/,
  )
  assert.match(cdnGuide, /Download the `dist\/` directory/)
  assert.doesNotMatch(cdnGuide, /published package files/)
})

test('local documentation links resolve', async () => {
  for (const file of documentationFiles) {
    const source = await readFile(file, 'utf8')
    const links = Array.from(
      source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g),
      (match) => match[1],
    )

    for (const link of links) {
      if (
        link.startsWith('#') ||
        link.startsWith('http://') ||
        link.startsWith('https://')
      ) {
        continue
      }

      const target = link.split('#', 1)[0]
      await assert.doesNotReject(
        access(path.resolve(path.dirname(file), target)),
        `${file} links to missing ${link}`,
      )
    }
  }
})

function matches(source, pattern) {
  return new Set(Array.from(source.matchAll(pattern), (match) => match[1]))
}

test('documentation lists every public CSS class', async () => {
  const files = await sourceFiles('src/css', '.css')
  const css = (
    await Promise.all(files.map((file) => readFile(file, 'utf8')))
  ).join('\n')
  const classes = matches(css, /\.((?:sds-[a-z0-9-]+)|(?:sds-not-prose))\b/g)

  for (const className of classes) {
    assert.match(reference, new RegExp(`\\.${className}\\b`), className)
  }
  assert.match(reference, /`\.sds-prose-lead`/)
})

test('documentation lists every public data attribute', async () => {
  const files = await sourceFiles('src', '.css')
  const typescriptFiles = await sourceFiles('src/elements', '.ts')
  const source = (
    await Promise.all(
      [...files, ...typescriptFiles].map((file) => readFile(file, 'utf8')),
    )
  ).join('\n')
  const attributes = matches(source, /\b(data-[a-z][a-z0-9-]*)\b/g)
  for (const property of matches(source, /\.dataset\.([A-Za-z][A-Za-z0-9]*)/g)) {
    attributes.add(
      `data-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
    )
  }

  for (const attribute of attributes) {
    assert.match(reference, new RegExp(`\\b${attribute}\\b`), attribute)
  }
})

test('documentation lists every package entry', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
  for (const entry of Object.keys(packageJson.exports)) {
    if (entry === './package.json') continue
    const publicEntry =
      entry === '.' ? '@cmu-sei/sds-lite' : `@cmu-sei/sds-lite/${entry.slice(2)}`
    assert.ok(reference.includes(publicEntry), publicEntry)
  }
})

test('documentation lists every exported declaration', async () => {
  const files = [
    'dist/package/elements/dialog.d.ts',
    'dist/package/elements/dropdown.d.ts',
    'dist/package/elements/popover.d.ts',
    'dist/package/elements/tabs.d.ts',
    'dist/package/elements/tooltip.d.ts',
    'dist/package/elements/toast.d.ts',
  ]
  const declarations = (
    await Promise.all(
      ['dist/package/sds.d.ts', ...files].map((file) =>
        readFile(file, 'utf8'),
      ),
    )
  ).join('\n')
  const names = matches(
    declarations,
    /export (?:declare )?(?:class|function|interface|type) ([A-Za-z0-9_]+)/g,
  )

  for (const name of names) {
    assert.match(reference, new RegExp(`\\b${name}\\b`), name)
  }
})
