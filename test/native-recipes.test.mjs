import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'

import { Window } from 'happy-dom'

const catalogSource = await readFile('index.html', 'utf8')
const coreSource = await readFile('src/core.css', 'utf8')
const window = new Window({ url: 'https://example.test/' })
window.document.write(catalogSource)
const { document } = window

test('theme roots do not opt native elements into foundations', async () => {
  const foundations = await readFile('src/css/foundations.css', 'utf8')
  assert.doesNotMatch(foundations, /\[data-sds-root\]/)
  assert.match(foundations, /\.sds-fieldset/)
  assert.match(foundations, /\.sds-button/)
})

test('native recipes require explicit styling rather than a theme root', async () => {
  for (const name of await readdir('src/css/components')) {
    const source = await readFile(`src/css/components/${name}`, 'utf8')
    assert.doesNotMatch(source, /\[data-sds-root\]/, name)
  }
  const typography = await readFile('src/css/components/typography.css', 'utf8')
  assert.doesNotMatch(typography, /:where\(h[1-6]/)
  assert.match(typography, /\.sds-text-h6/)
  assert.match(typography, /min-width: 48rem/)
})

test('file-upload metadata only targets explicit recipes', async () => {
  const manifest = JSON.parse(await readFile('interface-manifest.json', 'utf8'))
  const recipe = manifest.recipes.find((candidate) => candidate.name === 'file-upload')
  assert.equal(recipe.optionTargets['data-sds-size'], '.sds-file-upload, .sds-file-input')
})

test('the core stylesheet includes every native recipe', () => {
  for (const recipe of ['switch', 'file-input', 'avatar', 'pagination']) {
    assert.match(
      coreSource,
      new RegExp(`components/${recipe}\\.css`),
      `${recipe} is not included in core.css`,
    )
  }
})

test('switch examples preserve native checkbox behavior', () => {
  const switches = document.querySelectorAll('.sds-switch')
  assert.ok(switches.length > 0)

  for (const switchLabel of switches) {
    assert.equal(switchLabel.localName, 'label')
    const input = switchLabel.querySelector(':scope > input')
    assert.equal(input?.getAttribute('type'), 'checkbox')
    assert.equal(input?.getAttribute('role'), 'switch')
  }
})

test('the file input example uses native constraints and an associated label', () => {
  const input = document.querySelector('input.sds-file-input')
  const upload = input?.closest('.sds-file-upload')
  assert.ok(upload)
  assert.ok(upload?.closest('form.sds-grid'))
  assert.equal(input?.getAttribute('type'), 'file')
  assert.ok(input?.hasAttribute('name'))
  assert.ok(input?.hasAttribute('accept'))
  assert.equal(
    document.querySelector(`label[for="${input?.id}"]`)?.textContent,
    'Supporting files',
  )
  const action = upload?.querySelector('.sds-file-upload-action')
  assert.equal(action?.textContent.trim(), 'Upload files')
  assert.ok(action?.querySelector('svg[aria-hidden="true"]'))
})

test('initials avatars have accessible names', () => {
  const avatars = document.querySelectorAll(
    '.sds-avatar:not([aria-hidden="true"])',
  )
  assert.ok(avatars.length > 0)

  for (const avatar of avatars) {
    if (avatar.localName === 'img') {
      assert.ok(avatar.hasAttribute('alt'))
    } else {
      assert.ok(avatar.hasAttribute('aria-label'))
    }
  }
})

test('pagination uses links and native current-page state', () => {
  const pagination = document.querySelector('.sds-pagination')
  assert.ok(pagination)
  assert.equal(pagination?.localName, 'nav')
  assert.ok(pagination?.hasAttribute('aria-label'))
  assert.equal(
    pagination?.querySelectorAll('[aria-current="page"]').length,
    1,
  )

  const unavailable = pagination?.querySelector(
    '[role="link"][aria-disabled="true"]',
  )
  assert.equal(unavailable?.localName, 'a')
  assert.equal(unavailable?.getAttribute('tabindex'), '-1')
  assert.ok(unavailable?.querySelector('svg[aria-hidden="true"]'))
})

test('the avatar group composes the existing dropdown for overflow people', () => {
  const dropdown = document.querySelector('.sds-avatar-group sds-dropdown')
  assert.ok(dropdown)
  assert.ok(dropdown?.querySelector(':scope > .sds-avatar'))
  assert.ok(dropdown?.querySelector(':scope > menu.sds-dropdown-menu'))
  const items = dropdown?.querySelectorAll('[role="menuitem"]')
  assert.ok(items?.length > 0)
  for (const item of items ?? []) {
    assert.ok(item.querySelector('.sds-avatar[data-sds-size="xs"]'))
  }
})
