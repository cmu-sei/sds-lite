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