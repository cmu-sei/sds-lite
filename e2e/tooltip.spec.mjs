import { expect, test } from '@playwright/test'

test('tooltip sizes match the SEI Design System defaults', async ({ page }) => {
  await page.goto('/')

  const tooltip = page.locator('sds-tooltip').first()
  const content = tooltip.locator('.sds-tooltip-content')

  await expect(tooltip).toHaveJSProperty('size', 'sm')

  for (const [size, width] of [
    ['sm', '128px'],
    ['md', '192px'],
    ['lg', '224px'],
    ['xl', '288px'],
  ]) {
    await tooltip.evaluate((element, value) => {
      element.setAttribute('size', value)
    }, size)
    await expect(content).toHaveCSS('width', width)
  }
})

test('dark tooltips remain readable in both color schemes', async ({ page }) => {
  await page.goto('/')

  const tooltip = page.locator('sds-tooltip').first()
  const content = tooltip.locator('.sds-tooltip-content')
  await tooltip.locator('button').hover()

  for (const scheme of ['light', 'dark']) {
    await page.locator('[data-sds-root]').evaluate((root, scheme) => {
      root.setAttribute('data-sds-color-scheme', scheme)
    }, scheme)
    await expect(content).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    await expect(content).toHaveCSS('color', 'rgb(240, 241, 241)')
    await expect(content).toHaveCSS('border-top-color', 'rgb(48, 49, 50)')
  }
})