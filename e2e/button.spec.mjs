import { expect, test } from '@playwright/test'

test('secondary buttons retain a neutral border across tones', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const secondaryButtons = page.locator(
    '.demo-tone-matrix [data-sds-variant="secondary"]',
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
