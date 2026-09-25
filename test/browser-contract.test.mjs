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

const { notify, setupSds } = await import('@cmu-sei/sds-lite')
const { SdsDropdownElement } = await import('../dist/package/dropdown.js')

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

  setupSds()
  setupSds()

  assert.equal(customElements.get('sds-dropdown'), SdsDropdownElement)
  assert.equal(dropdown?.outerHTML, before)
})

test('panels receive one decorative drag handle', async () => {
  document.body.innerHTML = `
    <dialog class="sds-panel">
      <header><h2>Panel</h2></header>
    </dialog>
  `
  await browser.happyDOM.whenAsyncComplete()

  const panel = document.querySelector('.sds-panel')
  const handle = panel?.querySelector(':scope > ._sds-panel-handle')
  assert.ok(handle)
  assert.equal(handle.getAttribute('aria-hidden'), 'true')

  panel?.setAttribute('data-example', 'updated')
  await browser.happyDOM.whenAsyncComplete()
  assert.equal(
    panel?.querySelectorAll(':scope > ._sds-panel-handle').length,
    1,
  )
})

test('popover enhancement preserves native activation semantics', async () => {
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
  assert.equal(trigger?.getAttribute('type'), 'button')
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
  assert.equal(document.querySelector('sds-tabs')?.value, tabs[1]?.id)
})

test('tabs expose reflected configuration and selected value', async () => {
  document.body.innerHTML = `
    <sds-tabs value="files" activation="manual" orientation="vertical">
      <div aria-label="Project sections">
        <button type="button" value="overview">Overview</button>
        <button type="button" value="files">Files</button>
      </div>
      <section>Overview panel</section>
      <section>Files panel</section>
    </sds-tabs>
  `
  await browser.happyDOM.whenAsyncComplete()

  const tabs = document.querySelector('sds-tabs')
  assert.equal(tabs?.value, 'files')
  assert.equal(tabs?.activation, 'manual')
  assert.equal(tabs?.orientation, 'vertical')
  assert.equal(
    tabs?.querySelector('[role="tablist"]')?.getAttribute('aria-orientation'),
    'vertical',
  )
  tabs.orientation = 'horizontal'
  assert.equal(
    tabs.querySelector('[role="tablist"]')?.getAttribute('aria-orientation'),
    'horizontal',
  )
  assert.equal(
    tabs?.querySelector('[value="files"]')?.getAttribute('aria-selected'),
    'true',
  )

  tabs.value = 'overview'
  assert.equal(tabs.getAttribute('value'), 'overview')
  assert.equal(
    tabs.querySelector('[value="overview"]')?.getAttribute('aria-selected'),
    'true',
  )
  assert.throws(() => {
    tabs.value = 'missing'
  }, /no enabled tab/)
})

test('enhanced controls default buttons without overriding explicit types', async () => {
  document.body.innerHTML = `
    <sds-dropdown>
      <button>Actions</button>
      <menu><li><button type="submit">Save</button></li></menu>
    </sds-dropdown>
    <sds-tabs>
      <div aria-label="Sections">
        <button>Overview</button>
        <button type="submit">Submit</button>
      </div>
      <section>Overview</section>
      <section>Submit</section>
    </sds-tabs>
  `
  await browser.happyDOM.whenAsyncComplete()

  assert.equal(
    document.querySelector('sds-dropdown > button')?.getAttribute('type'),
    'button',
  )
  const tabs = document.querySelectorAll('sds-tabs [role="tab"]')
  assert.equal(tabs[0]?.getAttribute('type'), 'button')
  assert.equal(tabs[1]?.getAttribute('type'), 'submit')
  assert.equal(document.querySelector('sds-tabs')?.tone, 'info')
})

test('floating element options reflect through host properties', () => {
  const dropdown = document.createElement('sds-dropdown')
  const popover = document.createElement('sds-popover')
  const tooltip = document.createElement('sds-tooltip')

  assert.equal(dropdown.offset, 5)
  assert.equal(popover.offset, 9)
  assert.equal(tooltip.offset, 6)

  dropdown.placement = 'inline-end'
  dropdown.offset = 12
  dropdown.width = 'lg'
  dropdown.hideCaret = true

  assert.equal(dropdown.getAttribute('placement'), 'inline-end')
  assert.equal(dropdown.getAttribute('offset'), '12')
  assert.equal(dropdown.getAttribute('width'), 'lg')
  assert.equal(dropdown.hasAttribute('hide-caret'), true)
  assert.throws(() => {
    dropdown.offset = -1
  }, /nonnegative/)
})

test('notify validates duration and respects an explicit container', () => {
  const authoredToast = document.createElement('sds-toast')
  assert.equal(authoredToast.duration, 5000)
  authoredToast.setAttribute('duration', '0')
  assert.equal(authoredToast.duration, 5000)

  const container = document.createElement('section')
  container.dataset.sdsRoot = ''
  document.body.append(container)

  assert.throws(
    () => notify('Invalid', { duration: 0 }),
    /duration must be a positive number/,
  )

  const toast = notify('Saved', { container, persistent: true })
  assert.equal(container.contains(toast), true)
  const generatedToaster = container.querySelector('.sds-toaster')
  assert.equal(generatedToaster?.contains(toast), true)
  assert.equal(generatedToaster?.localName, 'section')
  assert.equal(generatedToaster?.getAttribute('aria-label'), 'Notifications')

  const toaster = document.createElement('div')
  toaster.className = 'sds-toaster'
  document.body.append(toaster)
  const directToast = notify('Published', {
    container: toaster,
    persistent: true,
  })
  assert.equal(directToast.parentElement, toaster)
  assert.equal(toaster.querySelector('.sds-toaster'), null)
  assert.equal(toaster.getAttribute('role'), 'region')
  assert.equal(toaster.getAttribute('aria-label'), 'Notifications')
})
