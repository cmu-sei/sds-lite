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

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    )
  return (
    channels[0] * 0.2126 +
    channels[1] * 0.7152 +
    channels[2] * 0.0722
  )
}

function contrast(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (a, b) => b - a,
  )
  return (lighter + 0.05) / (darker + 0.05)
}

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
    foundations,
    /box-shadow: 0 0 0 2px var\(--sds-color-focus-ring\)/,
  )
  assert.match(foundations, /@media \(forced-colors: active\)/)
  assert.match(foundations, /outline: 2px solid Highlight/)
  assert.match(foundations, /box-shadow: none/)
})

test('focus indicators and control boundaries meet non-text contrast', () => {
  const focus = lightDark('sds-color-focus-ring')
  const border = lightDark('sds-color-form-border')
  const surfaces = [
    lightDark('sds-color-surface-default'),
    lightDark('sds-color-surface-subtle'),
  ]

  for (const [scheme, index] of [['light', 0], ['dark', 1]]) {
    for (const surface of surfaces) {
      assert.ok(
        contrast(focus[index], surface[index]) >= 3,
        `${scheme} focus ring must have at least 3:1 contrast`,
      )
      assert.ok(
        contrast(border[index], surface[index]) >= 3,
        `${scheme} form border must have at least 3:1 contrast`,
      )
    }
  }
})
