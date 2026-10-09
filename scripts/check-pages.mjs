import assert from 'node:assert/strict'

import { chromium } from '@playwright/test'
import { preview } from 'vite'

const server = await preview({
  configFile: 'vite.config.ts',
  base: '/sds-lite/',
  build: { outDir: 'pages-dist' },
  preview: { host: '127.0.0.1', port: 4174, strictPort: false, open: false },
})
let browser
try {
  browser = await chromium.launch()
  const origin = server.resolvedUrls.local[0]
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('response', (response) => {
      if (response.url().startsWith(origin) && response.status() >= 400) {
        errors.push(`${response.status()} ${response.url()}`)
      }
    })
    const response = await page.goto(origin, { waitUntil: 'networkidle' })
    assert.equal(response.status(), 200)
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      styled: getComputedStyle(document.querySelector('.sds-button')).display,
      registered: ['sds-combobox', 'sds-dropdown', 'sds-tabs', 'sds-tooltip', 'sds-toast', 'sds-popover']
        .every((tag) => customElements.get(tag)),
      docs: [...document.querySelectorAll('a[href^="https://github.com/"]')]
        .some((anchor) => anchor.href.includes('/blob/v') && anchor.href.includes('/docs/')),
    }))
    assert.equal(state.overflow, false, 'The playground must fit the viewport')
    assert.notEqual(state.styled, 'inline', 'The stylesheet must load')
    assert.equal(state.registered, true, 'Automatic component registration must load')
    assert.equal(state.docs, true, 'Documentation must link to the release on GitHub')
    const tabs = page.locator('sds-tabs:visible').first()
    const secondTab = tabs.getByRole('tab').nth(1)
    await secondTab.click()
    assert.equal(await secondTab.getAttribute('aria-selected'), 'true')
    assert.deepEqual(errors, [], 'The built site must load without script or asset errors')
    await page.close()
    console.log(`Pages smoke passed at ${viewport.width}px under /sds-lite/`)
  }
} finally {
  await browser?.close()
  await new Promise((resolveClose, reject) => server.httpServer.close((error) => error ? reject(error) : resolveClose()))
}