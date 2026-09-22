import { expect, test } from '@playwright/test'

test('compact primary buttons retain on-accent text', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root) => {
    root.insertAdjacentHTML(
      'afterbegin',
      '<a class="sds-button" href="#getting-started" data-sds-density="compact" data-sds-variant="primary" data-sds-tone="accent">Get started</a>',
    )
  })

  const button = page.getByRole('link', { name: 'Get started' }).first()
  await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)')
})

test('catalog shows every compact button variant across tones', async ({
  page,
}) => {
  await page.goto('/')

  const matrix = page.locator(
    'article[aria-labelledby="compact-button-tones-heading"]',
  )
  const toneGroups = matrix.locator(':scope > .sds-grid > [data-sds-tone]')

  await expect(toneGroups).toHaveCount(6)
  for (const toneGroup of await toneGroups.all()) {
    const buttons = toneGroup.locator('button[data-sds-density="compact"]')
    await expect(buttons).toHaveCount(4)
    expect(
      await buttons.evaluateAll((elements) =>
        elements.map((element) => element.dataset.sdsVariant),
      ),
    ).toEqual(['primary', 'secondary', 'tertiary', 'ghost'])
  }
})

test('button density and omitted tones preserve tone colors', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const properties = ['color', 'backgroundColor', 'borderColor']
  const tones = ['neutral', 'accent', 'info', 'success', 'warning', 'danger']
  const variants = ['primary', 'secondary', 'tertiary', 'ghost']

  for (const tone of tones) {
    for (const variant of variants) {
      const regularScope = page.locator(
        `article[aria-labelledby="button-variants-heading"] [data-sds-tone="${tone}"]`,
      )
      const compactScope = page.locator(
        `article[aria-labelledby="compact-button-tones-heading"] [data-sds-tone="${tone}"]`,
      )
      const regular =
        variant === 'primary'
          ? regularScope.locator('button:not([data-sds-variant])')
          : regularScope.locator(`[data-sds-variant="${variant}"]`)
      const compact = compactScope.locator(
        `[data-sds-variant="${variant}"]`,
      )
      const [regularColors, compactColors] = await Promise.all([
        regular.evaluate((element, names) => {
          const style = getComputedStyle(element)
          return names.map((name) => style[name])
        }, properties),
        compact.evaluate((element, names) => {
          const style = getComputedStyle(element)
          return names.map((name) => style[name])
        }, properties),
      ])

      expect(compactColors).toEqual(regularColors)
    }
  }

  await page.locator('[data-sds-root]').evaluate((root) => {
    const variants = ['primary', 'secondary', 'tertiary', 'ghost']
    const markup = variants
      .flatMap((variant) =>
        ['', 'compact'].flatMap((density) =>
          ['', 'accent'].map(
            (tone) =>
              `<button type="button" data-test-default-tone="${tone || 'omitted'}" data-sds-variant="${variant}"${density ? ` data-sds-density="${density}"` : ''}${tone ? ` data-sds-tone="${tone}"` : ''}>Button</button>`,
          ),
        ),
      )
      .join('')
    root.insertAdjacentHTML(
      'afterbegin',
      `<div style="position: fixed; visibility: hidden">${markup}</div>`,
    )
  })

  for (const variant of variants) {
    for (const density of ['', 'compact']) {
      const selector = `[data-test-default-tone][data-sds-variant="${variant}"]${density ? `[data-sds-density="${density}"]` : ':not([data-sds-density])'}`
      const omitted = page.locator(
        `${selector}[data-test-default-tone="omitted"]`,
      )
      const explicit = page.locator(
        `${selector}[data-test-default-tone="accent"]`,
      )
      const [omittedColors, explicitColors] = await Promise.all([
        omitted.evaluate((element, names) => {
          const style = getComputedStyle(element)
          return names.map((name) => style[name])
        }, properties),
        explicit.evaluate((element, names) => {
          const style = getComputedStyle(element)
          return names.map((name) => style[name])
        }, properties),
      ])

      expect(omittedColors).toEqual(explicitColors)
    }
  }
})
