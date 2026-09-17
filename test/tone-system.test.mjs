import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const tokens = await readFile('src/css/tokens.css', 'utf8')
const foundations = await readFile('src/css/foundations.css', 'utf8')
const interfaceTypes = await readFile('src/generated/interface.ts', 'utf8')
const demo = await readFile('index.html', 'utf8')
const componentStyles = (
  await Promise.all(
    ['badge', 'datapoint', 'prose', 'tabs'].map((component) =>
      readFile(`src/css/components/${component}.css`, 'utf8'),
    ),
  )
).join('\n')

const tones = ['neutral', 'accent', 'info', 'success', 'warning', 'danger']

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return markdownFiles(entryPath)
      return entry.name.endsWith('.md') ? [entryPath] : []
    }),
  )
  return files.flat()
}

const documentation = (
  await Promise.all(
    (await markdownFiles('docs')).map((file) => readFile(file, 'utf8')),
  )
).join('\n')

test('the public tone vocabulary distinguishes accent from primary hierarchy', () => {
  for (const tone of tones) {
    assert.match(tokens, new RegExp(`data-sds-tone="${tone}"`))
    assert.match(tokens, new RegExp(`sds-tabs\\[tone="${tone}"\\]`))
    assert.match(tokens, new RegExp(`sds-toast\\[tone="${tone}"\\]`))
    assert.match(interfaceTypes, new RegExp(`["']${tone}["']`))
  }

  assert.doesNotMatch(
    `${tokens}\n${componentStyles}\n${demo}`,
    /data-sds-tone="primary"|--sds-color-primary-/,
  )
  assert.doesNotMatch(interfaceTypes, /\| ["']primary["']/)
  assert.match(
    `${documentation}\n${demo}`,
    /neutral \| accent \| info \| success \| warning \| danger/,
  )
  assert.doesNotMatch(documentation, /neutral.*primary/)
  assert.match(
    documentation,
    /`primary` is not a semantic tone; it is\s+reserved for action hierarchy/,
  )
})

test('accent is blue and info uses the upstream teal palette', () => {
  assert.match(
    tokens,
    /--sds-color-accent-surface:\s*light-dark\(\s*var\(--sds-blue-25\),\s*var\(--sds-blue-900\)/,
  )
  assert.match(
    tokens,
    /--sds-color-accent-strong:\s*light-dark\(\s*var\(--sds-blue-600\),\s*var\(--sds-blue-400\)/,
  )
  assert.match(tokens, /--sds-teal-25:\s*#e0f7f7/)
  assert.match(tokens, /--sds-teal-900:\s*#001b1b/)
  assert.match(
    tokens,
    /--sds-color-info-surface:\s*light-dark\(\s*var\(--sds-teal-25\),\s*var\(--sds-teal-900\)/,
  )
  assert.match(
    tokens,
    /--sds-color-info-strong:\s*light-dark\(\s*var\(--sds-teal-600\),\s*var\(--sds-teal-400\)/,
  )
  assert.match(
    componentStyles,
    /data-sds-tone="accent"[\s\S]*?var\(--sds-blue-700\)/,
  )
  assert.match(
    componentStyles,
    /data-sds-tone="info"[\s\S]*?var\(--sds-teal-700\)/,
  )
})

test('focus indicators remain visible in normal and forced-color modes', () => {
  assert.match(
    tokens,
    /--sds-color-focus-ring:\s*light-dark\(\s*var\(--sds-blue-600\),\s*var\(--sds-blue-300\)/,
  )
  assert.match(foundations, /outline: 2px solid var\(--sds-color-focus-ring\)/)
  assert.match(foundations, /@media \(forced-colors: active\)/)
  assert.match(foundations, /outline-color: Highlight/)
  assert.doesNotMatch(foundations, /outline:\s*none/)
})
