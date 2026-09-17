import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const tokens = await readFile('src/css/tokens.css', 'utf8')
const toast = await readFile('src/elements/toast.ts', 'utf8')
const reference = await readFile('REFERENCE.md', 'utf8')
const demo = await readFile('index.html', 'utf8')
const componentStyles = (
  await Promise.all(
    ['badge', 'datapoint', 'prose', 'tabs'].map((component) =>
      readFile(`src/css/components/${component}.css`, 'utf8'),
    ),
  )
).join('\n')

const tones = ['neutral', 'primary', 'success', 'info', 'warning', 'danger']

test('the public tone vocabulary uses primary instead of accent', () => {
  for (const tone of tones) {
    assert.match(tokens, new RegExp(`data-tone="${tone}"`))
    assert.match(toast, new RegExp(`'${tone}'`))
  }

  assert.doesNotMatch(
    `${tokens}\n${componentStyles}\n${demo}`,
    /data-tone="accent"|--sds-color-accent-/,
  )
  assert.doesNotMatch(toast, /\| 'accent'/)
  assert.match(
    `${reference}\n${demo}`,
    /neutral \| primary \| success \| info \| warning \| danger/,
  )
  assert.doesNotMatch(reference, /neutral.*accent/)
})

test('primary is blue and info uses the upstream teal palette', () => {
  assert.match(
    tokens,
    /--sds-color-primary-surface:\s*light-dark\(\s*var\(--sds-blue-25\),\s*var\(--sds-blue-900\)/,
  )
  assert.match(
    tokens,
    /--sds-color-primary-strong:\s*light-dark\(\s*var\(--sds-blue-600\),\s*var\(--sds-blue-400\)/,
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
    /data-tone="primary"[\s\S]*?var\(--sds-blue-700\)/,
  )
  assert.match(
    componentStyles,
    /data-tone="info"[\s\S]*?var\(--sds-teal-700\)/,
  )
})
