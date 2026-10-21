import { expect, test } from '@playwright/test'

async function renderRecipe(page, markup) {
  await page.goto('about:blank')
  await page.setContent(`<!doctype html>${markup}`)
  await page.addStyleTag({ path: 'dist/sds.css' })
  await page.evaluate(() => document.fonts.ready)
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
})

for (const control of ['input', 'select', 'textarea']) {
  test(`input groups provide one surface for ${control}, affixes, and embedded actions`, async ({ page }) => {
    const markup = control === 'input'
      ? '<input id="value" class="sds-input" data-sds-size="lg" name="value" value="10">'
      : control === 'select'
        ? '<select id="value" class="sds-select" data-sds-size="lg" name="value"><option>10</option></select>'
        : '<textarea id="value" class="sds-input" data-sds-size="lg" name="value" rows="3">10</textarea>'
    await renderRecipe(page, `
      <form data-sds-root style="width: 280px">
        <label for="value">Amount in dollars</label>
        <div class="sds-input-group" data-sds-size="sm">
          <span class="sds-input-addon" aria-hidden="true">$</span>
          ${markup}
          <button class="sds-button" type="button" aria-label="Clear amount">Clear</button>
        </div>
      </form>
    `)
    const group = page.locator('.sds-input-group')
    const field = page.locator('#value')
    await expect(group).toHaveCSS('border-top-width', '1px')
    await expect(field).toHaveCSS('border-top-width', '0px')
    await expect(field).toHaveCSS('font-size', '14px')
    await expect(field).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(group.locator('.sds-input-addon')).toHaveCSS('border-right-width', '1px')
    await expect(group.locator('button')).toHaveCSS('height', '24px')
    await expect(group.locator('button')).toHaveCSS('border-top-width', '0px')
    const height = (await group.boundingBox()).height
    if (control === 'textarea') expect(height).toBeGreaterThan(32)
    else expect(height).toBe(32)
    await field.focus()
    await expect(group).not.toHaveCSS('box-shadow', 'none')
    await expect(field).toHaveCSS('box-shadow', 'none')
    await group.locator('button').focus()
    await expect(group.locator('button')).not.toHaveCSS('box-shadow', 'none')
    expect(await page.locator('form').evaluate(form => new FormData(form).get('value'))).toBe('10')
    await field.evaluate(element => element.setAttribute('aria-invalid', 'true'))
    const invalidBorder = await field.evaluate(element => {
      const reference = document.createElement('span')
      reference.style.color = 'var(--sds-color-form-invalid)'
      element.after(reference)
      const color = getComputedStyle(reference).color
      reference.remove()
      return color
    })
    await expect(group).toHaveCSS('border-top-color', invalidBorder)
    await page.emulateMedia({ forcedColors: 'active' })
    await field.focus()
    await expect(group).toHaveCSS('outline-style', 'solid')
    await expect(group).toHaveCSS('outline-offset', '2px')
  })
}

for (const scheme of ['light', 'dark']) {
  test(`input-group actions keep neutral interaction states in ${scheme} mode`, async ({ page }) => {
    await renderRecipe(page, `
      <div data-sds-root data-sds-color-scheme="${scheme}" style="width: 480px">
        <div class="sds-input-group">
          <input class="sds-input" aria-label="Search">
          <button class="sds-button" type="button">Clear</button>
          <button class="sds-button" type="button" data-sds-shape="icon" aria-label="Show password">+</button>
          <button class="sds-button" type="button" data-sds-variant="text">Copy</button>
          <button class="sds-button" type="button" disabled>Disabled</button>
          <button class="sds-button" type="button" aria-disabled="true">Unavailable</button>
        </div>
        <button class="sds-button" type="button">Standalone</button>
      </div>
    `)
    for (const action of await page.locator('.sds-input-group > button:not(:disabled, [aria-disabled="true"])').all()) {
      const expected = await action.evaluate(element => {
        const reference = document.createElement('span')
        reference.style.color = 'var(--sds-color-text-default)'
        reference.style.backgroundColor = 'var(--sds-button-ghost-active)'
        element.append(reference)
        const color = getComputedStyle(reference).color
        const active = getComputedStyle(reference).backgroundColor
        reference.style.backgroundColor = 'var(--sds-color-interactive-subtle-hover)'
        const hover = getComputedStyle(reference).backgroundColor
        reference.remove()
        return { color, active, hover }
      })
      await action.hover()
      await expect(action).toHaveCSS('background-color', expected.hover)
      await expect(action).toHaveCSS('color', expected.color)
      await page.mouse.down()
      await expect(action).toHaveCSS('background-color', expected.active)
      await expect(action).toHaveCSS('color', expected.color)
      await page.mouse.up()
      await page.mouse.move(600, 500)
      await action.focus()
      await page.keyboard.down('Space')
      const keyboardActive = await action.evaluate(element => element.matches(':active'))
      await expect(action).toHaveCSS('background-color', keyboardActive ? expected.active : 'rgba(0, 0, 0, 0)')
      await expect(action).toBeFocused()
      await page.keyboard.up('Space')
      await expect(action).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    }
    for (const action of await page.locator('.sds-input-group > button:is(:disabled, [aria-disabled="true"])').all()) {
      const bounds = await action.boundingBox()
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      const background = await action.evaluate(element => getComputedStyle(element).backgroundColor)
      await page.mouse.down()
      await expect(action).toHaveCSS('background-color', background)
      await page.mouse.up()
    }
    const standalone = page.getByRole('button', { name: 'Standalone', exact: true })
    const background = await standalone.evaluate(element => getComputedStyle(element).backgroundColor)
    await standalone.hover()
    await page.mouse.down()
    await expect(standalone).toHaveCSS('background-color', background)
    await page.mouse.up()
  })
}

test('pressed buttons and chips retain distinct keyboard focus in normal and forced colors', async ({ page }) => {
  for (const forcedColors of ['none', 'active']) {
    await page.emulateMedia({ forcedColors })
    for (const name of ['Show archived', 'Favorites']) {
      const control = page.locator('#selection-example').getByRole('button', { name, exact: true })
      await control.evaluate(element => element.setAttribute('aria-pressed', 'true'))
      await control.focus()
      if (forcedColors === 'active') {
        await expect(control).toHaveCSS('outline-style', 'solid')
        await expect(control).toHaveCSS('outline-offset', '2px')
      } else {
        await expect(control).toHaveCSS('box-shadow', /0px 0px 0px 2px/)
      }
      await control.press('Tab')
      await expect(control).not.toBeFocused()
      if (forcedColors === 'active') await expect(control).toHaveCSS('outline-offset', '-4px')
      else await expect(control).toHaveCSS('box-shadow', /inset/)
    }
  }
})

test('embedded actions keep their field size inside toolbars and with icon-button attributes', async ({ page }) => {
  const field = page.locator('#input-actions-example .sds-input-group').first()
  await field.evaluate(element => {
    element.parentElement.classList.add('sds-table-toolbar')
    element.querySelector('button').dataset.sdsShape = 'icon'
  })
  for (const [size, action, icon] of [['sm', 24, 16], ['md', 32, 18], ['lg', 40, 20]]) {
    await field.evaluate((element, size) => { element.dataset.sdsSize = size }, size)
    await expect(field.locator('button')).toHaveCSS('height', `${action}px`)
    await expect(field.locator('button')).toHaveCSS('width', `${action}px`)
    await expect(field.locator('svg')).toHaveCSS('width', `${icon}px`)
  }
})

test('multiple selection supports consecutive choices without losing focus', async ({ page }) => {
  const form = page.locator('#multiple-selection-example')
  const query = form.getByRole('combobox')
  await query.scrollIntoViewIfNeeded()
  await query.fill('Eng')
  await form.getByRole('option', { name: 'Engineering', exact: true }).click()
  await expect(query).toHaveValue('')
  await query.press('ArrowDown')
  await expect(form.getByRole('option', { name: 'Accessibility', exact: true })).toBeVisible()
  await query.press('Enter')
  await expect(form.getByRole('button', { name: 'Remove Accessibility' })).toBeVisible()
  expect(await form.evaluate(element => new FormData(element).getAll('topic')))
    .toEqual(['research', 'engineering', 'accessibility'])
})

test('multiple-file inputs do not make narrow pages overflow', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width)
    await expect.poll(() => page.locator('#queue-files')
      .evaluate(element => element.getBoundingClientRect().right))
      .toBeLessThanOrEqual(width)
  }
})

for (const endRegion of ['form', 'cluster']) {
  test(`advanced table footer wraps ${endRegion} controls within its container`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await renderRecipe(page, `
      <main data-sds-root style="width: 500px">
        <div class="sds-card" data-sds-padding="none">
          <div class="sds-table-toolbar">Filters</div>
          <div class="sds-table-container">
            <table class="sds-table"><tbody><tr><td>Example</td></tr></tbody></table>
          </div>
          <div class="sds-table-footer">
            <p class="sds-pagination-status">1–10 of 100 results</p>
            <nav class="sds-pagination" aria-label="Pages"><ul>
              ${['Previous', '1', '2', '3', 'Next'].map(label => `<li><a href="#page">${label}</a></li>`).join('')}
            </ul></nav>
            ${endRegion === 'form' ? '<form>' : '<div class="sds-cluster" data-sds-gap="sm">'}
              <label for="count">Rows per page</label>
              <select id="count" class="sds-select"><option>100</option></select>
            ${endRegion === 'form' ? '</form>' : '</div>'}
          </div>
        </div>
      </main>
    `)
    const footer = page.locator('.sds-table-footer')
    for (const width of [1000, 500, 400, 300]) {
      await page.locator('main').evaluate((root, width) => { root.style.width = `${width}px` }, width)
      const geometry = await footer.evaluate(footer => ({
        frame: footer.getBoundingClientRect().toJSON(),
        children: [...footer.children].map(child => child.getBoundingClientRect().toJSON()),
      }))
      for (const [index, rect] of geometry.children.entries()) {
        expect(rect.left).toBeGreaterThanOrEqual(geometry.frame.left)
        expect(rect.right).toBeLessThanOrEqual(geometry.frame.right)
        for (const other of geometry.children.slice(index + 1)) {
          expect(rect.right <= other.left || other.right <= rect.left ||
            rect.bottom <= other.top || other.bottom <= rect.top).toBe(true)
        }
      }
      if (width === 1000) {
        const navigation = geometry.children[1]
        expect(Math.abs((navigation.left + navigation.right) / 2 -
          (geometry.frame.left + geometry.frame.right) / 2), JSON.stringify(geometry)).toBeLessThanOrEqual(1)
      }
    }
  })
}

test('table header buttons use compact metrics without shrinking row actions', async ({ page }) => {
  await renderRecipe(page, `
    <main data-sds-root>
      <table class="sds-table">
        <thead><tr>${['', 'data-sds-density="compact"', 'data-sds-shape="icon" aria-label="Sort"'].map(attributes => `
          <th scope="col"><button class="sds-button" data-sds-variant="text" ${attributes}>Sort</button></th>
        `).join('')}</tr></thead>
        <tbody><tr>
          <th scope="row"><button class="sds-button" data-sds-variant="text">Details</button></th>
          <td><button class="sds-button" data-sds-shape="icon" aria-label="More">&hellip;</button></td>
        </tr></tbody>
      </table>
    </main>
  `)
  for (const button of await page.locator('th .sds-button:not([data-sds-density], [data-sds-shape])').all()) {
    await expect(button).toHaveCSS('min-height', '24px')
    expect((await button.boundingBox()).height).toBe(24)
    await expect(button).toHaveCSS('padding', '0px')
  }
  for (const button of await page.locator('thead .sds-button:is([data-sds-density], [data-sds-shape])').all()) {
    expect((await button.boundingBox()).height).toBe(32)
  }
  await expect(page.locator('td .sds-button')).toHaveCSS('height', '32px')
})

for (const recipe of ['dialog', 'panel']) {
  test(`${recipe} footer keeps authored visual and keyboard action order`, async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 })
    await renderRecipe(page, `
      <main data-sds-root>
        <dialog class="sds-${recipe}" aria-label="Decision">
          <footer class="${recipe === 'dialog' ? 'sds-dialog-footer' : ''}">
            <button class="sds-button" type="button" tabindex="0">Confirm</button>
            <button class="sds-button" type="button" tabindex="0" data-sds-variant="text">Cancel</button>
          </footer>
        </dialog>
      </main>
    `)
    const dialog = page.locator('dialog')
    await dialog.evaluate(element => element.showModal())
    await expect(dialog).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
    const buttons = dialog.locator('footer button')
    for (const primaryFirst of [true, false]) {
      if (!primaryFirst) await buttons.first().evaluate(button => button.parentElement.append(button))
      const first = buttons.nth(0)
      const second = buttons.nth(1)
      const firstBounds = await first.boundingBox()
      expect(firstBounds.x + firstBounds.width).toBeLessThanOrEqual((await second.boundingBox()).x)
      await first.focus()
      await first.press('Tab')
      await expect(second).toBeFocused()
      for (const action of await buttons.all()) await expect(action).toHaveCSS('order', '0')
    }
  })
}
