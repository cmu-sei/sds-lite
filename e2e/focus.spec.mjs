import { expect, test } from '@playwright/test'

const fields = [
  '#default-action-tones button[type="button"]',
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
  'a.sds-tag',
  'button.sds-tag',
  '.sds-tag-action',
]

test('dropdown navigation excludes hidden and inert items while retaining ARIA-disabled items', async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', `
      <sds-dropdown id="filtered-menu">
        <button type="button">Filtered actions</button>
        <menu>
          <li hidden><button>Hidden group</button></li>
          <li><button>First action</button></li>
          <li><button hidden>Hidden button</button></li>
          <li><a hidden href="#hidden">Hidden link</a></li>
          <li inert><button>Inert action</button></li>
          <li><button disabled>Disabled action</button></li>
          <li><button aria-disabled="true">Unavailable action</button></li>
          <li><button>Last action</button></li>
        </menu>
      </sds-dropdown>
    `)
  })
  const dropdown = page.locator('#filtered-menu')
  const trigger = dropdown.locator(':scope > button')
  await trigger.focus()
  await trigger.press('ArrowDown')
  for (const name of ['Hidden group', 'Hidden button', 'Hidden link']) {
    await expect(dropdown.getByText(name, { exact: true })).toBeHidden()
  }
  await expect(dropdown.getByRole('menuitem', { name: 'First action', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  const unavailable = dropdown.getByRole('menuitem', { name: 'Unavailable action', exact: true })
  await expect(unavailable).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('ArrowDown')
  await expect(dropdown.getByRole('menuitem', { name: 'Last action', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(dropdown.getByRole('menuitem', { name: 'First action', exact: true })).toBeFocused()
  await page.keyboard.press('End')
  await expect(dropdown.getByRole('menuitem', { name: 'Last action', exact: true })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(dropdown.getByRole('menuitem', { name: 'First action', exact: true })).toBeFocused()
})

test('ArrowUp opens a dropdown at its current last item after dynamic changes', async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const trigger = page.getByRole('button', { name: 'Secondary menu' })
  const menu = page.locator('#secondary-menu')
  await menu.evaluate(element => {
    element.insertAdjacentHTML('beforeend', '<li><button type="button">New action</button></li>')
  })
  await trigger.focus()
  await trigger.press('ArrowUp')
  await expect(menu.getByRole('menuitem', { name: 'New action', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await menu.getByRole('menuitem', { name: 'New action', exact: true, includeHidden: true }).evaluate(element => element.closest('li').remove())
  await trigger.press('ArrowUp')
  await expect(menu.locator('[role="menuitem"]').last()).toBeFocused()
})

for (const theme of ['forge', 'plaid']) {
  for (const [scheme, color] of [
    ['light', 'rgb(46, 177, 230)'],
    ['dark', 'rgb(3, 79, 141)'],
  ]) {
    test(`focusable controls share the design-system focus color in ${theme} ${scheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      await page.locator('[data-sds-root]').evaluate((root) => {
        root.insertAdjacentHTML(
          'afterbegin',
          '<input class="sds-file-input" id="standalone-file" type="file">',
        )
      })
      const focusColor = await page.locator('[data-sds-root]').evaluate((root) =>
        getComputedStyle(root).getPropertyValue('--sds-color-focus-ring').trim(),
      )
      expect(focusColor.replaceAll(/\s/g, '')).toBe(
        'light-dark(#2eb1e6,#034f8d)',
      )

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
        await expect
          .poll(
            () =>
              field.evaluate((element, expectedColor) => {
                const boxShadow = getComputedStyle(element).boxShadow
                return (
                  boxShadow.includes(expectedColor) && boxShadow.includes('2px')
                )
              }, color),
            { message: selector },
          )
          .toBe(true)
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
          await expect
            .poll(
              () =>
                page
                  .locator('.sds-file-upload')
                  .first()
                  .evaluate((element) => getComputedStyle(element).boxShadow),
              { message: '.sds-file-upload' },
            )
            .toContain(color)
        }
      }
    })
  }
}

test('linked tag labels show the shared focus ring on their tag', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const label = page.locator('.sds-tag-label[href]').first()
  const tag = label.locator('..')

  await label.focus()

  await expect(label).toBeFocused()
  await expect(tag).toHaveCSS(
    'box-shadow',
    'rgb(46, 177, 230) 0px 0px 0px 2px',
  )
})

test('dropdown menu items retain hover treatment and show the shared focus ring', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const trigger = page.getByRole('button', { name: 'Secondary menu' })
  const items = page.locator('#secondary-menu [role="menuitem"]')
  await trigger.scrollIntoViewIfNeeded()
  await expect(trigger).toBeInViewport({ ratio: 1 })
  await trigger.focus()
  await trigger.press('ArrowDown')

  await expect(items.first()).toBeFocused()
  await expect(items.nth(1)).toBeInViewport({ ratio: 1 })
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
