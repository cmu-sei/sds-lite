import { expect, test } from '@playwright/test'

test('compact primary buttons retain on-accent text', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root) => {
    root.insertAdjacentHTML(
      'afterbegin',
      '<a class="sds-button" href="#getting-started" data-sds-density="compact" data-sds-variant="filled" data-sds-tone="accent">Get started</a>',
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
    ).toEqual(['filled', 'tonal', 'outlined', 'text'])
  }
})

test('compact button content remains centered', async ({ page }) => {
  await page.goto('/')

  const buttons = page.locator(
    'article[aria-labelledby="compact-button-tones-heading"] button[data-sds-density="compact"]',
  )

  for (const button of await buttons.all()) {
    await expect(button).toHaveCSS('justify-content', 'center')
    await expect(button).toHaveCSS('text-align', 'center')
  }
})

test('compact button sizes use a consistent height scale', async ({ page }) => {
  await page.goto('/')

  await page.locator('[data-sds-root]').evaluate((root) => {
    root.insertAdjacentHTML(
      'afterbegin',
      `<div style="position: fixed; visibility: hidden">
        <button data-test-compact-size="xs" data-sds-size="xs" data-sds-density="compact">xs</button>
        <button data-test-compact-size="sm" data-sds-size="sm" data-sds-density="compact">sm</button>
        <button data-test-compact-size="md" data-sds-size="md" data-sds-density="compact">md</button>
        <button data-test-compact-size="lg" data-sds-size="lg" data-sds-density="compact">lg</button>
        <button data-test-compact-size="xl" data-sds-size="xl" data-sds-density="compact">xl</button>
      </div>`,
    )
  })

  const expectedHeights = {
    xs: '24px',
    sm: '28px',
    md: '32px',
    lg: '36px',
    xl: '40px',
  }

  for (const [size, height] of Object.entries(expectedHeights)) {
    const button = page.locator(`[data-test-compact-size="${size}"]`)
    await expect(button).toHaveCSS('block-size', height)
  }
})

test('compact tonal buttons stay borderless in light and dark modes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const scheme of ['light', 'dark']) {
    await page.locator('[data-sds-root]').evaluate((root, value) => {
      root.setAttribute('data-sds-color-scheme', value)
    }, scheme)
    for (const tone of ['neutral', 'accent', 'danger']) {
      const button = page.locator(
        `article[aria-labelledby="compact-button-tones-heading"] [data-sds-tone="${tone}"] [data-sds-variant="tonal"]`,
      )
      await expect(button).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
      await button.hover()
      await expect(button).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
      await page.mouse.down()
      await expect(button).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
      await page.mouse.up()
      await button.evaluate((element) => element.setAttribute('aria-disabled', 'true'))
      const disabled = await page.evaluate(() => {
        const probe = document.createElement('div')
        probe.style.borderColor = 'color-mix(in srgb, light-dark(var(--sds-gray-600), var(--sds-gray-400)) 10%, transparent)'
        document.querySelector('[data-sds-root]').append(probe)
        const result = getComputedStyle(probe).borderColor
        probe.remove()
        return result
      })
      await expect(button).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
      await button.evaluate((element) => element.removeAttribute('aria-disabled'))
    }
  }
})

test('button density and omitted tones preserve tone colors', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const properties = ['color', 'backgroundColor', 'borderColor']
  const tones = ['neutral', 'accent', 'info', 'success', 'warning', 'danger']
  const variants = ['filled', 'tonal', 'outlined', 'text']

  for (const tone of tones) {
    for (const variant of variants) {
      const comparedProperties = variant === 'tonal'
        ? ['color', 'backgroundColor']
        : properties
      const regularScope = page.locator(
        `article[aria-labelledby="button-variants-heading"] [data-sds-tone="${tone}"]`,
      )
      const compactScope = page.locator(
        `article[aria-labelledby="compact-button-tones-heading"] [data-sds-tone="${tone}"]`,
      )
      const regular =
        variant === 'filled'
          ? regularScope.locator('button:not([data-sds-variant])')
          : regularScope.locator(`[data-sds-variant="${variant}"]`)
      const compact = compactScope.locator(
        `[data-sds-variant="${variant}"]`,
      )
      const [regularColors, compactColors] = await Promise.all([
        regular.evaluate((element, names) => {
          const style = getComputedStyle(element)
          return names.map((name) => style[name])
        }, comparedProperties),
        compact.evaluate((element, names) => {
          const style = getComputedStyle(element)
          return names.map((name) => style[name])
        }, comparedProperties),
      ])

      expect(compactColors).toEqual(regularColors)
    }
  }

  await page.locator('[data-sds-root]').evaluate((root) => {
    const variants = ['filled', 'tonal', 'outlined', 'text']
    const markup = variants
      .flatMap((variant) =>
        ['', 'compact'].flatMap((density) =>
          ['', 'info'].map(
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
        `${selector}[data-test-default-tone="info"]`,
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
