import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { Window } from 'happy-dom'

const source = await readFile('index.html', 'utf8')
const window = new Window({ url: 'https://example.test/' })
window.document.write(source)
const { document } = window

const tones = new Set([
  'neutral',
  'accent',
  'info',
  'success',
  'warning',
  'danger',
])

test('catalog examples use the current tone vocabulary', () => {
  for (const element of document.querySelectorAll('[data-tone]')) {
    assert.ok(
      tones.has(element.getAttribute('data-tone')),
      `Unsupported tone on ${element.outerHTML}`,
    )
  }

  assert.doesNotMatch(source, /data-tone="primary"|--sds-color-primary-/)
  assert.match(
    source,
    /data-tone="accent"[^>]*>\s*<strong>Accent<\/strong>/,
  )
  assert.match(source, /data-toast-open="toast-accent">Show accent/)
  assert.match(source, /data-tone="accent"[^>]*aria-label="Loading accent"/)

  assert.equal(
    document.querySelector('.demo-tone-row[data-tone="accent"] > strong')
      ?.textContent,
    'Accent',
  )
  assert.equal(
    document.querySelector(
      '.demo-link-list > .sds-link[data-tone="accent"]',
    )?.textContent,
    'Accent',
  )
  assert.equal(
    document.querySelector(
      '.sds-datapoint[data-tone="accent"] > span',
    )?.textContent,
    'Accent',
  )
  assert.equal(
    document.querySelector(
      'sds-tabs[data-tone="accent"] [role="tab"]',
    )?.textContent,
    'Accent',
  )
})

test('catalog quick starts load automatic behavior', () => {
  const quickStarts = source.match(
    /import '@cmu-sei\/sds-lite\/sds\.css'\s+import '@cmu-sei\/sds-lite\/auto'/g,
  )
  assert.equal(quickStarts?.length, 2)
  assert.doesNotMatch(source, /import '@cmu-sei\/sds-lite'\s*</)
})

test('catalog IDs are unique and every authored relationship resolves', () => {
  const ids = Array.from(document.querySelectorAll('[id]'), (element) => element.id)
  assert.equal(new Set(ids).size, ids.length)

  const referenceAttributes = [
    'aria-controls',
    'aria-describedby',
    'aria-labelledby',
    'commandfor',
    'data-toast-open',
    'popovertarget',
  ]
  for (const attribute of referenceAttributes) {
    for (const element of document.querySelectorAll(`[${attribute}]`)) {
      for (const id of element.getAttribute(attribute).split(/\s+/)) {
        assert.ok(
          document.getElementById(id),
          `${attribute}="${id}" does not resolve`,
        )
      }
    }
  }
})

test('live dropdown examples contain complete server-rendered semantics', () => {
  for (const dropdown of document.querySelectorAll('sds-dropdown')) {
    const trigger = dropdown.querySelector(':scope > button')
    const menu = dropdown.querySelector(':scope > menu')
    assert.ok(trigger)
    assert.ok(menu)
    assert.equal(trigger.getAttribute('popovertarget'), menu.id)
    assert.equal(trigger.getAttribute('aria-controls'), menu.id)
    assert.equal(trigger.getAttribute('aria-expanded'), 'false')
    assert.equal(trigger.getAttribute('aria-haspopup'), 'menu')
    assert.equal(menu.getAttribute('popover'), 'auto')
    assert.equal(menu.getAttribute('role'), 'menu')
    assert.equal(menu.getAttribute('aria-orientation'), 'vertical')

    for (const item of menu.querySelectorAll(':scope > li')) {
      assert.equal(item.getAttribute('role'), 'none')
    }
    for (const item of menu.querySelectorAll('button, a[href]')) {
      assert.equal(item.getAttribute('role'), 'menuitem')
      assert.equal(item.getAttribute('tabindex'), '-1')
    }
  }
})

test('live tab examples contain complete server-rendered semantics', () => {
  for (const tabs of document.querySelectorAll('sds-tabs')) {
    const tabList = tabs.querySelector(':scope > [role="tablist"]')
    assert.ok(tabList)
    assert.ok(
      tabList.hasAttribute('aria-label') ||
        tabList.hasAttribute('aria-labelledby'),
    )

    for (const tab of tabList.querySelectorAll('[role="tab"]')) {
      const panel = document.getElementById(tab.getAttribute('aria-controls'))
      assert.ok(panel)
      assert.equal(panel.getAttribute('role'), 'tabpanel')
      assert.equal(panel.getAttribute('aria-labelledby'), tab.id)
      assert.ok(['0', '-1'].includes(tab.getAttribute('tabindex')))
    }
  }
})
