import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { Window } from 'happy-dom'

const source = await readFile('index.html', 'utf8')
const mainSource = await readFile('src/main.ts', 'utf8')
const customElementsManifest = JSON.parse(
  await readFile('custom-elements.json', 'utf8'),
)
const interfaceManifest = JSON.parse(
  await readFile('interface-manifest.json', 'utf8'),
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
    document.querySelector(
      '#actions .sds-card[data-sds-tone="accent"] > strong',
    )?.textContent,
    'Accent',
  )
  assert.equal(
    document.querySelector(
      '#actions .sds-link[data-sds-tone="accent"]',
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

test('catalog includes every public recipe and custom element', () => {
  const missing = []

  for (const recipe of interfaceManifest.recipes) {
    for (const className of recipe.classes) {
      if (!document.querySelector(`.${className}`)) {
        missing.push(`${recipe.name}: .${className}`)
      }
    }
  }

  for (const module of customElementsManifest.modules) {
    for (const declaration of module.declarations ?? []) {
      if (declaration.tagName && !document.querySelector(declaration.tagName)) {
        missing.push(declaration.tagName)
      }
    }
  }

  assert.deepEqual(missing, [])
})

test('catalog sections follow a coherent task progression', () => {
  assert.deepEqual(
    Array.from(
      document.querySelectorAll('main#top > .sds-page > section[id]'),
      (section) => section.id,
    ),
    [
      'overview',
      'getting-started',
      'actions',
      'forms',
      'feedback',
      'content',
      'composition',
      'prose',
      'navigation',
      'structure',
      'loading',
    ],
  )
})

test('component disclosures group API options beside copyable examples', () => {
  const summaries = new Map([
    ['actions', 'Button API and example'],
    ['forms', 'Forms API and example'],
    ['feedback', 'Feedback API and example'],
    ['content', 'Content API and example'],
    ['composition', 'Layout API and examples'],
    ['prose', 'Prose API and example'],
    ['navigation', 'Tabs API and example'],
    ['structure', 'Overlays API and example'],
    ['loading', 'Loading API and example'],
  ])

  for (const section of document.querySelectorAll(
    'main#top > .sds-page > section[id]:not(#overview):not(#getting-started)',
  )) {
    const reference = section.querySelector(
      ':scope > details.sds-card.sds-disclosure',
    )
    assert.ok(reference, `${section.id} is missing its reference disclosure`)
    assert.equal(reference.hasAttribute('open'), false)
    assert.equal(
      reference.querySelector(':scope > summary')?.textContent,
      summaries.get(section.id),
    )
    assert.ok(reference.querySelector(':scope > .sds-grid'))
    assert.equal(reference.querySelectorAll('details').length, 0)

    for (const example of reference.querySelectorAll('pre[id]')) {
      assert.ok(
        reference.querySelector(`[data-copy-target="${example.id}"]`),
        `${section.id} example ${example.id} has no copy action`,
      )
    }
  }
})

test('catalog demonstrates every recipe option and shared floating placement', () => {
  const missing = []

  for (const recipe of interfaceManifest.recipes) {
    for (const [attribute, values] of Object.entries(recipe.options)) {
      if (values.length === 0) {
        if (!document.querySelector(`[${attribute}]`)) {
          missing.push(`${attribute} for ${recipe.name}`)
        }
        continue
      }

      for (const value of values) {
        if (!document.querySelector(`[${attribute}="${value}"]`)) {
          missing.push(`${attribute}="${value}" for ${recipe.name}`)
        }
      }
    }
  }

  const placements = new Set()
  for (const module of customElementsManifest.modules) {
    for (const declaration of module.declarations ?? []) {
      const placement = declaration.attributes?.find(
        (attribute) => attribute.name === 'placement',
      )
      if (!placement) continue
      for (const match of placement.type.text.matchAll(/"([^"]+)"/g)) {
        placements.add(match[1])
      }
    }
  }
  for (const placement of placements) {
    if (!document.querySelector(`[placement="${placement}"]`)) {
      missing.push(`placement="${placement}"`)
    }
  }

  assert.deepEqual(missing, [])
})

test('catalog demonstrates every authored custom-element option', () => {
  const missing = []
  const runtimeState = new Set(['open', 'value'])

  for (const module of customElementsManifest.modules) {
    for (const declaration of module.declarations ?? []) {
      if (!declaration.tagName) continue

      for (const attribute of declaration.attributes ?? []) {
        if (runtimeState.has(attribute.name) || attribute.name === 'placement') {
          continue
        }

        const values = Array.from(
          attribute.type.text.matchAll(/"([^"]+)"/g),
          (match) => match[1],
        )
        if (values.length > 0) {
          for (const value of values) {
            if (
              !document.querySelector(
                `${declaration.tagName}[${attribute.name}="${value}"]`,
              )
            ) {
              missing.push(
                `${declaration.tagName} ${attribute.name}="${value}"`,
              )
            }
          }
          continue
        }

        if (
          !document.querySelector(
            `${declaration.tagName}[${attribute.name}]`,
          )
        ) {
          missing.push(`${declaration.tagName} ${attribute.name}`)
        }
      }
    }
  }

  assert.deepEqual(missing, [])
})

test('catalog quick starts load automatic behavior', () => {
  const quickStarts = source.match(
    /import '@cmu-sei\/sds-lite\/sds\.css'\s+import '@cmu-sei\/sds-lite\/auto'/g,
  )
  assert.equal(quickStarts?.length, 2)
  assert.doesNotMatch(source, /import '@cmu-sei\/sds-lite'\s*</)
})

test('live and copyable custom-element examples use declared option values', () => {
  const examples = Array.from(document.querySelectorAll('pre[id]'), (example) => {
    const template = document.createElement('template')
    template.innerHTML = example.textContent
    return { name: example.id, root: template.content }
  })
  for (const { name, root } of [{ name: 'live catalog', root: document }, ...examples]) {
    for (const element of interfaceManifest.customElements) {
      for (const instance of root.querySelectorAll(element.tagName)) {
        for (const attribute of element.attributes) {
          if (!instance.hasAttribute(attribute.name)) continue
          const value = instance.getAttribute(attribute.name)
          const values = attribute.values ?? interfaceManifest.optionFamilies[attribute.family]?.values ?? []
          if (values.length > 0) {
            assert.ok(values.includes(value), `${name}: <${element.tagName}> uses unsupported ${attribute.name}="${value}"`)
          }
          if (attribute.type === 'number') {
            assert.ok(value.trim() && Number.isFinite(Number(value)), `${name}: ${attribute.name} must be a finite number`)
          }
        }
      }
    }
  }
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
    '#getting-started pre, .sds-disclosure.sds-prose pre, .sds-timeline[data-sds-orientation="horizontal"]',
  )) {
    assert.equal(scrollRegion.getAttribute('tabindex'), '0')
  }
})

test('the playground uses only package styles and built-in presentation hooks', () => {
  assert.deepEqual(
    Array.from(
      mainSource.matchAll(/^import ['"](.+\.css)['"]$/gm),
      (match) => match[1],
    ),
    ['./style.css', './brand.css'],
  )

  for (const element of document.querySelectorAll('[class]')) {
    for (const className of element.classList) {
      assert.doesNotMatch(className, /^demo-/)
    }
  }
  assert.equal(document.querySelector('[style]'), null)
})
