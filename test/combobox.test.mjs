import assert from 'node:assert/strict'
import test from 'node:test'

import { Window } from 'happy-dom'

const browser = new Window({ url: 'https://example.test/' })
for (const name of [
  'AbortController', 'CustomEvent', 'Element', 'Event', 'FormData',
  'HTMLAnchorElement', 'HTMLButtonElement', 'HTMLDialogElement',
  'HTMLInputElement', 'HTMLLIElement', 'HTMLOutputElement', 'HTMLUListElement', 'HTMLElement',
  'InputEvent', 'MutationObserver', 'Node',
  'customElements', 'document',
]) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: browser[name],
  })
}
globalThis.window = browser

const { setupSds } = await import('@cmu-sei/sds-lite')

test('pre-authored server markup is unchanged by registration after hydration', () => {
  document.body.innerHTML = `
    <form data-sds-root>
      <label for="project">Project</label>
      <sds-combobox keep-open>
        <input id="project" name="project" type="search" role="combobox"
          aria-autocomplete="list" aria-controls="projects"
          aria-expanded="false">
        <ul id="projects" class="sds-combobox-list" role="listbox" popover="manual" hidden>
          <li id="atlas" role="option" aria-selected="false" data-label="Atlas" data-project-id="p-atlas">
            <strong>Atlas</strong> <small>Research</small>
          </li>
        </ul>
        <output data-empty-message="No matching projects."></output>
      </sds-combobox>
    </form>
  `
  const combobox = document.querySelector('sds-combobox')
  const before = combobox.outerHTML
  assert.equal(customElements.get('sds-combobox'), undefined)
  assert.equal(new FormData(document.querySelector('form')).get('project'), '')

  setupSds()
  setupSds()

  assert.equal(combobox.outerHTML, before)
  assert.equal(combobox.querySelector('input').getAttribute('aria-expanded'), 'false')
  assert.equal(combobox.querySelector('ul').hidden, true)
  assert.equal(combobox.querySelector('output').textContent, '')
})

test('a simple combobox is enhanced without replacing its native input', async () => {
  document.body.innerHTML = `
    <form data-sds-root>
      <label for="team">Team</label>
      <sds-combobox><input id="team" name="team" type="text">
        <ul hidden><li>Research</li><li>Engineering</li></ul>
      </sds-combobox>
    </form>
  `
  await browser.happyDOM.whenAsyncComplete()
  const input = document.querySelector('#team')
  const list = document.querySelector('sds-combobox > ul')
  assert.equal(input.getAttribute('role'), 'combobox')
  assert.equal(input.getAttribute('aria-controls'), list.id)
  assert.equal(list.getAttribute('role'), 'listbox')
  assert.equal(list.querySelector('li').getAttribute('role'), 'option')
  input.value = 'Engineering'
  assert.equal(new FormData(document.querySelector('form')).get('team'), 'Engineering')
})

test('selection exposes a stable value and the original option', async () => {
  document.body.innerHTML = `
    <label for="record">Project</label>
    <sds-combobox>
      <input id="record" type="search">
      <ul hidden>
        <li data-label="Atlas" data-sds-value="p-atlas">Atlas project</li>
        <li data-label="Vega">Vega project</li>
      </ul>
    </sds-combobox>
  `
  await browser.happyDOM.whenAsyncComplete()
  const combobox = document.querySelector('sds-combobox')
  const input = combobox.querySelector('input')
  const [option, fallbackOption] = combobox.querySelectorAll('li')
  let detail
  combobox.addEventListener('sds-select', (event) => {
    detail = event.detail
  })

  input.focus()
  input.dispatchEvent(new Event('input', { bubbles: true }))
  option.click()

  assert.equal(input.value, 'Atlas')
  assert.equal(detail.value, 'p-atlas')
  assert.equal(detail.option, option)

  fallbackOption.click()

  assert.equal(input.value, 'Vega')
  assert.equal(detail.value, 'Vega')
  assert.equal(detail.option, fallbackOption)
})

test('missing or invalid content is not enhanced', async () => {
  const warnings = []
  const originalWarn = console.warn
  console.warn = (message) => warnings.push(message)
  try {
    document.body.innerHTML = `
      <sds-combobox><input aria-label="Broken"><div>Not a list</div></sds-combobox>
    `
    await browser.happyDOM.whenAsyncComplete()
  } finally {
    console.warn = originalWarn
  }
  assert.ok(warnings.some((message) => message.includes('direct child')))
  assert.equal(document.querySelector('sds-combobox input').hasAttribute('role'), false)
})
