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

const { defineSds, notify } = await import('@cmu-sei/sds-lite')
const { SdsDropdownElement } = await import('@cmu-sei/sds-lite/dropdown')

test('the root entry is side-effect-free and hydration-safe', () => {
  assert.equal(customElements.get('sds-dropdown'), undefined)

  document.body.innerHTML = `
    <sds-dropdown>
      <button
        type="button"
        popovertarget="actions"
        aria-controls="actions"
        aria-expanded="false"
        aria-haspopup="menu"
      >Actions</button>
      <menu
        id="actions"
        class="sds-dropdown-menu"
        popover="auto"
        role="menu"
        aria-orientation="vertical"
      >
        <li role="none">
          <button type="button" role="menuitem" tabindex="-1">Rename</button>
        </li>
      </menu>
    </sds-dropdown>
  `
  const dropdown = document.querySelector('sds-dropdown')
  const before = dropdown?.outerHTML

  defineSds({ include: ['dropdown'] })

  assert.equal(customElements.get('sds-dropdown'), SdsDropdownElement)
  assert.equal(dropdown?.outerHTML, before)
  assert.throws(
    () => defineSds({ include: ['unknown-behavior'] }),
    RangeError,
  )
})

test('popover enhancement preserves native activation semantics', async () => {
  defineSds({ include: ['popover'] })
  document.body.innerHTML = `
    <sds-popover>
      <button type="button">Details</button>
      <section>Project details</section>
    </sds-popover>
  `
  await browser.happyDOM.whenAsyncComplete()

  const trigger = document.querySelector('sds-popover > button')
  const content = document.querySelector('sds-popover > section')
  assert.equal(trigger?.getAttribute('popovertarget'), content?.id)
  assert.equal(content?.getAttribute('popover'), 'auto')
  assert.equal(trigger?.hasAttribute('aria-haspopup'), false)

  const replacement = document.createElement('section')
  replacement.textContent = 'Updated project details'
  content?.replaceWith(replacement)
  await browser.happyDOM.whenAsyncComplete()

  assert.equal(trigger?.getAttribute('popovertarget'), replacement.id)
  assert.equal(replacement.getAttribute('popover'), 'auto')
})

test('tabs require an authored accessible name', async () => {
  defineSds({ include: ['tabs'] })
  const originalWarn = console.warn
  let warning = ''
  console.warn = (message) => {
    warning = String(message)
  }
  try {
    document.body.innerHTML = `
      <sds-tabs>
        <div><button type="button">One</button></div>
        <section>Panel</section>
      </sds-tabs>
    `
    await browser.happyDOM.whenAsyncComplete()
  } finally {
    console.warn = originalWarn
  }

  const tabList = document.querySelector('sds-tabs > div')
  assert.equal(tabList?.hasAttribute('aria-label'), false)
  assert.match(warning, /requires an accessible name/)
})

test('tabs honor an authored initial selection', async () => {
  document.body.innerHTML = `
    <sds-tabs>
      <div aria-label="Project sections">
        <button type="button">Overview</button>
        <button type="button" aria-selected="true">Files</button>
      </div>
      <section>Overview panel</section>
      <section>Files panel</section>
    </sds-tabs>
  `
  await browser.happyDOM.whenAsyncComplete()

  const tabs = document.querySelectorAll('sds-tabs [role="tab"]')
  const panels = document.querySelectorAll('sds-tabs [role="tabpanel"]')
  assert.equal(tabs[0]?.getAttribute('aria-selected'), 'false')
  assert.equal(tabs[0]?.getAttribute('tabindex'), '-1')
  assert.equal(panels[0]?.hidden, true)
  assert.equal(tabs[1]?.getAttribute('aria-selected'), 'true')
  assert.equal(tabs[1]?.getAttribute('tabindex'), '0')
  assert.equal(panels[1]?.hidden, false)
})

test('notify validates duration and respects an explicit container', () => {
  defineSds({ include: ['toast'] })
  const container = document.createElement('section')
  container.dataset.sdsRoot = ''
  document.body.append(container)

  assert.throws(
    () => notify('Invalid', { duration: 0 }),
    /duration must be a positive number/,
  )

  const toast = notify('Saved', { container, persistent: true })
  assert.equal(toast.closest('section'), container)
  assert.equal(container.querySelector('sds-toaster')?.contains(toast), true)

  const toaster = document.createElement('sds-toaster')
  document.body.append(toaster)
  const directToast = notify('Published', {
    container: toaster,
    persistent: true,
  })
  assert.equal(directToast.parentElement, toaster)
  assert.equal(toaster.querySelector('sds-toaster'), null)
})
