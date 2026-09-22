import { expect, test } from '@playwright/test'

test('secondary buttons retain a neutral border across tones', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const secondaryButtons = page.locator(
    '#actions article[aria-labelledby="button-variants-heading"] [data-sds-tone] [data-sds-variant="secondary"]',
  )
  const expectedBorder = await page.evaluate(() => {
    const probe = document.createElement('div')
    probe.style.border = '1px solid var(--sds-color-border-strong)'
    document.querySelector('[data-sds-root]')?.append(probe)
    const borderColor = getComputedStyle(probe).borderColor
    probe.remove()
    return borderColor
  })

  await expect(secondaryButtons).toHaveCount(6)
  for (const button of await secondaryButtons.all()) {
    await expect(button).toHaveCSS('border-color', expectedBorder)
  }

  const accentSecondary = secondaryButtons.nth(1)
  await accentSecondary.hover()
  await expect(accentSecondary).toHaveCSS('border-color', expectedBorder)
})

test('tertiary button borders match their text color across tones', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const tertiaryButtons = page.locator(
    '#actions article[aria-labelledby="button-variants-heading"] [data-sds-tone] [data-sds-variant="tertiary"]',
  )

  await expect(tertiaryButtons).toHaveCount(6)
  for (const button of await tertiaryButtons.all()) {
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
    },
    accent: {
      base: 'rgb(2, 102, 161)',
      hover: 'rgb(0, 124, 186)',
      ghostHover: 'rgb(240, 241, 241)',
    },
    danger: {
      base: 'rgb(196, 18, 48)',
      hover: 'rgb(224, 42, 58)',
      ghostHover: 'rgb(240, 241, 241)',
    },
  }

  for (const [tone, colors] of Object.entries(tones)) {
    const scope = page.locator(
      `#actions article[aria-labelledby="button-variants-heading"] [data-sds-tone="${tone}"]`,
    )
    const primary = scope.locator('button:not([data-sds-variant])')
    const secondary = scope.locator('[data-sds-variant="secondary"]')
    const tertiary = scope.locator('[data-sds-variant="tertiary"]')
    const ghost = scope.locator('[data-sds-variant="ghost"]')

    await expect(primary).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(primary).toHaveCSS('background-color', colors.base)
    await expect(primary).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
    await expect(secondary).toHaveCSS('color', colors.base)
    await expect(secondary).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await expect(secondary).toHaveCSS('border-color', 'rgb(116, 117, 120)')
    await expect(tertiary).toHaveCSS('color', colors.base)
    await expect(tertiary).toHaveCSS('border-color', colors.base)
    await expect(ghost).toHaveCSS('color', colors.base)

    await primary.hover()
    await expect(primary).toHaveCSS('background-color', colors.hover)
    await expect(primary).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
    await page.mouse.down()
    await expect(primary).toHaveCSS('background-color', colors.base)
    await page.mouse.up()
    await secondary.hover()
    await expect(secondary).toHaveCSS('color', colors.base)
    await expect(secondary).toHaveCSS('background-color', 'rgb(240, 241, 241)')
    await expect(secondary).toHaveCSS('border-color', 'rgb(116, 117, 120)')
    await page.mouse.down()
    await expect(secondary).toHaveCSS('background-color', 'rgb(225, 226, 227)')
    await page.mouse.up()
    await tertiary.hover()
    await expect(tertiary).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(tertiary).toHaveCSS('background-color', colors.hover)
    await expect(tertiary).toHaveCSS('border-color', colors.hover)
    await page.mouse.down()
    await expect(tertiary).toHaveCSS('background-color', colors.base)
    await expect(tertiary).toHaveCSS('border-color', colors.base)
    await page.mouse.up()
    await ghost.hover()
    await expect(ghost).toHaveCSS('color', colors.base)
    await expect(ghost).toHaveCSS('background-color', colors.ghostHover)
    await page.mouse.down()
    await expect(ghost).toHaveCSS('background-color', 'rgb(225, 226, 227)')
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
    },
    accent: {
      fill: 'rgb(0, 155, 217)',
      state: 'rgb(46, 177, 230)',
      text: 'rgb(46, 177, 230)',
      textHover: 'rgb(116, 203, 238)',
    },
    danger: {
      fill: 'rgb(239, 58, 71)',
      state: 'rgb(242, 106, 113)',
      text: 'rgb(242, 106, 113)',
      textHover: 'rgb(249, 161, 164)',
    },
  }

  for (const [tone, colors] of Object.entries(tones)) {
    const scope = page.locator(
      `#actions article[aria-labelledby="button-variants-heading"] [data-sds-tone="${tone}"]`,
    )
    const primary = scope.locator('button:not([data-sds-variant])')
    const secondary = scope.locator('[data-sds-variant="secondary"]')
    const tertiary = scope.locator('[data-sds-variant="tertiary"]')
    const ghost = scope.locator('[data-sds-variant="ghost"]')

    await expect(primary).toHaveCSS('color', 'rgb(0, 0, 0)')
    await expect(primary).toHaveCSS('background-color', colors.fill)
    await expect(primary).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)')
    await expect(secondary).toHaveCSS('color', colors.text)
    await expect(secondary).toHaveCSS('background-color', 'rgb(27, 28, 29)')
    await expect(secondary).toHaveCSS('border-color', 'rgb(116, 117, 120)')
    await expect(tertiary).toHaveCSS('color', colors.text)
    await expect(tertiary).toHaveCSS('border-color', colors.text)
    await expect(ghost).toHaveCSS('color', colors.text)

    await primary.hover()
    await expect(primary).toHaveCSS('background-color', colors.state)
    await page.mouse.down()
    await expect(primary).toHaveCSS('background-color', colors.fill)
    await page.mouse.up()
    await secondary.hover()
    await expect(secondary).toHaveCSS('color', colors.textHover)
    await expect(secondary).toHaveCSS('background-color', 'rgb(38, 39, 40)')
    await page.mouse.down()
    await expect(secondary).toHaveCSS('color', colors.text)
    await expect(secondary).toHaveCSS('background-color', 'rgb(27, 28, 29)')
    await page.mouse.up()
    await tertiary.hover()
    await expect(tertiary).toHaveCSS('color', 'rgb(0, 0, 0)')
    await expect(tertiary).toHaveCSS('background-color', colors.state)
    await page.mouse.down()
    await expect(tertiary).toHaveCSS('background-color', colors.fill)
    await expect(tertiary).toHaveCSS('border-color', colors.fill)
    await page.mouse.up()
    await ghost.hover()
    await expect(ghost).toHaveCSS('color', colors.textHover)
    await expect(ghost).toHaveCSS('background-color', translucent.hover)
    await page.mouse.down()
    await expect(ghost).toHaveCSS('background-color', translucent.active)
    await page.mouse.up()
  }
})
