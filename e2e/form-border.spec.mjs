import { expect, test } from '@playwright/test'

test('form-control borders match the design-system palette in both themes and schemes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root) => {
    root.insertAdjacentHTML('afterbegin', '<input id="standalone-file" type="file">')
  })

  const colors = {
    forge: { light: 'rgb(116, 117, 120)', dark: 'rgb(136, 137, 141)' },
    plaid: { light: 'rgb(119, 117, 116)', dark: 'rgb(146, 145, 144)' },
  }
  const selectors = [
    '#text-input',
    '#horizontal-input',
    '#select-input',
    '#textarea-input',
    '#standalone-file',
    '.sds-choice input[type="checkbox"]:not(:checked):not(:disabled)',
    '.sds-choice input[type="radio"]:not(:checked):not(:disabled)',
    '.sds-choice input[type="checkbox"]:disabled',
    '.sds-choice input[type="radio"]:disabled',
  ]

  for (const [theme, schemes] of Object.entries(colors)) {
    for (const [scheme, color] of Object.entries(schemes)) {
      await page.locator('[data-sds-root]').evaluate(
        (root, { theme, scheme }) => {
          root.setAttribute('data-sds-theme', theme)
          root.setAttribute('data-sds-color-scheme', scheme)
        },
        { theme, scheme },
      )

      for (const selector of selectors) {
        await expect
          .poll(
            () =>
              page
                .locator(selector)
                .first()
                .evaluate((element) => getComputedStyle(element).borderColor),
            { message: `${theme} ${scheme}: ${selector}` },
          )
          .toBe(color)
      }

      await expect
        .poll(() =>
          page.locator('#invalid-input').evaluate((element) =>
            getComputedStyle(element).borderColor,
          ),
        )
        .toBe(scheme === 'light' ? 'rgb(224, 42, 58)' : 'rgb(242, 106, 113)')
    }
  }
})
