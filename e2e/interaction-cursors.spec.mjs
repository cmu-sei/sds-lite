import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
})

test('advanced pagination buttons match pagination links', async ({ page }) => {
  const buttons = page.locator('#table-selection-example .sds-pagination')
  const links = page.locator('.sds-pagination[aria-label="Project pages"]')
  const appearance = locator => locator.evaluate(element => {
    const style = getComputedStyle(element)
    return Object.fromEntries([
      'background-color', 'border-top-width', 'border-top-style', 'border-top-color',
      'border-radius', 'box-shadow', 'color', 'cursor', 'font-family', 'font-size',
      'font-weight', 'height', 'line-height', 'padding', 'text-decoration-line', 'width',
    ].map(property => [property, style.getPropertyValue(property)]))
  })
  for (const theme of ['forge', 'plaid']) {
    for (const scheme of ['light', 'dark']) {
      await page.locator('body').evaluate((root, { theme, scheme }) => {
        root.dataset.sdsTheme = theme
        root.dataset.sdsColorScheme = scheme
      }, { theme, scheme })
      for (const number of [1, 2]) {
        const button = buttons.locator(`button[aria-label="Task page ${number}"]`)
        const link = links.locator(`a[aria-label="Page ${number}"]`)
        expect(await appearance(button)).toEqual(await appearance(link))
        await expect(button).toHaveCSS('cursor', 'pointer')
      }
    }
  }
  const button = buttons.locator('button[aria-label="Task page 2"]')
  const link = links.locator('a[aria-label="Page 2"]')
  await link.hover()
  const hovered = await appearance(link)
  await button.hover()
  await expect.poll(() => appearance(button)).toEqual(hovered)
  for (const direction of ['Previous', 'Next']) {
    const icon = buttons.locator(`button[aria-label="${direction} task page"] svg`)
    const reference = links.locator(`a[aria-label="${direction} page"] svg`)
    await expect(icon).toHaveAttribute('aria-hidden', 'true')
    await expect(icon).toHaveAttribute('viewBox', await reference.getAttribute('viewBox'))
    await expect(icon.locator('path')).toHaveAttribute('d', await reference.locator('path').getAttribute('d'))
  }
})

test('table select filters use the same pointer cursor as toggle filters', async ({ page }) => {
  const table = page.locator('#table-selection-example')
  for (const control of [
    table.getByRole('button', { name: 'My tasks', exact: true }),
    table.getByRole('button', { name: 'Unassigned', exact: true }),
    table.getByLabel('Assignee', { exact: true }),
    table.getByLabel('Task status', { exact: true }),
    table.getByLabel('Rows per page', { exact: true }),
  ]) {
    await expect(control).toHaveCSS('cursor', 'pointer')
  }
})

test('recipe cursors distinguish actions, text, disabled states, and host controls', async ({ page }) => {
  await page.goto('about:blank')
  await page.setContent(`<!doctype html>
    <main data-sds-root>
      <button id="button" class="sds-button" data-cursor="pointer">Action</button>
      <a id="link" class="sds-link" href="#target" data-cursor="pointer">Link</a>
      <a id="badge" class="sds-badge" href="#target" data-cursor="pointer">Badge</a>
      <button id="tab" class="sds-tab" data-cursor="pointer">Tab</button>
      <button id="tag" class="sds-tag" data-cursor="pointer"><span id="tag-label" data-cursor="pointer">Tag</span></button>
      <span class="sds-tag"><button id="tag-action" class="sds-tag-action" data-cursor="pointer">Remove</button></span>
      <select id="select" class="sds-select" data-cursor="pointer"><option>Choose</option></select>
      <select id="multiple" class="sds-select" multiple data-cursor="pointer"><option>Choose</option></select>
      <label id="choice" class="sds-choice" data-cursor="pointer"><input id="checkbox" type="checkbox" data-cursor="pointer"><span id="choice-label" data-cursor="pointer">Choice</span></label>
      <input id="radio" class="sds-radio" type="radio" data-cursor="pointer" aria-label="Radio">
      <label class="sds-switch" id="switch" data-cursor="pointer"><input type="checkbox" role="switch" id="switch-input" data-cursor="pointer">Switch</label>
      <label class="sds-segment" id="segment" data-cursor="pointer"><input type="radio">Segment</label>
      <label class="sds-selection-card" id="card" data-cursor="pointer"><input class="sds-radio" type="radio">Card</label>
      <input id="range" type="range" class="sds-range" data-cursor="pointer" aria-label="Range">
      <input id="file" type="file" class="sds-file-input" data-cursor="pointer" aria-label="File">
      <label class="sds-file-upload"><span class="sds-file-upload-surface"><input id="upload" type="file" data-cursor="pointer">Upload</span></label>
      <details class="sds-disclosure"><summary id="summary" data-cursor="pointer">Disclosure</summary></details>
      <menu class="sds-dropdown-menu"><li><button id="menuitem" data-cursor="pointer">Item</button></li><li><button id="disabled-menuitem" disabled data-cursor="not-allowed">Unavailable</button></li><li><button id="aria-menuitem" aria-disabled="true" data-cursor="not-allowed">Unavailable</button></li></menu>
      <ul class="sds-combobox-list"><li id="option" data-cursor="pointer">Option</li><li id="disabled-option" aria-disabled="true" data-cursor="not-allowed">Unavailable</li></ul>
      <input id="text" class="sds-input" data-cursor="text" aria-label="Text">
      <input id="search" class="sds-input" type="search" data-cursor="text" aria-label="Search">
      <input id="readonly" class="sds-input" readonly data-cursor="text" aria-label="Readonly">
      <textarea id="textarea" class="sds-input" data-cursor="text" aria-label="Text area"></textarea>
      <span id="static-badge" class="sds-badge" data-cursor="auto">Status</span>
      <span id="static-tag" class="sds-tag" data-cursor="auto">Category</span>
      <button id="disabled-button" class="sds-button" disabled data-cursor="not-allowed">Disabled</button>
      <button id="busy-button" class="sds-button" aria-busy="true" data-cursor="not-allowed">Busy</button>
      <a id="disabled-link" class="sds-link" aria-disabled="true" data-cursor="not-allowed">Unavailable</a>
      <button id="disabled-tab" class="sds-tab" disabled data-cursor="not-allowed">Unavailable</button>
      <button id="aria-tab" class="sds-tab" aria-disabled="true" data-cursor="not-allowed">Unavailable</button>
      <button id="disabled-tag" class="sds-tag" disabled data-cursor="not-allowed">Unavailable</button>
      <span class="sds-tag"><button id="disabled-tag-action" class="sds-tag-action" disabled data-cursor="not-allowed">Remove</button></span>
      <input id="disabled-input" class="sds-input" disabled data-cursor="not-allowed" aria-label="Disabled text">
      <select id="disabled-select" class="sds-select" disabled data-cursor="not-allowed"><option>Unavailable</option></select>
      <label id="disabled-choice" class="sds-choice" data-cursor="not-allowed"><input type="checkbox" disabled>Unavailable</label>
      <input id="disabled-radio" class="sds-radio" type="radio" disabled data-cursor="not-allowed" aria-label="Disabled radio">
      <input id="disabled-range" class="sds-range" type="range" disabled data-cursor="not-allowed" aria-label="Disabled range">
      <input id="disabled-file" class="sds-file-input" type="file" disabled data-cursor="not-allowed" aria-label="Disabled file">
      <label class="sds-file-upload"><span class="sds-file-upload-surface"><input id="disabled-upload" type="file" disabled data-cursor="not-allowed">Unavailable</span></label>
      <fieldset disabled><legend>Disabled group</legend><label id="fieldset-choice" class="sds-choice" data-cursor="not-allowed"><input type="checkbox">Unavailable</label></fieldset>
      <select id="override" class="sds-select" data-cursor="crosshair"><option>Host override</option></select>
      <button id="host-button" data-cursor="default">Host button</button>
      <select id="host-select" data-cursor="default"><option>Host select</option></select>
      <input id="host-text" aria-label="Host text">
    </main>
    <style>
      main { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; }
      #override { cursor: crosshair; }
    </style>
  `)
  await page.addStyleTag({ path: 'dist/sds.css' })
  const cursors = await page.locator('[data-cursor]').evaluateAll(elements => ({
    actual: Object.fromEntries(elements.map(element => [element.id, getComputedStyle(element).cursor])),
    expected: Object.fromEntries(elements.map(element => [
      element.id,
      element.dataset.cursor === 'text'
        ? getComputedStyle(document.querySelector('#host-text')).cursor
        : element.dataset.cursor,
    ])),
  }))
  expect(cursors.actual).toEqual(cursors.expected)
  const textCursor = await page.locator('#host-text').evaluate(element => getComputedStyle(element).cursor)
  for (const [id, cursor] of [
    ['select', 'pointer'], ['checkbox', 'pointer'], ['choice-label', 'pointer'],
    ['text', textCursor], ['readonly', textCursor], ['disabled-button', 'not-allowed'],
    ['disabled-select', 'not-allowed'], ['disabled-radio', 'not-allowed'],
    ['disabled-choice', 'not-allowed'], ['disabled-tag', 'not-allowed'],
    ['disabled-file', 'not-allowed'],
  ]) {
    const control = page.locator(`#${id}`)
    await control.scrollIntoViewIfNeeded()
    const bounds = await control.boundingBox()
    const point = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
    await page.mouse.move(point.x, point.y)
    expect(await page.evaluate(({ x, y }) => {
      const target = document.elementFromPoint(x, y)
      if (!target) throw new Error('Cursor target was not hit-testable.')
      return getComputedStyle(target).cursor
    }, point), id).toBe(cursor)
    if (await control.evaluate(element => element.matches(':disabled'))) {
      await control.evaluate(element => {
        element.dataset.activations = '0'
        element.addEventListener('click', () => { element.dataset.activations = '1' })
        element.click()
      })
      await page.mouse.click(point.x, point.y)
      await expect(control).toHaveAttribute('data-activations', '0')
    }
  }
  for (const id of ['disabled-link', 'aria-tab', 'busy-button']) {
    await expect(page.locator(`#${id}`)).toHaveCSS('pointer-events', 'none')
  }
})

test('pagination has visible keyboard focus on current and other pages', async ({ page }) => {
  for (const forcedColors of ['none', 'active']) {
    await page.emulateMedia({ forcedColors })
    for (const [name, role, label] of [
      ['Task result pages', 'button', 'Task page'],
      ['Project pages', 'link', 'Page'],
    ]) {
      const nav = page.getByRole('navigation', { name, exact: true })
      for (const number of [1, 2]) {
        const control = nav.getByRole(role, { name: `${label} ${number}`, exact: true })
        await control.focus()
        if (forcedColors === 'active') {
          await expect(control).toHaveCSS('outline-style', 'solid')
          await expect(control).toHaveCSS('outline-width', '2px')
        } else {
          await expect(control).toHaveCSS('box-shadow', /0px 0px 0px 2px/)
        }
      }
    }
  }
})

test('panel handles keep grab and grabbing cursors', async ({ page }) => {
  const panel = page.locator('#panel-bottom')
  await panel.evaluate(element => element.showModal())
  const handle = panel.locator(':scope > ._sds-panel-handle')
  await expect(handle).toHaveCSS('cursor', 'grab')
  await handle.hover()
  const bounds = await handle.boundingBox()
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  await page.mouse.down()
  await page.mouse.move(x, y + 20)
  await expect(handle).toHaveCSS('cursor', 'grabbing')
  await page.mouse.move(x, y)
  await page.mouse.up()
  await expect(handle).toHaveCSS('cursor', 'grab')
  await expect(panel).toHaveAttribute('open')
})
