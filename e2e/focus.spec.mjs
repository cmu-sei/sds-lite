import { expect, test } from '@playwright/test'

test('focusable controls share the design-system focus colors in both schemes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root) => {
    root.insertAdjacentHTML(
      'afterbegin',
      '<input id="standalone-file" type="file">',
    )
  })
  const focusColor = await page.locator('[data-sds-root]').evaluate((root) =>
    getComputedStyle(root).getPropertyValue('--sds-color-focus-ring').trim(),
  )
  expect(focusColor.replaceAll(/\s/g, '')).toBe(
    'light-dark(#2eb1e6,#034f8d)',
  )

  const fields = [
    '#actions button[type="button"]',
    '.sds-link',
    '.sds-disclosure > summary',
    '#text-input',
    '#horizontal-input',
    '#textarea-input',
    '#select-input',
    '#theme',
    '.sds-choice input[type="checkbox"]:not(:checked):not(:disabled)',
    '.sds-choice input[type="radio"]:not(:checked):not(:disabled)',
    '.sds-switch input[role="switch"]:not(:disabled)',
    '#record-picker > input',
    '#standalone-file',
    '#file-input',
  ]

  for (const theme of ['forge', 'plaid']) {
    for (const [scheme, color] of [
      ['light', 'rgb(46, 177, 230)'],
      ['dark', 'rgb(3, 79, 141)'],
    ]) {
      await page.locator('[data-sds-root]').evaluate(
        (root, { theme, scheme }) => {
          root.setAttribute('data-sds-theme', theme)
          root.setAttribute('data-sds-color-scheme', scheme)
        },
        { theme, scheme },
      )

      for (const selector of fields) {
        const field = page.locator(selector).first()
        await field.focus()
        await page.waitForTimeout(50)
        const style = await field.evaluate((element) => {
          const computed = getComputedStyle(element)
          return {
            focusVisible: element.matches(':focus-visible'),
            boxShadow: computed.boxShadow,
            outlineStyle: computed.outlineStyle,
          }
        })
        expect(style.focusVisible, selector).toBe(true)
        expect(style.outlineStyle, selector).toBe('none')
        expect(style.boxShadow, selector).toContain(color)
        expect(style.boxShadow, selector).toContain('2px')
        if (selector === '#file-input') {
          const uploadShadow = await page
            .locator('.sds-file-upload')
            .first()
            .evaluate((element) => getComputedStyle(element).boxShadow)
          expect(uploadShadow).toContain(color)
        }
      }
    }
  }
})

test('dropdown menu items retain hover treatment and show the shared focus ring', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const trigger = page.getByRole('button', { name: 'Secondary menu' })
  const items = page.locator('#secondary-menu [role="menuitem"]')
  await trigger.focus()
  await trigger.press('ArrowDown')

  await items.nth(1).hover()
  await expect(items.nth(1)).toHaveCSS(
    'background-color',
    'rgb(240, 241, 241)',
  )
  const hoverBackground = await items
    .nth(1)
    .evaluate((item) => getComputedStyle(item).backgroundColor)

  await items.first().focus()
  await expect(items.first()).toHaveCSS('background-color', hoverBackground)
  const focusStyle = await items.first().evaluate((item) => {
    const style = getComputedStyle(item)
    return {
      background: style.backgroundColor,
      boxShadow: style.boxShadow,
    }
  })

  expect(focusStyle.background).toBe(hoverBackground)
  expect(focusStyle.boxShadow).toContain('rgb(46, 177, 230)')

  await page.locator('[data-sds-root]').evaluate((root) => {
    root.setAttribute('data-sds-color-scheme', 'dark')
  })
  expect(
    await items.first().evaluate((item) => getComputedStyle(item).boxShadow),
  ).toContain('rgb(3, 79, 141)')
})
