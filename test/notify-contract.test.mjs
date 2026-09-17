import assert from 'node:assert/strict'
import test from 'node:test'

import { Window } from 'happy-dom'

const browser = new Window({ url: 'https://example.test/' })
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

for (const name of browserGlobals) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: browser[name],
  })
}
globalThis.window = browser
globalThis.getComputedStyle = browser.getComputedStyle.bind(browser)

const { notify } = await import('@cmu-sei/sds-lite')

test('notify is self-contained', () => {
  assert.equal(customElements.get('sds-toast'), undefined)

  const toast = notify('Saved', { persistent: true })

  assert.ok(toast instanceof customElements.get('sds-toast'))
  assert.equal(toast.open, true)
  assert.equal(toast.parentElement?.className, 'sds-toaster')
  assert.equal(toast.parentElement?.parentElement, document.body)
})
