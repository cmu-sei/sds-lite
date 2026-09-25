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
    ['badge', 'datapoint', 'prose', 'tabs', 'tag'].map((component) =>
      readFile(`src/css/components/${component}.css`, 'utf8'),
    ),
  )
).join('\n')

const tones = ['neutral', 'accent', 'info', 'success', 'warning', 'danger']

function color(name) {
  const match = tokens.match(
    new RegExp(`--${name}:\\s*(#[0-9a-f]{3}(?:[0-9a-f]{3})?)`, 'i'),
  )
  assert.ok(match, `Missing color token --${name}`)
  return match[1].length === 4
    ? `#${[...match[1].slice(1)].map((digit) => digit.repeat(2)).join('')}`
    : match[1]
}

function lightDark(name) {
  const definition = tokens.match(
    new RegExp(`--${name}:\\s*var\\(--([a-z0-9-]+)\\)`),
  )
  if (definition) return lightDark(definition[1])

  const match = tokens.match(
    new RegExp(
      `--${name}:\\s*light-dark\\(\\s*var\\(--([a-z0-9-]+)\\),\\s*var\\(--([a-z0-9-]+)\\)`,
    ),
  )
  assert.ok(match, `Missing light-dark token --${name}`)
  return [color(match[1]), color(match[2])]
}

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

test('info is blue and accent uses the upstream purple palette', () => {
  assert.match(
    tokens,
    /--sds-purple-25:\s*#f8ecf4/,
  )
  assert.match(
    tokens,
    /--sds-purple-950:\s*#200015/,
  )
  assert.match(
    tokens,
    /--sds-color-accent-surface:\s*light-dark\(\s*var\(--sds-purple-25\),\s*var\(--sds-purple-900\)/,
  )
  assert.match(
    tokens,
    /--sds-color-accent-strong:\s*light-dark\(\s*var\(--sds-purple-600\),\s*var\(--sds-purple-400\)/,
  )
  assert.match(
    tokens,
    /--sds-color-info-surface:\s*light-dark\(\s*var\(--sds-blue-25\),\s*var\(--sds-blue-900\)/,
  )
  assert.match(
    tokens,
    /--sds-color-info-strong:\s*light-dark\(\s*var\(--sds-blue-600\),\s*var\(--sds-blue-400\)/,
  )
  assert.match(
    componentStyles,
    /data-sds-tone="accent"[\s\S]*?var\(--sds-purple-700\)/,
  )
  assert.match(
    componentStyles,
    /data-sds-tone="info"[\s\S]*?var\(--sds-blue-700\)/,
  )
  assert.match(
    componentStyles,
    /\.sds-tag-action[\s\S]*?--sds-tag-action-color:\s*var\(--sds-color-info-strong\)/,
  )
})

test('focus indicators remain visible in normal and forced-color modes', () => {
  assert.match(
    foundations,
    /box-shadow: 0 0 0 2px var\(--sds-color-focus-ring\)/,
  )
  assert.match(foundations, /@media \(forced-colors: active\)/)
  assert.match(foundations, /outline: 2px solid Highlight/)
  assert.match(foundations, /box-shadow: none/)
})

test('focus indicators use the SEI reference colors', () => {
  assert.deepEqual(lightDark('sds-color-focus-ring'), ['#2eb1e6', '#034f8d'])
})

test('form borders follow the semantic control-border token', () => {
  assert.deepEqual(
    lightDark('sds-color-form-border'),
    lightDark('sds-color-border-control'),
  )
})
