import { expect, test } from '@playwright/test'

test('tonal buttons use the selected tone surface', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const tonalButtons = page.locator(
    '#actions article[aria-labelledby="button-variants-heading"] [data-sds-tone] [data-sds-variant="tonal"]',
  )

  await expect(tonalButtons).toHaveCount(6)
  for (const button of await tonalButtons.all()) {
    await expect(button).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
  }

  const accentTonal = tonalButtons.nth(1)
  await accentTonal.hover()
  await expect(accentTonal).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
})

test('action-bar buttons remain readable on the action surface', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByText('Application shell preview', { exact: true }).click()

  const discard = page
    .locator('.sds-app-action-bar')
    .first()
    .getByRole('button', { name: 'Discard' })
  await page.locator('.sds-app-action-bar').first().evaluate((bar) => {
    bar.insertAdjacentHTML(
      'beforeend',
      '<button type="button" data-sds-variant="tonal">Tonal</button><button type="button" data-sds-variant="text">Text</button>',
    )
  })
  const actionBar = page.locator('.sds-app-action-bar').first()
  const tonal = actionBar.getByRole('button', { name: 'Tonal' })
  const text = actionBar.getByRole('button', { name: 'Text' })

  for (const scheme of ['light', 'dark']) {
    await page.mouse.move(0, 0)
    await page.locator('[data-sds-root]').evaluate((root, scheme) => {
      root.setAttribute('data-sds-color-scheme', scheme)
    }, scheme)

    await expect(discard).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(discard).toHaveCSS('border-top-color', 'rgb(255, 255, 255)')
    await expect(discard).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(tonal).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(tonal).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(tonal).not.toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await expect(text).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(text).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await text.hover()
    await expect(text).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(text).not.toHaveCSS('background-color', 'rgb(255, 255, 255)')
  }
})

test('outlined button borders match their text color across tones', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const outlinedButtons = page.locator(
    '#actions article[aria-labelledby="button-variants-heading"] [data-sds-tone] [data-sds-variant="outlined"]',
  )

  await expect(outlinedButtons).toHaveCount(6)
  for (const button of await outlinedButtons.all()) {
    const colors = await button.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        border: style.borderColor,
        text: style.color,
      }
    })
    expect(colors.border).toBe(colors.text)
  }
})

test('button tones match the SEI Design System color matrix', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const tones = {
    neutral: {
      base: 'rgb(48, 49, 50)',
      hover: 'rgb(68, 69, 71)',
      ghostHover: 'rgb(225, 226, 227)',
      tonalSurface: 'rgb(225, 226, 227)',
    },
    accent: {
      base: 'rgb(2, 102, 161)',
      hover: 'rgb(0, 124, 186)',
      ghostHover: 'rgb(240, 241, 241)',
      tonalSurface: 'rgb(238, 249, 253)',
    },
    danger: {
      base: 'rgb(196, 18, 48)',
      hover: 'rgb(224, 42, 58)',
      ghostHover: 'rgb(240, 241, 241)',
      tonalSurface: 'rgb(255, 245, 245)',
    },
  }

  for (const [tone, colors] of Object.entries(tones)) {
    const scope = page.locator(
      `#actions article[aria-labelledby="button-variants-heading"] [data-sds-tone="${tone}"]`,
    )
    const primary = scope.locator('button:not([data-sds-variant])')
    const tonal = scope.locator('[data-sds-variant="tonal"]')
    const outlined = scope.locator('[data-sds-variant="outlined"]')
    const text = scope.locator('[data-sds-variant="text"]')

    await expect(primary).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(primary).toHaveCSS('background-color', colors.base)
    await expect(primary).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
    await expect(tonal).toHaveCSS('color', colors.base)
    await expect(tonal).toHaveCSS('background-color', colors.tonalSurface)
    await expect(tonal).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
    await expect(outlined).toHaveCSS('color', colors.base)
    await expect(outlined).toHaveCSS('border-color', colors.base)
    await expect(text).toHaveCSS('color', colors.base)

    await primary.hover()
    await expect(primary).toHaveCSS('background-color', colors.hover)
    await expect(primary).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
    await page.mouse.down()
    await expect(primary).toHaveCSS('background-color', colors.base)
    await page.mouse.up()
    await tonal.hover()
    await expect(tonal).toHaveCSS('color', colors.base)
    await expect(tonal).not.toHaveCSS('background-color', colors.tonalSurface)
    await expect(tonal).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
    await page.mouse.down()
    await expect(tonal).not.toHaveCSS('background-color', colors.tonalSurface)
    await page.mouse.up()
    await outlined.hover()
    await expect(outlined).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(outlined).toHaveCSS('background-color', colors.hover)
    await expect(outlined).toHaveCSS('border-color', colors.hover)
    await page.mouse.down()
    await expect(outlined).toHaveCSS('background-color', colors.base)
    await expect(outlined).toHaveCSS('border-color', colors.base)
    await page.mouse.up()
    await text.hover()
    await expect(text).toHaveCSS('color', colors.base)
    await expect(text).toHaveCSS('background-color', colors.ghostHover)
    await page.mouse.down()
    await expect(text).toHaveCSS('background-color', 'rgb(225, 226, 227)')
    await page.mouse.up()
  }
})

test('button tones match the SEI Design System dark color matrix', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root) => {
    root.setAttribute('data-sds-color-scheme', 'dark')
  })

  const translucent = await page.evaluate(() => {
    const compute = (color) => {
      const probe = document.createElement('div')
      probe.style.background = `color-mix(in srgb, ${color} 40%, transparent)`
      document.body.append(probe)
      const computed = getComputedStyle(probe).backgroundColor
      probe.remove()
      return computed
    }
    return {
      active: compute('#303132'),
      hover: compute('#444547'),
    }
  })

  const tones = {
    neutral: {
      fill: 'rgb(136, 137, 141)',
      state: 'rgb(166, 167, 170)',
      text: 'rgb(166, 167, 170)',
      textHover: 'rgb(188, 190, 192)',
      tonalSurface: 'rgb(48, 49, 50)',
    },
    accent: {
      fill: 'rgb(0, 155, 217)',
      state: 'rgb(46, 177, 230)',
      text: 'rgb(46, 177, 230)',
      textHover: 'rgb(116, 203, 238)',
      tonalSurface: 'rgb(2, 27, 58)',
    },
    danger: {
      fill: 'rgb(239, 58, 71)',
      state: 'rgb(242, 106, 113)',
      text: 'rgb(242, 106, 113)',
      textHover: 'rgb(249, 161, 164)',
      tonalSurface: 'rgb(49, 5, 12)',
    },
  }

  for (const [tone, colors] of Object.entries(tones)) {
    const scope = page.locator(
      `#actions article[aria-labelledby="button-variants-heading"] [data-sds-tone="${tone}"]`,
    )
    const primary = scope.locator('button:not([data-sds-variant])')
    const tonal = scope.locator('[data-sds-variant="tonal"]')
    const outlined = scope.locator('[data-sds-variant="outlined"]')
    const text = scope.locator('[data-sds-variant="text"]')

    await expect(primary).toHaveCSS('color', 'rgb(0, 0, 0)')
    await expect(primary).toHaveCSS('background-color', colors.fill)
    await expect(primary).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
    await expect(tonal).toHaveCSS('color', colors.text)
    await expect(tonal).toHaveCSS('background-color', colors.tonalSurface)
    await expect(tonal).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
    await expect(outlined).toHaveCSS('color', colors.text)
    await expect(outlined).toHaveCSS('border-color', colors.text)
    await expect(text).toHaveCSS('color', colors.text)

    await primary.hover()
    await expect(primary).toHaveCSS('background-color', colors.state)
    await page.mouse.down()
    await expect(primary).toHaveCSS('background-color', colors.fill)
    await page.mouse.up()
    await tonal.hover()
    await expect(tonal).toHaveCSS('color', colors.textHover)
    await expect(tonal).not.toHaveCSS('background-color', colors.tonalSurface)
    await page.mouse.down()
    await expect(tonal).toHaveCSS('color', colors.text)
    await expect(tonal).not.toHaveCSS('background-color', colors.tonalSurface)
    await page.mouse.up()
    await outlined.hover()
    await expect(outlined).toHaveCSS('color', 'rgb(0, 0, 0)')
    await expect(outlined).toHaveCSS('background-color', colors.state)
    await page.mouse.down()
    await expect(outlined).toHaveCSS('background-color', colors.fill)
    await expect(outlined).toHaveCSS('border-color', colors.fill)
    await page.mouse.up()
    await text.hover()
    await expect(text).toHaveCSS('color', colors.textHover)
    await expect(text).toHaveCSS('background-color', translucent.hover)
    await page.mouse.down()
    await expect(text).toHaveCSS('background-color', translucent.active)
    await page.mouse.up()
  }
})
