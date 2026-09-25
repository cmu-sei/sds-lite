import { expect, test } from '@playwright/test'

test('fieldsets use theme-aware container borders and radii', async ({ page }) => {
  await page.goto('/')

  const fieldset = page.locator('fieldset').first()
  await expect(fieldset).toHaveCSS('border-width', '1px')
  await expect(fieldset).toHaveCSS('border-radius', '8px')

  await page.locator('[data-sds-root]').evaluate((root) => {
    root.setAttribute('data-sds-theme', 'plaid')
  })
  await expect(fieldset).toHaveCSS('border-width', '1px')
  await expect(fieldset).toHaveCSS('border-radius', '0px')
})