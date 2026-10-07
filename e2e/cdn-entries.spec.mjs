import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

async function openCdnPage(page, entry) {
  const script =
    entry === 'auto'
      ? '<script type="module" src="./auto.js"></script>'
      : ''

  await page.route('**/cdn-entry/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (pathname === '/cdn-entry/') {
      await route.fulfill({
        contentType: 'text/html',
        body: `<!doctype html>
          <html lang="en">
            <head>
              <link rel="stylesheet" href="./sds.css">
              ${script}
              <script type="module">
                import { notify${entry === 'manual' ? ', setupSds' : ''} } from './${entry === 'manual' ? 'sds' : 'auto'}.js'
                ${entry === 'manual' ? 'setupSds()' : ''}
                document.querySelector('#save').addEventListener('click', () => {
                  notify('Saved', { persistent: true })
                })
              </script>
            </head>
            <body data-sds-root>
              <button class="sds-button" id="save" type="button">Save</button>
              <sds-tabs>
                <div aria-label="Sections"><button class="sds-button">One</button><button class="sds-button">Two</button></div>
                <section>First</section><section>Second</section>
              </sds-tabs>
            </body>
          </html>`,
      })
      return
    }

    const filename = pathname.slice('/cdn-entry/'.length)
    if (!['auto.js', 'sds.js', 'sds.css'].includes(filename)) {
      await route.fulfill({ status: 404 })
      return
    }
    await route.fulfill({
      body: await readFile(`dist/${filename}`),
      contentType: filename.endsWith('.css')
        ? 'text/css'
        : 'text/javascript',
    })
  })

  await page.goto('/cdn-entry/')
}

for (const entry of ['auto', 'manual']) {
  test(`standalone CDN ${entry} entry sets up tabs and notifies`, async ({
    page,
  }) => {
    await openCdnPage(page, entry)
    await expect(page.locator('sds-tabs [role="tab"]')).toHaveCount(2)

    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('sds-toast')).toContainText('Saved')
  })
}
