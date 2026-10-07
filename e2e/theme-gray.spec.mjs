import { expect, test } from '@playwright/test'

test('Forge and Plaid expose distinct gray scales', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root) => {
    root.insertAdjacentHTML(
      'afterbegin',
      '<div data-sds-theme="forge"><span data-test-gray-theme="forge"></span></div><div data-sds-theme="plaid"><span data-test-gray-theme="plaid"></span></div>',
    )
  })

  const levels = [
    '25',
    '50',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '750',
    '800',
    '850',
    '900',
    '950',
  ]
  const readScale = (theme) =>
    page
      .locator(`[data-test-gray-theme="${theme}"]`)
      .evaluate((element, levels) => {
        const style = getComputedStyle(element)
        return Object.fromEntries(
          levels.map((level) => [
            level,
            style.getPropertyValue(`--sds-gray-${level}`).trim(),
          ]),
        )
      }, levels)

  expect(await readScale('plaid')).toEqual({
    25: '#f9f8f8',
    50: '#f2f1f1',
    100: '#e4e3e3',
    200: '#c9c8c7',
    300: '#adacac',
    400: '#929190',
    500: '#777574',
    600: '#625f5d',
    700: '#4c4946',
    750: '#3f3c39',
    800: '#322f2b',
    850: '#2d2a26',
    900: '#1e1d1b',
    950: '#141211',
  })
  expect(await readScale('plaid')).not.toEqual(await readScale('forge'))
})

test('Plaid semantic neutrals consume the Plaid gray scale', async ({
  page,
}) => {
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root) => {
    root.insertAdjacentHTML(
      'afterbegin',
      '<div data-sds-theme="plaid" data-sds-color-scheme="light"><span data-test-plaid-semantic="light"></span></div><div data-sds-theme="plaid" data-sds-color-scheme="dark"><span data-test-plaid-semantic="dark"></span></div>',
    )
  })

  const readSemanticColors = (scheme) =>
    page
      .locator(`[data-test-plaid-semantic="${scheme}"]`)
      .evaluate((element) => {
        element.style.color = 'var(--sds-color-text-default)'
        element.style.background = 'var(--sds-color-surface-default)'
        element.style.border = '1px solid var(--sds-color-border-default)'
        const style = getComputedStyle(element)
        return {
          background: style.backgroundColor,
          border: style.borderColor,
          text: style.color,
        }
      })

  expect(await readSemanticColors('light')).toEqual({
    background: 'rgb(255, 255, 255)',
    border: 'rgb(228, 227, 227)',
    text: 'rgb(30, 29, 27)',
  })
  expect(await readSemanticColors('dark')).toEqual({
    background: 'rgb(20, 18, 17)',
    border: 'rgb(30, 29, 27)',
    text: 'rgb(228, 227, 227)',
  })
})

test('surface tokens follow the layered light and dark surface model', async ({
  page,
}) => {
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root) => {
    root.insertAdjacentHTML(
      'afterbegin',
      '<div data-test-surface-model="light" data-sds-color-scheme="light"></div><div data-test-surface-model="dark" data-sds-color-scheme="dark"></div>',
    )
  })

  const readSurfaces = (scheme) =>
    page.locator(`[data-test-surface-model="${scheme}"]`).evaluate((element) => {
      const values = {}
      for (const name of ['background', 'surface-subtle', 'surface-default', 'surface-raised']) {
        element.style.background = `var(--sds-color-${name})`
        values[name] = getComputedStyle(element).backgroundColor
      }
      return values
    })

  expect(await readSurfaces('light')).toEqual({
    background: 'rgb(248, 248, 248)',
    'surface-subtle': 'rgb(248, 248, 248)',
    'surface-default': 'rgb(255, 255, 255)',
    'surface-raised': 'rgb(255, 255, 255)',
  })
  expect(await readSurfaces('dark')).toEqual({
    background: 'rgb(0, 0, 0)',
    'surface-subtle': 'rgb(27, 28, 29)',
    'surface-default': 'rgb(14, 14, 15)',
    'surface-raised': 'rgb(38, 39, 40)',
  })

  await page.locator('[data-sds-root]').evaluate((root) => {
    root.setAttribute('data-sds-color-scheme', 'dark')
  })
  await expect(page.locator('.sds-card').first()).toHaveCSS(
    'background-color',
    'rgb(14, 14, 15)',
  )
})

test('recipes consume semantic color overrides', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root) => {
    root.insertAdjacentHTML(
      'afterbegin',
      `<section data-test-semantic-overrides>
        <header class="sds-page-header">Page</header>
        <table class="sds-table">
          <caption>Caption</caption>
          <thead><tr><th>Heading</th></tr></thead>
          <tbody><tr><td>Cell</td></tr></tbody>
        </table>
        <nav class="sds-pagination"><ul><li><a href="#" aria-current="page">1</a></li></ul></nav>
        <span class="sds-skeleton"></span>
        <ul class="sds-timeline"><li class="sds-timeline-item">First</li><li class="sds-timeline-item">Last</li></ul>
        <span class="sds-badge" data-sds-tone="accent" data-sds-variant="light">Badge</span>
        <div class="sds-datapoint" data-sds-tone="accent"><div><strong>42</strong></div></div>
        <article class="sds-prose" data-sds-tone="accent"><a href="#">Link</a></article>
        <button class="sds-button" data-sds-tone="accent" data-sds-variant="outlined">Button</button>
      </section>`,
    )

    const fixture = root.querySelector('[data-test-semantic-overrides]')
    const overrides = {
      '--sds-color-border-default': 'rgb(1 2 3)',
      '--sds-color-text-default': 'rgb(4 5 6)',
      '--sds-color-text-muted': 'rgb(7 8 9)',
      '--sds-color-action-primary': 'rgb(10 11 12)',
      '--sds-color-neutral-surface': 'rgb(13 14 15)',
      '--sds-color-neutral-border': 'rgb(16 17 18)',
      '--sds-color-accent-surface': 'rgb(19 20 21)',
      '--sds-color-accent-text': 'rgb(22 23 24)',
      '--sds-color-accent-strong': 'rgb(25 26 27)',
      '--sds-color-accent-border': 'rgb(28 29 30)',
    }
    for (const [property, value] of Object.entries(overrides)) {
      fixture.style.setProperty(property, value)
    }
  })

  const fixture = page.locator('[data-test-semantic-overrides]')
  await expect(fixture.locator('.sds-page-header')).toHaveCSS(
    'border-bottom-color',
    'rgb(1, 2, 3)',
  )
  await expect(fixture.locator('.sds-table')).toHaveCSS(
    'outline-color',
    'rgb(1, 2, 3)',
  )
  await expect(fixture.locator('.sds-table caption')).toHaveCSS(
    'color',
    'rgb(4, 5, 6)',
  )
  await expect(fixture.locator('.sds-table th')).toHaveCSS(
    'color',
    'rgb(7, 8, 9)',
  )
  await expect(fixture.locator('.sds-pagination [aria-current="page"]')).toHaveCSS(
    'border-color',
    'rgb(10, 11, 12)',
  )
  await expect(fixture.locator('.sds-skeleton')).toHaveCSS(
    'background-color',
    'rgb(13, 14, 15)',
  )
  expect(
    await fixture.locator('.sds-timeline-item').first().evaluate((element) =>
      getComputedStyle(element, '::after').backgroundColor,
    ),
  ).toBe('rgb(16, 17, 18)')
  await expect(fixture.locator('.sds-badge')).toHaveCSS(
    'background-color',
    'rgb(19, 20, 21)',
  )
  await expect(fixture.locator('.sds-badge')).toHaveCSS(
    'color',
    'rgb(22, 23, 24)',
  )
  await expect(fixture.locator('.sds-datapoint strong')).toHaveCSS(
    'color',
    'rgb(25, 26, 27)',
  )
  await expect(fixture.locator('.sds-prose a')).toHaveCSS(
    'color',
    'rgb(25, 26, 27)',
  )
  await expect(fixture.locator('button')).toHaveCSS(
    'border-color',
    'rgb(28, 29, 30)',
  )
})
