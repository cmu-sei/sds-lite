import { expect, test } from '@playwright/test'

test('Escape cancels delayed popover opening and preserves Escape for its modal', async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => {
    const dialog = document.createElement('dialog')
    dialog.id = 'delayed-popover-dialog'
    dialog.className = 'sds-dialog'
    dialog.setAttribute('aria-label', 'Delayed popover')
    dialog.innerHTML = '<sds-popover><button type="button">Delayed details</button><section>Project details</section></sds-popover>'
    document.body.append(dialog)
    dialog.showModal()
  })
  const dialog = page.locator('#delayed-popover-dialog')
  const trigger = dialog.getByRole('button', { name: 'Delayed details', exact: true })
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.waitForTimeout(650)
  expect(await dialog.locator('section').evaluate(element => element.matches(':popover-open'))).toBe(false)
})

test('Escape cancels a pending popover while its trigger remains focused', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<sds-popover id="pending-popover"><button type="button">Pending details</button><section>Details</section></sds-popover>')
  })
  const popover = page.locator('#pending-popover')
  const trigger = popover.getByRole('button', { name: 'Pending details', exact: true })
  await trigger.focus()
  await trigger.press('Escape')
  await expect(trigger).toBeFocused()
  await page.waitForTimeout(650)
  expect(await popover.locator('section').evaluate(element => element.matches(':popover-open'))).toBe(false)
  await trigger.evaluate(element => element.blur())
  await trigger.focus()
  await expect(popover.locator('section')).toBeVisible()
})
test('tooltip sizes match the SEI Design System defaults', async ({ page }) => {
  await page.goto('/')

  const tooltip = page.locator('#structure sds-tooltip').first()
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

  const tooltip = page.locator('#structure sds-tooltip').first()
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