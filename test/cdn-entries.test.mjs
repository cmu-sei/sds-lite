import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { Window } from 'happy-dom'

const browserGlobals = [
  'AbortController',
  'CustomEvent',
  'Element',
  'Event',
  'FocusEvent',
  'HTMLAnchorElement',
  'HTMLButtonElement',
  'HTMLDialogElement',
  'HTMLElement',
  'KeyboardEvent',
  'MouseEvent',
  'MutationObserver',
  'Node',
  'ToggleEvent',
  'customElements',
  'document',
]

function createBrowser() {
  const browser = new Window({ url: 'https://example.test/' })
  for (const name of browserGlobals) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value: browser[name],
    })
  }
  globalThis.window = browser
  globalThis.getComputedStyle = browser.getComputedStyle.bind(browser)
  return browser
}

async function importStandalone(filename) {
  const source = await readFile(`dist/${filename}`, 'utf8')
  return import(
    `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  )
}

test('the manual CDN entry runs on its own', async () => {
  createBrowser()

  const { notify, setupSds } = await importStandalone('sds.js')
  assert.equal(customElements.get('sds-tabs'), undefined)

  const toast = notify('Saved', { persistent: true })
  assert.equal(toast.open, true)
  assert.equal(toast.textContent?.includes('Saved'), true)

  setupSds()
  assert.equal(typeof customElements.get('sds-tabs'), 'function')
})

test('the automatic CDN entry exports notify from the same module', async () => {
  createBrowser()

  const auto = await importStandalone('auto.js')
  assert.equal(typeof customElements.get('sds-tabs'), 'function')

  const toast = auto.notify('Saved', { persistent: true })
  assert.equal(toast.open, true)
  assert.equal(toast.textContent?.includes('Saved'), true)

  const again = await importStandalone('auto.js')
  assert.equal(auto.notify, again.notify)
})
