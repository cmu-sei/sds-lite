import { expect, test } from '@playwright/test'

test('interactive elements use one subtle focus ring', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const elements = [
    page.locator('#horizontal-input'),
    page.getByRole('button', { name: 'Primary', exact: true }).first(),
    page.locator('input[type="checkbox"]').first(),
    page.locator('.sds-link').first(),
    page.locator('.sds-disclosure > summary').first(),
  ]
  const styles = []

  for (const element of elements) {
    await element.focus()
    await page.waitForTimeout(50)
    styles.push(
      await element.evaluate((focusedElement) => {
        const style = getComputedStyle(focusedElement)
        return {
          boxShadow: style.boxShadow,
          focusColor: style.getPropertyValue('--sds-color-focus-ring').trim(),
          isFocusVisible: focusedElement.matches(':focus-visible'),
          outlineStyle: style.outlineStyle,
        }
      }),
    )
  }

  expect(styles[0].focusColor.replaceAll(/\s/g, '')).toBe(
    'light-dark(#2eb1e6,#034f8d)',
  )
  for (const style of styles) {
    expect(style.isFocusVisible).toBe(true)
    expect(style.outlineStyle).toBe('none')
    expect(style.boxShadow).not.toBe('none')
  }
  expect(styles.map(({ boxShadow }) => boxShadow)).toEqual(
    Array(styles.length).fill(styles[0].boxShadow),
  )
})

test('dropdown menu items use the hover treatment when focused', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const trigger = page.getByRole('button', { name: 'Secondary menu' })
  const items = page.locator('#secondary-menu [role="menuitem"]')
  await trigger.focus()
  await trigger.press('ArrowDown')

  await items.nth(1).hover()
  await page.waitForTimeout(50)
  const hoverBackground = await items
    .nth(1)
    .evaluate((item) => getComputedStyle(item).backgroundColor)

  await items.first().focus()
  await page.waitForTimeout(50)
  const focusStyle = await items.first().evaluate((item) => {
    const style = getComputedStyle(item)
    return {
      background: style.backgroundColor,
      boxShadow: style.boxShadow,
    }
  })

  expect(focusStyle.background).toBe(hoverBackground)
  expect(focusStyle.boxShadow).toBe('none')
})
