import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const reference = await readFile('REFERENCE.md', 'utf8')

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

function matches(source, pattern) {
  return new Set(Array.from(source.matchAll(pattern), (match) => match[1]))
}

test('reference lists every public CSS class', async () => {
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

test('reference lists every public data attribute', async () => {
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

test('reference lists every package entry', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
  for (const entry of Object.keys(packageJson.exports)) {
    if (entry === './package.json') continue
    const publicEntry =
      entry === '.' ? '@cmu-sei/sds-lite' : `@cmu-sei/sds-lite/${entry.slice(2)}`
    assert.ok(reference.includes(publicEntry), publicEntry)
  }
})

test('reference lists every exported declaration', async () => {
  const files = [
    'package/elements/dialog.d.ts',
    'package/elements/dropdown.d.ts',
    'package/elements/popover.d.ts',
    'package/elements/tabs.d.ts',
    'package/elements/tooltip.d.ts',
    'package/elements/toast.d.ts',
  ]
  const declarations = (
    await Promise.all(
      ['package/sds.d.ts', ...files].map((file) => readFile(file, 'utf8')),
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
