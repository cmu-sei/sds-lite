import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [tooltip, popover, dropdown, floating, tagCss, demo] = await Promise.all([
  readFile('src/elements/tooltip.ts', 'utf8'),
  readFile('src/elements/popover.ts', 'utf8'),
  readFile('src/elements/dropdown.ts', 'utf8'),
  readFile('src/elements/floating.ts', 'utf8'),
  readFile('src/css/components/tag.css', 'utf8'),
  readFile('index.html', 'utf8'),
])

test('all anchored surfaces use the shared positioner', () => {
  for (const source of [tooltip, popover, dropdown]) {
    assert.match(source, /new FloatingPositioner\(/)
  }
})

test('tooltips support pointer, focus, Escape, and accessible descriptions', () => {
  assert.match(tooltip, /FloatingHoverController/)
  assert.match(floating, /pointerenter/)
  assert.match(floating, /focusin/)
  assert.match(floating, /event\.key !== 'Escape'/)
  assert.match(tooltip, /aria-describedby/)
  assert.match(tooltip, /setAttribute\('role', 'tooltip'\)/)
})

test('popovers support delayed hover and preserve native activation', () => {
  assert.match(popover, /setAttribute\('popovertarget', contentId\)/)
  assert.match(popover, /getAttribute\('popover'\) \|\| 'auto'/)
  assert.match(popover, /FloatingHoverController/)
  assert.match(floating, /hoverOpenDelay \?\? 300/)
  assert.doesNotMatch(popover, /aria-haspopup/)
})

test('dropdowns produce a complete ARIA menu structure', () => {
  assert.match(dropdown, /setAttribute\('role', 'menu'\)/)
  assert.match(dropdown, /setAttribute\('role', 'menuitem'\)/)
  assert.match(dropdown, /setAttribute\('role', 'none'\)/)
  assert.match(dropdown, /this\.collectItems\(\)/)
  assert.doesNotMatch(dropdown, /dataset\.mode/)
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
