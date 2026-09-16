import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [tooltip, popover, dropdown, tagCss, demo] = await Promise.all([
  readFile('src/elements/tooltip.ts', 'utf8'),
  readFile('src/elements/popover.ts', 'utf8'),
  readFile('src/elements/dropdown.ts', 'utf8'),
  readFile('src/css/components/tag.css', 'utf8'),
  readFile('index.html', 'utf8'),
])

test('all anchored surfaces use the shared positioner', () => {
  for (const source of [tooltip, popover, dropdown]) {
    assert.match(source, /new FloatingPositioner\(/)
  }
})

test('tooltips support pointer, focus, Escape, and accessible descriptions', () => {
  assert.match(tooltip, /pointerenter/)
  assert.match(tooltip, /focusin/)
  assert.match(tooltip, /event\.key !== 'Escape'/)
  assert.match(tooltip, /aria-describedby/)
  assert.match(tooltip, /setAttribute\('role', 'tooltip'\)/)
})

test('popovers use the upstream delayed hover interaction', () => {
  assert.match(popover, /hoverOpenDelay = 500/)
  assert.match(popover, /hoverCloseDelay = 250/)
  assert.match(popover, /pointerenter/)
  assert.match(popover, /pointerleave/)
  assert.match(popover, /handleDocumentPointerDown/)
  assert.match(popover, /setAttribute\('popover', 'manual'\)/)
  assert.match(popover, /removeAttribute\('popovertarget'\)/)
  assert.match(popover, /aria-expanded/)
  assert.match(popover, /aria-haspopup', 'dialog'/)
})

test('tooltips and popovers expose positioned arrows', async () => {
  const floatingCss = await readFile(
    'src/css/components/floating.css',
    'utf8',
  )
  assert.match(floatingCss, /--sds-floating-arrow-size: 0\.5rem/)
  assert.match(floatingCss, /--sds-floating-arrow-size: 0\.75rem/)
  assert.match(floatingCss, /\[data-side="top"\]::before/)
  assert.match(floatingCss, /\[data-side="right"\]::before/)
  assert.match(floatingCss, /\[data-side="bottom"\]::before/)
  assert.match(floatingCss, /\[data-side="left"\]::before/)
  assert.match(
    await readFile('src/elements/floating.ts', 'utf8'),
    /setAttribute\('data-side', position\.side\)/,
  )
})

test('Tag uses native links and buttons rather than custom behavior', () => {
  assert.match(tagCss, /a\.sds-tag, button\.sds-tag/)
  assert.match(tagCss, /\.sds-tag-counter/)
  assert.match(tagCss, /\.sds-tag-action/)
  assert.match(tagCss, /var\(--sds-blue-50\)/)
  assert.match(tagCss, /var\(--sds-red-50\)/)
  assert.match(demo, /class="sds-tag-label"/)
  assert.match(demo, /class="sds-tag-action"/)
})

test('linked Tags expose one hit area across their counter and label', () => {
  assert.match(
    demo,
    /class="sds-tag-counter">12<\/span>\s*<a class="sds-tag-label"/,
  )
  assert.match(tagCss, /\.sds-tag-label\[href\]\)::before/)
  assert.match(tagCss, /position: absolute;\s+inset: 0;/)
  assert.match(tagCss, /\.sds-tag-action[\s\S]*position: relative;/)
  assert.match(tagCss, /\.sds-tag-action[\s\S]*z-index: 1;/)
})
