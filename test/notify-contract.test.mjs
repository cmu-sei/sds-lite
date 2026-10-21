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
  assert.equal(toast.parentElement?.localName, 'section')
  assert.equal(toast.parentElement?.getAttribute('aria-label'), 'Notifications')
  assert.equal(toast.parentElement?.parentElement, document.body)

  const closeButton = toast.querySelector('[data-sds-toast-close]')
  assert.ok(closeButton instanceof HTMLButtonElement)
  assert.equal(closeButton.className, 'sds-button')
  assert.equal(closeButton.getAttribute('data-sds-shape'), 'icon')
  assert.equal(closeButton.getAttribute('aria-label'), 'Dismiss notification')
})

test('notify localizes generated names without replacing authored toaster names', () => {
  const container = document.createElement('div')
  document.body.append(container)
  const toast = notify('Enregistre', {
    container,
    title: 'Projet enregistre',
    dismissLabel: 'Fermer',
    regionLabel: 'Messages du projet',
    persistent: true,
  })
  assert.equal(toast.querySelector('strong').textContent, 'Projet enregistre')
  assert.equal(toast.querySelector('button').getAttribute('aria-label'), 'Fermer')
  assert.equal(toast.parentElement.getAttribute('aria-label'), 'Messages du projet')

  const next = notify('Autre message', { container, regionLabel: 'Other name', persistent: true })
  assert.equal(next.parentElement.getAttribute('aria-label'), 'Messages du projet')
  assert.equal(next.querySelector('button').getAttribute('aria-label'), 'Dismiss notification')

  const authored = document.createElement('section')
  authored.className = 'sds-toaster'
  authored.setAttribute('aria-labelledby', 'project-heading')
  container.replaceChildren(authored)
  const named = notify('Saved', { container, regionLabel: 'Ignored', persistent: true })
  assert.equal(named.parentElement.getAttribute('aria-labelledby'), 'project-heading')
  assert.equal(named.parentElement.hasAttribute('aria-label'), false)
})

test('notify rejects empty translated accessibility labels', () => {
  for (const key of ['dismissLabel', 'regionLabel']) {
    for (const value of ['', '   ', null, 42]) {
      assert.throws(() => notify('Saved', { [key]: value }), TypeError)
    }
  }
})
