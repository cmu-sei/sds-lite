import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { Window } from 'happy-dom'

const source = await readFile('index.html', 'utf8')
const customElementsManifest = JSON.parse(
  await readFile('custom-elements.json', 'utf8'),
)
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
  for (const element of document.querySelectorAll('[data-sds-tone]')) {
    assert.ok(
      tones.has(element.getAttribute('data-sds-tone')),
      `Unsupported tone on ${element.outerHTML}`,
    )
  }

  assert.doesNotMatch(source, /data-sds-tone="primary"|--sds-color-primary-/)
  assert.match(
    source,
    /data-sds-tone="accent"[^>]*>\s*<strong>Accent<\/strong>/,
  )
  assert.match(source, /data-sds-toast-open="toast-accent">Show accent/)
  assert.match(source, /data-sds-tone="accent"[^>]*aria-label="Loading accent"/)

  assert.equal(
    document.querySelector('.demo-tone-row[data-sds-tone="accent"] > strong')
      ?.textContent,
    'Accent',
  )
  assert.equal(
    document.querySelector(
      '.demo-link-list > .sds-link[data-sds-tone="accent"]',
    )?.textContent,
    'Accent',
  )
  assert.equal(
    document.querySelector(
      '.sds-datapoint[data-sds-tone="accent"] > span',
    )?.textContent,
    'Accent',
  )
  assert.equal(
    document.querySelector(
      'sds-tabs[tone="accent"] [role="tab"]',
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

test('catalog custom elements use only declared host attributes', () => {
  for (const module of customElementsManifest.modules) {
    for (const declaration of module.declarations ?? []) {
      const allowed = new Set(
        declaration.attributes?.map((attribute) => attribute.name) ?? [],
      )
      for (const element of document.querySelectorAll(declaration.tagName)) {
        for (const attribute of element.getAttributeNames()) {
          if (
            attribute === 'id' ||
            attribute === 'class' ||
            attribute === 'role' ||
            attribute.startsWith('aria-')
          ) {
            continue
          }
          assert.ok(
            allowed.has(attribute),
            `${declaration.tagName} does not declare ${attribute}`,
          )
        }
      }
    }
  }
})

test('catalog IDs are unique and every authored relationship resolves', () => {
  const ids = Array.from(document.querySelectorAll('[id]'), (element) => element.id)
  assert.equal(new Set(ids).size, ids.length)

  const referenceAttributes = [
    'aria-controls',
    'aria-describedby',
    'aria-labelledby',
    'commandfor',
    'data-sds-toast-open',
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

test('the playground uses valid interactive and landmark semantics', () => {
  for (const button of document.querySelectorAll('button')) {
    assert.ok(button.hasAttribute('type'), button.outerHTML)
  }

  const pageMain = document.querySelector('body > .sds-app main#top')
  assert.ok(pageMain)
  assert.equal(pageMain.querySelector('main'), null)

  for (const toaster of document.querySelectorAll('.sds-toaster')) {
    assert.ok(
      toaster.localName === 'section' ||
        toaster.getAttribute('role') === 'region',
    )
    assert.ok(
      toaster.hasAttribute('aria-label') ||
        toaster.hasAttribute('aria-labelledby'),
    )
  }

  for (const avatar of document.querySelectorAll(
    'span.sds-avatar[aria-label]:not([aria-hidden="true"])',
  )) {
    assert.equal(avatar.getAttribute('role'), 'img')
  }

  for (const scrollRegion of document.querySelectorAll(
    '.demo-code, .sds-timeline[data-sds-orientation="horizontal"]',
  )) {
    assert.equal(scrollRegion.getAttribute('tabindex'), '0')
  }
})
