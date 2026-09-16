import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const timelineCss = await readFile(
  'src/css/components/timeline.css',
  'utf8',
)

test('timeline connectors leave tokenized whitespace around markers', () => {
  assert.match(
    timelineCss,
    /--sds-timeline-marker-gap:\s*var\(--sds-space-xs\)/,
  )
  assert.match(
    timelineCss,
    /grid-template-columns:\s*1\.5rem minmax\(0,\s*1fr\)/,
  )
  assert.match(
    timelineCss,
    /grid-row:\s*2\s*\/\s*4/,
  )
  assert.match(
    timelineCss,
    /margin-block:\s*0\s*calc\(-1\s*\*\s*var\(--sds-space-lg\)\)/,
  )
  assert.match(
    timelineCss,
    /:has\(>\s*\.sds-timeline-marker\)[^}]*::after\s*\{[^}]*margin-block-start:\s*var\(--sds-timeline-marker-gap\)/s,
  )
  assert.match(
    timelineCss,
    /:has\(\s*\+\s*\.sds-timeline-item\s*>\s*\.sds-timeline-marker\s*\)/s,
  )
  assert.match(
    timelineCss,
    /margin-block-end:\s*calc\(\s*var\(--sds-timeline-marker-gap\)\s*-\s*var\(--sds-space-lg\)\s*\)/s,
  )
})

test('horizontal connectors lay out after variable-width custom markers', () => {
  assert.match(
    timelineCss,
    /grid-template-columns:\s*max-content minmax\(0,\s*1fr\)/,
  )
  assert.match(
    timelineCss,
    /column-gap:\s*var\(--sds-timeline-marker-gap\)/,
  )
  assert.match(timelineCss, /grid-auto-rows:\s*max-content/)
  assert.match(timelineCss, /align-content:\s*start/)
  assert.match(timelineCss, /justify-self:\s*stretch/)
  assert.match(
    timelineCss,
    /margin-inline-end:\s*var\(--sds-timeline-marker-gap\)/,
  )
})
