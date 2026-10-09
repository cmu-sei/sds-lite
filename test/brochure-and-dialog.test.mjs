import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { Window } from 'happy-dom'

const applicationCss = (await readFile(
  'src/css/components/application.css',
  'utf8',
)).replaceAll(':scope', '.sds-app')
const brochureCss = applicationCss.slice(applicationCss.indexOf('@scope (.sds-app[data-sds-variant="brochure"])'))
const overlayCss = await readFile('src/css/components/overlay.css', 'utf8')
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

test('brochure uses the public site colors and spacing', () => {
  const brochureRule = brochureCss.match(
    /:where\(\.sds-app\)\s*\{([^}]*)\}/s,
  )
  const wordmarkRule = applicationCss.match(
    /:where\(\.sds-cmu-wordmark\)\s*\{([^}]*)\}/s,
  )
  const mainRule = brochureCss.match(
    /:where\(\.sds-app-main\)\s*\{([^}]*)\}/s,
  )
  const footerLinksRule = brochureCss.match(
    /:where\(\.sds-app-footer-links\)\s*\{([^}]*)\}/s,
  )
  const footerLinkRule = brochureCss.match(
    /:where\(\.sds-app-footer-links \.sds-link\)\s*\{([^}]*)\}/s,
  )
  const footerLinkArrowRule = brochureCss.match(
    /:where\(\.sds-app-footer-links \.sds-link\)::after\s*\{([^}]*)\}/s,
  )
  const footerActionsRule = brochureCss.match(
    /:where\(\.sds-app-footer-actions\)\s*\{([^}]*)\}/s,
  )

  assert.ok(brochureRule)
  assert.ok(wordmarkRule)
  assert.ok(mainRule)
  assert.ok(footerLinksRule)
  assert.ok(footerLinkRule)
  assert.ok(footerLinkArrowRule)
  assert.ok(footerActionsRule)
  assert.match(
    brochureRule[1],
    /background:\s*var\(--sds-color-surface-default\)/,
  )
  assert.match(wordmarkRule[1], /block-size:\s*var\(--sds-space-xl\)/)
  assert.match(
    mainRule[1],
    /padding-block:\s*var\(--sds-space-2xl\)/,
  )
  assert.match(
    footerLinksRule[1],
    /background:\s*var\(--sds-color-surface-subtle\)/,
  )
  assert.match(
    footerLinksRule[1],
    /padding-block:\s*var\(--sds-space-lg\)/,
  )
  assert.match(
    footerLinkRule[1],
    /color:\s*var\(--sds-color-text-default\)/,
  )
  assert.match(
    footerLinkArrowRule[1],
    /color:\s*var\(--sds-color-brand\)/,
  )
  assert.match(footerActionsRule[1], /margin-block:\s*0/)
  assert.doesNotMatch(footerActionsRule[1], /margin:\s*0/)
  assert.doesNotMatch(applicationCss, /--sds-color-default/)
})

test('modal and panel actions share one right-aligned layout', () => {
  assert.match(
    overlayCss,
    /:where\(\s*\.sds-dialog-footer,\s*\.sds-panel\s*>\s*footer\s*\)\s*\{[^}]*justify-content:\s*flex-end/s,
  )
  const panelFooterRule = panelCss.match(
    /:where\(\.sds-panel\s*>\s*footer\)\s*\{([^}]*)\}/s,
  )
  assert.ok(panelFooterRule)
  assert.doesNotMatch(panelFooterRule[1], /display:\s*flex/)
  assert.match(
    overlayCss,
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
