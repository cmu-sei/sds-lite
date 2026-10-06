import { expect, test } from '@playwright/test'

const tones = {
  neutral: {
    medium: 'rgb(116, 117, 120)',
    light: 'rgb(225, 226, 227)',
    text: 'rgb(68, 69, 71)',
    mediumBorder: 'rgb(116, 117, 120)',
  },
  accent: {
    medium: 'rgb(186, 75, 147)',
    light: 'rgb(248, 236, 244)',
    text: 'rgb(128, 0, 84)',
    mediumBorder: 'rgb(186, 75, 147)',
  },
  info: {
    medium: 'rgb(0, 124, 186)',
    light: 'rgb(238, 249, 253)',
    text: 'rgb(3, 79, 141)',
    mediumBorder: 'rgb(0, 124, 186)',
  },
  success: {
    medium: 'rgb(0, 135, 64)',
    light: 'rgb(226, 248, 235)',
    text: 'rgb(0, 85, 40)',
    mediumBorder: 'rgb(0, 135, 64)',
  },
  warning: {
    medium: 'rgb(253, 181, 21)',
    light: 'rgb(255, 243, 214)',
    text: 'rgb(40, 16, 4)',
    mediumText: 'rgb(71, 36, 7)',
    mediumBorder: 'rgb(253, 181, 21)',
  },
  danger: {
    medium: 'rgb(224, 42, 58)',
    light: 'rgb(255, 245, 245)',
    text: 'rgb(196, 18, 48)',
    mediumBorder: 'rgb(224, 42, 58)',
  },
}

test('badges use the supported tone palette', async ({ page }) => {
  await page.goto('/')

  for (const [tone, colors] of Object.entries(tones)) {
    const group = page.locator(
      `[role="group"][aria-label="${tone[0].toUpperCase()}${tone.slice(1)} badge variants"]`,
    )
    const light = group.locator('[data-sds-variant="light"]')
    const lightBorder = group.locator('[data-sds-variant="light-border"]')
    const medium = group.locator('.sds-badge:not([data-sds-variant])')

    await expect(medium).toHaveCSS('background-color', colors.medium)
    await expect(medium).toHaveCSS('border-color', colors.mediumBorder)
    if (colors.mediumText) {
      await expect(medium).toHaveCSS('color', colors.mediumText)
    }
    await expect(light).toHaveCSS('background-color', colors.light)
    await expect(light).toHaveCSS('border-color', colors.light)
    await expect(light).toHaveCSS('color', colors.text)
    await expect(lightBorder).toHaveCSS('background-color', colors.light)
    await expect(lightBorder).toHaveCSS('color', colors.text)
  }
})

test('dark medium badges use the reference contrast colors', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root) => {
    root.setAttribute('data-sds-color-scheme', 'dark')
  })

  const mediumColors = {
    Neutral: 'rgb(136, 137, 141)',
    Accent: 'rgb(186, 75, 147)',
    Info: 'rgb(0, 124, 186)',
    Success: 'rgb(0, 135, 64)',
    Warning: 'rgb(253, 181, 21)',
    Danger: 'rgb(224, 42, 58)',
  }

  for (const [tone, background] of Object.entries(mediumColors)) {
    const badge = page
      .locator(`[role="group"][aria-label="${tone} badge variants"]`)
      .locator('.sds-badge:not([data-sds-variant])')
    await expect(badge).toHaveCSS('background-color', background)
    await expect(badge).toHaveCSS('color', 'rgb(0, 0, 0)')
  }
})

test('small badges fit inline content more tightly', async ({ page }) => {
  await page.goto('/')

  const badge = page.locator('#default-feedback-tones p .sds-badge').first()
  await badge.evaluate((element) => element.setAttribute('data-sds-size', 'md'))
  await expect(badge).toHaveCSS('font-size', '12px')
  await badge.evaluate((element) => element.setAttribute('data-sds-size', 'sm'))
  await expect(badge).toHaveCSS('font-size', '11px')
  await expect(badge).toHaveCSS('block-size', '18px')
  await expect(badge).toHaveCSS('padding-inline', '8px')
  await expect(badge).toHaveCSS('vertical-align', '1.98px')

  for (const fontFamily of ['', 'serif', 'sans-serif']) {
    const alignment = await badge.evaluate((element, family) => {
      const paragraph = element.parentElement
      paragraph.style.fontFamily = family
      const raisedOffset =
        element.getBoundingClientRect().top - paragraph.getBoundingClientRect().top
      const originalAlignment = element.style.verticalAlign
      element.style.verticalAlign = 'baseline'
      const baselineOffset =
        element.getBoundingClientRect().top - paragraph.getBoundingClientRect().top
      element.style.verticalAlign = originalAlignment
      return baselineOffset - raisedOffset
    }, fontFamily)
    expect(alignment, `baseline offset with ${fontFamily || 'default'} font`).toBeCloseTo(1.98, 1)
  }
})

test('linked badges use tone-aware hover styling', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root) => {
    root.insertAdjacentHTML(
      'afterbegin',
      `<div>
        <a class="sds-badge" data-test-linked-badge="light" data-sds-tone="accent" data-sds-variant="light" href="/projects/atlas">Light</a>
        <a class="sds-badge" data-test-linked-badge="light-border" data-sds-tone="success" data-sds-variant="light-border" href="/projects/atlas">Light border</a>
        <a class="sds-badge" data-test-linked-badge="medium" data-sds-tone="warning" href="/projects/atlas">Medium</a>
        <a class="sds-badge" data-test-linked-badge="dark" data-sds-tone="danger" data-sds-variant="dark" href="/projects/atlas">Dark</a>
      </div>`,
    )
  })

  for (const variant of ['light', 'light-border', 'medium', 'dark']) {
    const badge = page.locator(`[data-test-linked-badge="${variant}"]`)
    const initialBackground = await badge.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    )
    await expect(badge).toHaveCSS('cursor', 'pointer')
    await badge.hover()
    await expect(badge).not.toHaveCSS('background-color', initialBackground)
    if (variant === 'medium') {
      await expect(badge).toHaveCSS('background-color', 'rgb(255, 204, 91)')
    }
  }
})