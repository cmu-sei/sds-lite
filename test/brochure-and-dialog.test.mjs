import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { Window } from 'happy-dom'

const applicationCss = await readFile(
  'src/css/components/application.css',
  'utf8',
)
const dialogCss = await readFile('src/css/components/dialog.css', 'utf8')
const panelCss = await readFile('src/css/components/panel.css', 'utf8')
const demo = await readFile('index.html', 'utf8')

test('brochure chrome includes the official header and legal footer content', () => {
  assert.match(applicationCss, /:where\(\.sds-cmu-wordmark\)/)

  for (const requiredMarkup of [
    'href="https://www.cmu.edu/"',
    'target="_self"',
    'aria-label="Carnegie Mellon University"',
    'href="https://sei.cmu.edu/"',
    'Report a Vulnerability',
    'Subscribe to SEI Bulletin',
    'Request Permission to Use SEI Material',
    'Advancing Software for National Security',
    'Sponsored by the Department of War',
    'Main Office',
    '4500 Fifth Avenue',
    '412-268-5800',
    'Research and Development',
    'Publications and Media',
    'Digital Library',
    'Facebook',
    'LinkedIn',
    'YouTube',
    'Contact Us',
    'Privacy Notice',
    'Office Locations',
    'www.cmu.edu',
  ]) {
    assert.match(demo, new RegExp(requiredMarkup))
  }

  assert.doesNotMatch(demo, /Subscribe to SEI updates/)
})

test('modal and panel actions share one right-aligned layout', () => {
  assert.match(
    dialogCss,
    /:where\(\s*\.sds-dialog-footer,\s*\.sds-panel\s*>\s*footer\s*\)\s*\{[^}]*justify-content:\s*flex-end/s,
  )
  const panelFooterRule = panelCss.match(
    /:where\(\.sds-panel\s*>\s*footer\)\s*\{([^}]*)\}/s,
  )
  assert.ok(panelFooterRule)
  assert.doesNotMatch(panelFooterRule[1], /display:\s*flex/)
  assert.match(
    dialogCss,
    /:where\(\s*\.sds-dialog-footer,\s*\.sds-panel\s*>\s*footer\s*\)[^}]*>\s*:is\(button,\s*\.sds-button\)/s,
  )
})

test('commands inside a dialog infer the nearest dialog target', async () => {
  const browser = new Window({ url: 'https://example.test/' })
  for (const name of [
    'Element',
    'HTMLDialogElement',
    'HTMLElement',
    'MouseEvent',
    'document',
  ]) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value: browser[name],
    })
  }

  const { registerSdsDialog } = await import('../dist/package/dialog.js')
  registerSdsDialog()
  document.body.innerHTML = `
    <dialog class="sds-dialog" open>
      <button command="close" data-sds-return-value="saved">Done</button>
    </dialog>
  `

  const dialog = document.querySelector('dialog')
  document.querySelector('button')?.click()
  assert.equal(dialog?.open, false)
  assert.equal(dialog?.returnValue, 'saved')
})
