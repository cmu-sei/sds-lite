import { expect, test } from '@playwright/test'

test.use({ timezoneId: 'America/New_York' })

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
})

test('native segments and cards retain keyboard, submission, disabled, and reset behavior', async ({ page }) => {
  const form = page.locator('#selection-example')
  const list = form.getByRole('radio', { name: 'List', exact: true })
  const grid = form.getByRole('radio', { name: 'Grid', exact: true })
  const selected = form.locator('.sds-segment').filter({ hasText: 'List' })
  const unselected = form.locator('.sds-segment').filter({ hasText: 'Grid' })
  await expect(selected).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(form.locator('.sds-segmented').first()).toHaveCSS('border-top-width', '0px')
  await expect(selected).not.toHaveCSS('box-shadow', 'none')
  await expect(unselected).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  const neutral = await selected.evaluate(element => {
    const style = getComputedStyle(element)
    const reference = document.createElement('span')
    reference.style.color = 'var(--sds-color-text-default)'
    element.append(reference)
    const expected = getComputedStyle(reference).color
    reference.remove()
    return { actual: style.color, expected }
  })
  expect(neutral.actual).toBe(neutral.expected)
  await list.focus()
  await expect(selected).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('ArrowRight')
  await expect(grid).toBeChecked()
  await expect(form.getByRole('radio', { name: 'Map (unavailable)' })).toBeDisabled()
  await form.locator('.sds-selection-card').filter({ hasText: 'Review' }).click()
  await form.locator('.sds-segment').filter({ hasText: 'Places' }).click()
  await form.getByRole('button', { name: 'Show submitted choices' }).click()
  await expect(form.getByRole('status')).toContainText('["view","grid"]')
  await expect(form.getByRole('status')).toContainText('["template","review"]')
  await expect(form.getByRole('status')).toContainText('["layer[]","roads"]')
  await expect(form.getByRole('status')).toContainText('["layer[]","places"]')
  const toggle = form.getByRole('button', { name: 'Show archived', exact: true })
  const chip = form.getByRole('button', { name: 'Favorites', exact: true })
  await toggle.click()
  await chip.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(toggle).toHaveCSS('box-shadow', /inset/)
  await expect(chip).toHaveAttribute('aria-pressed', 'true')
  await expect(chip).toHaveCSS('box-shadow', /inset/)
  await form.getByRole('button', { name: 'Reset choices' }).click()
  await expect(list).toBeChecked()
  await expect(form.getByRole('radio', { name: /Research Start/ })).toBeChecked()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(chip).toHaveAttribute('aria-pressed', 'false')
})

test('advanced table integrates selection, filters, pagination, sorting, actions, export, and reset', async ({ page }) => {
  test.setTimeout(30_000)
  const form = page.locator('#table-selection-example')
  const status = form.locator('[data-table-status]')
  const all = form.getByRole('checkbox', { name: 'Select all tasks on this page' })
  const first = form.getByRole('checkbox', { name: 'Select SDS-101', exact: true })
  const selectionBar = form.locator('.sds-table-selection')
  const reset = async () => {
    await form.getByRole('button', { name: 'Table options', exact: true }).click()
    await form.getByRole('menuitem', { name: 'Reset table', exact: true }).click()
    await expect(status).toHaveText('Showing 1-10 of 25')
  }
  await expect(status).toHaveText('Showing 1-10 of 25')
  await expect(form.locator('tbody tr')).toHaveCount(10)
  await expect(form.locator('.sds-input-group button')).toHaveCount(0)
  await expect(selectionBar).toBeHidden()
  await expect(form.locator('tbody th').first()).toHaveCSS('text-align', 'start')
  await first.check()
  await expect(all).toBeChecked({ indeterminate: true })
  const mixedImage = await all.evaluate(element => getComputedStyle(element).backgroundImage)
  expect(mixedImage).not.toBe('none')
  await all.check()
  await expect(status).toHaveText('Showing 1-10 of 25. 10 selected')
  await expect.poll(() => all.evaluate(element => getComputedStyle(element).backgroundImage)).not.toBe(mixedImage)
  await form.getByLabel('Search tasks', { exact: true }).fill('SDS-101')
  await form.getByLabel('Search tasks', { exact: true }).press('Enter')
  await expect(status).toHaveText('Showing 1-1 of 1')
  await expect(selectionBar).toBeHidden()
  await first.check()
  expect(await form.evaluate(element => new FormData(element).getAll('task[]'))).toEqual(['SDS-101'])
  const downloading = page.waitForEvent('download')
  await form.getByRole('button', { name: 'Export selected', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('project-tasks.csv')
  const stream = await download.createReadStream()
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  const csv = Buffer.concat(chunks).toString()
  expect(csv).toContain('"SDS-101"')
  expect(csv).not.toContain('"SDS-102"')
  await form.getByRole('button', { name: 'Mark approved', exact: true }).click()
  await expect(form.locator('tbody .sds-badge')).toHaveText('APPROVED')
  await form.getByLabel('Search tasks', { exact: true }).fill('nothing matches')
  await expect(all).toBeDisabled()
  await expect(form.getByText('No tasks match these filters.')).toBeVisible()
  await expect(status).toHaveText('Showing 0-0 of 0')
  await reset()
  await expect(form.locator('tbody .sds-badge').first()).toHaveText('OPEN')
  await form.getByRole('button', { name: 'Task', exact: true }).click()
  await expect(form.locator('th[aria-sort]')).toHaveAttribute('aria-sort', 'descending')
  await expect(form.locator('tbody th').first()).toHaveText('SDS-125')
  await reset()
  await form.getByRole('button', { name: 'Next task page' }).click()
  await expect(status).toHaveText('Showing 11-20 of 25')
  await form.getByRole('button', { name: 'Next task page' }).click()
  await expect(status).toHaveText('Showing 21-25 of 25')
  await expect(form.getByRole('button', { name: 'Next task page' })).toBeDisabled()
  await form.getByLabel('Rows per page', { exact: true }).selectOption('25')
  await expect(form.locator('tbody tr')).toHaveCount(25)
  await expect(status).toHaveText('Showing 1-25 of 25')
  await form.getByRole('button', { name: 'Unassigned', exact: true }).click()
  await expect(form.locator('tbody tr')).toHaveCount(3)
  await form.getByRole('button', { name: 'My tasks', exact: true }).click()
  await expect(form.locator('tbody tr')).toHaveCount(5)
  await expect(form.getByRole('button', { name: 'Unassigned', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await reset()
  await form.getByLabel('Task status', { exact: true }).selectOption('open')
  await expect(form.locator('tbody tr')).toHaveCount(9)
  await all.check()
  await form.getByRole('button', { name: 'Mark approved', exact: true }).click()
  await expect(status).toHaveText('Showing 0-0 of 0')
  await expect(form.getByLabel('Search tasks', { exact: true })).toBeFocused()
  await reset()
  await form.getByRole('button', { name: 'SDS-101', exact: true }).click()
  await expect(form.getByRole('dialog', { name: 'Task details' })).toBeVisible()
  await form.getByRole('button', { name: 'Close task details' }).click()
  await expect(form.getByRole('button', { name: 'SDS-101', exact: true })).toBeFocused()
  await page.emulateMedia({ forcedColors: 'active' })
  await first.check()
  await expect(all).toBeChecked({ indeterminate: true })
  await expect(all).toHaveCSS('appearance', 'auto')
})

test('table toolbar filters match typography and height while icon actions stay compact', async ({ page }) => {
  const toolbar = page.locator('#table-selection-example .sds-table-toolbar')
  const filters = toolbar.getByRole('group', { name: 'Task filters' })
  const controls = filters.locator('button, select')
  await expect(controls).toHaveCount(4)
  const colors = []
  for (const control of await controls.all()) {
    await expect(control).toHaveCSS('font-size', '14px')
    await expect(control).toHaveCSS('font-weight', '400')
    await expect(control).toHaveCSS('line-height', '17.5px')
    await expect(control).toHaveCSS('height', '32px')
    colors.push(await control.evaluate(element => getComputedStyle(element).color))
  }
  expect(new Set(colors).size).toBe(1)
  const icons = toolbar.locator('button[data-sds-shape="icon"]')
  await expect(icons).toHaveCount(2)
  for (const button of await icons.all()) {
    await expect(button).toHaveCSS('width', '32px')
    await expect(button).toHaveCSS('height', '32px')
    await expect(button.locator('svg')).toHaveCSS('width', '16px')
    await expect(button.locator('svg')).toHaveCSS('height', '16px')
  }
})

test('advanced table header and footer stay compact without shrinking click targets', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const form = page.locator('#table-selection-example')
  const table = form.locator('.sds-table')
  const footer = form.locator('.sds-table-footer')
  await expect.poll(() => table.locator('thead').evaluate(element => element.getBoundingClientRect().height))
    .toBeCloseTo(41, 1)
  await expect.poll(() => footer.evaluate(element => element.getBoundingClientRect().height))
    .toBeCloseTo(59, 1)
  await expect(footer).toHaveCSS('padding-block', '12px')
  await expect(table.locator('thead button')).toHaveCSS('height', '32px')
  const pagination = footer.locator('.sds-pagination')
  await expect(pagination.locator('.sds-button')).toHaveCount(0)
  for (const button of await pagination.getByRole('button').all()) {
    await expect(button).toHaveCSS('height', '34px')
  }
  await form.getByRole('button', { name: 'Next task page' }).click()
  await expect(form.locator('[data-table-status]')).toHaveText('Showing 11-20 of 25')
})

test('mobile advanced tables scroll only the columns, not filters or pagination', async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 })
    const form = page.locator('#table-selection-example')
    const scroller = form.locator('.sds-table-container')
    await expect(scroller.locator('.sds-table-toolbar, .sds-table-selection, .sds-table-footer')).toHaveCount(0)
    await expect(scroller).toHaveAttribute('tabindex', '0')
    await expect(scroller).toHaveAttribute('role', 'region')
    await expect(scroller).toHaveAccessibleName('Project tasks')
    await form.getByRole('checkbox', { name: 'Select all tasks on this page' }).check()
    const geometry = () => form.evaluate(element => {
      const left = selector => element.querySelector(selector).getBoundingClientRect().left
      const footer = element.querySelector('.sds-table-footer').getBoundingClientRect()
      const controls = [...element.querySelectorAll('.sds-table-footer nav, .sds-table-footer select')]
      return {
        toolbar: left('.sds-table-toolbar'),
        selection: left('.sds-table-selection'),
        footer: footer.left,
        table: left('.sds-table'),
        controlsFit: controls.every(control => {
          const rect = control.getBoundingClientRect()
          return rect.left >= footer.left && rect.right <= footer.right
        }),
        pageFits: document.documentElement.scrollWidth <= innerWidth,
      }
    })
    const before = await geometry()
    await scroller.evaluate(element => { element.scrollLeft = element.scrollWidth })
    await expect.poll(() => scroller.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
    const after = await geometry()
    for (const key of ['toolbar', 'selection', 'footer']) expect(after[key]).toBeCloseTo(before[key], 1)
    expect(after.table).toBeLessThan(before.table)
    expect(after.controlsFit).toBe(true)
    expect(after.pageFits).toBe(true)
    await scroller.evaluate(element => { element.scrollLeft = 0 })
    // WebKit needs the pointer over the scroller and a held key for native scrolling.
    await scroller.hover()
    await scroller.focus()
    await scroller.press('ArrowRight', { delay: 100 })
    await expect.poll(() => scroller.evaluate(element => element.scrollLeft)).toBeGreaterThan(0)
    await form.getByRole('button', { name: 'Next task page' }).click()
    await expect(form.locator('[data-table-status]')).toHaveText('Showing 11-20 of 25')
    await form.getByRole('button', { name: 'Previous task page' }).click()
  }
})

test('multiple selections submit IDs, prevent duplicates, restore defaults, and preserve removal focus', async ({ page }) => {
  const form = page.locator('#multiple-selection-example')
  const query = form.getByRole('combobox')
  expect(await form.evaluate(element => new FormData(element).getAll('topic'))).toEqual(['research'])
  await query.scrollIntoViewIfNeeded()
  await query.fill('Eng')
  await form.getByRole('option', { name: 'Engineering', exact: true }).click()
  await expect(form.getByRole('button', { name: 'Remove Engineering' })).toBeVisible()
  expect(await form.evaluate(element => new FormData(element).getAll('topic'))).toEqual(['research', 'engineering'])
  await form.getByRole('button', { name: 'Show topic IDs' }).click()
  await expect(form.locator('p[role="status"]')).toContainText('["research","engineering"]')
  await form.getByRole('button', { name: 'Remove Engineering' }).click()
  await expect(form.getByRole('button', { name: 'Remove Research' })).toBeFocused()
  await form.getByRole('button', { name: 'Remove Research' }).click()
  await expect(query).toBeFocused()
  expect(await query.evaluate(element => element.validity.customError)).toBe(true)
  await form.getByRole('button', { name: 'Reset topics' }).click()
  await expect(form.getByRole('button', { name: 'Remove Research' })).toBeVisible()
  expect(await form.evaluate(element => element.checkValidity())).toBe(true)
  await query.fill('Research')
  await expect(form.locator('li[data-sds-value="research"]')).toHaveAttribute('aria-disabled', 'true')
  await query.press('Enter')
  expect(await form.evaluate(element => new FormData(element).getAll('topic'))).toEqual(['research'])
})

test('input actions preserve values, dispatch edits, reset concealment, and report clipboard denial', async ({ page }) => {
  const form = page.locator('#input-actions-example')
  const password = form.getByLabel('Example password', { exact: true })
  await password.fill('example-not-a-real-secret')
  await form.getByRole('button', { name: 'Show password', exact: true }).click()
  await expect(password).toHaveAttribute('type', 'text')
  await expect(password).toHaveValue('example-not-a-real-secret')
  const query = form.getByLabel('Search query')
  await query.fill('Atlas')
  await query.evaluate(element => {
    window.clearEvents = 0
    element.addEventListener('input', () => { window.clearEvents += 1 })
  })

  await form.getByRole('button', { name: 'Clear search' }).click()
  await expect(query).toBeFocused()
  await expect(query).toHaveValue('')
  expect(await page.evaluate(() => window.clearEvents)).toBe(1)
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: () => Promise.reject(new Error('Clipboard denied for test')),
    } })
  })
  await form.getByRole('button', { name: 'Copy URL' }).click()
  await expect(form.getByRole('status')).toContainText('Copy failed.')
  await form.getByRole('button', { name: 'Reset fields' }).click()
  await expect(password).toHaveAttribute('type', 'password')
  await expect(form.getByRole('button', { name: 'Show password', exact: true })).toHaveAttribute('aria-pressed', 'false')
})

test('embedded icons and actions share one field border and preserve input and button focus', async ({ page }) => {
  const fields = page.locator('#input-actions-example .sds-input-group, #table-selection-example .sds-input-group')
  await expect(fields).toHaveCount(4)
  for (const field of await fields.all()) {
    const geometry = await field.evaluate(element => {
      const border = element.getBoundingClientRect()
      const input = element.querySelector('input')
      const accessory = element.querySelector('button, svg')
      const action = accessory.getBoundingClientRect()
      return {
        fieldBorder: getComputedStyle(element).borderTopWidth,
        inputBorder: getComputedStyle(input).borderTopWidth,
        accessoryBorder: getComputedStyle(accessory).borderInlineStartWidth,
        inputBackground: getComputedStyle(input).backgroundColor,
        accessoryInside: action.left >= border.left + 1 && action.right <= border.right - 1,
      }
    })
    expect(geometry).toEqual({
      fieldBorder: '1px',
      inputBorder: '0px',
      accessoryBorder: '0px',
      inputBackground: 'rgba(0, 0, 0, 0)',
      accessoryInside: true,
    })
    const input = field.locator('input')
    await input.focus()
    await expect(field).not.toHaveCSS('box-shadow', 'none')
    await expect(input).toHaveCSS('box-shadow', 'none')
    const button = field.locator('button')
    if (await button.count()) {
      await button.focus()
      await expect(button).not.toHaveCSS('box-shadow', 'none')
    } else {
      await expect(field.locator(':scope > svg')).toHaveAttribute('aria-hidden', 'true')
    }
  }
})

for (const javaScriptEnabled of [true, false]) {
  test.describe(`native search label with JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, () => {
    test.use({ javaScriptEnabled })

    test('clicking the decorative icon or field padding focuses the search input', async ({ page }) => {
      const field = page.locator('#table-selection-example label.sds-input-group')
      const input = field.getByRole('searchbox', { name: 'Search tasks', exact: true })
      await expect(field).toHaveCount(1)
      await field.locator(':scope > svg').click()
      await expect(input).toBeFocused()
      await input.press('Tab')
      await expect(input).not.toBeFocused()
      await field.click({ position: { x: 3, y: 3 } })
      await expect(input).toBeFocused()
    })
  })
}

test('embedded actions scale with wrapper or input sizes without separate button attributes', async ({ page }) => {
  const field = page.locator('#input-actions-example .sds-input-group').first()
  for (const target of ['wrapper', 'input']) {
    for (const [size, action, icon] of [['sm', 24, 16], ['md', 32, 18], ['lg', 40, 20]]) {
      await field.evaluate((element, { target, size }) => {
        const input = element.querySelector('input')
        element.removeAttribute('data-sds-size')
        input.removeAttribute('data-sds-size')
        ;(target === 'wrapper' ? element : input).setAttribute('data-sds-size', size)
      }, { target, size })
      const button = field.locator('button')
      await expect(button).toHaveCSS('height', `${action}px`)
      await expect(button).toHaveCSS('width', `${action}px`)
      await expect(button.locator('svg')).toHaveCSS('width', `${icon}px`)
      expect(await button.getAttribute('data-sds-size')).toBeNull()
      const bounds = await field.evaluate(element => {
        const input = element.querySelector('input').getBoundingClientRect()
        const action = element.querySelector('button').getBoundingClientRect()
        return { inside: action.top >= input.top && action.bottom <= input.bottom }
      })
      expect(bounds.inside).toBe(true)
    }
  }
  await field.evaluate(element => {
    element.dataset.sdsSize = 'sm'
    element.querySelector('input').dataset.sdsSize = 'lg'
  })
  await expect(field.locator('button')).toHaveCSS('height', '24px')
})

for (const width of [1440, 320]) {
  test(`date range keeps aligned fields and compact actions without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    const form = page.locator('#date-range-example')
    const start = form.getByLabel('Start date', { exact: true })
    const end = form.getByLabel('End date', { exact: true })
    const bounds = await form.boundingBox()
    expect(bounds.width).toBeLessThanOrEqual(640)
    const first = await start.boundingBox()
    const second = await end.boundingBox()
    expect(Math.abs(first.width - second.width)).toBeLessThanOrEqual(1)
    if (width === 1440) expect(Math.abs(first.y - second.y)).toBeLessThanOrEqual(1)
    else expect(second.y).toBeGreaterThan(first.y + first.height)
    for (const control of await form.getByRole('button').all()) {
      await expect(control).toHaveCSS('height', '32px')
      const box = await control.boundingBox()
      expect(box.x).toBeGreaterThanOrEqual(bounds.x)
      expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('date range validates order, clears stale errors on reset, and uses inclusive local calendar days', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-03-10T16:00:00Z'))
  const form = page.locator('#date-range-example')
  const start = form.getByLabel('Start date', { exact: true })
  const end = form.getByLabel('End date', { exact: true })
  await start.fill('2026-03-10')
  await end.fill('2026-03-01')
  await expect(end).toHaveAttribute('aria-invalid', 'true')
  const error = form.locator('[data-date-error]')
  await expect(error).toHaveAttribute('aria-live', 'polite')
  await expect(error).toContainText('on or after')
  expect(await form.evaluate(element => element.checkValidity())).toBe(false)
  await form.getByRole('button', { name: 'Reset dates' }).click()
  await expect.poll(() => end.evaluate(element => element.validity.customError)).toBe(false)
  await expect(end).toHaveAttribute('min', '')
  await form.getByRole('button', { name: 'Last 7 days', exact: true }).click()
  await expect(start).toHaveValue('2026-03-04')
  await expect(end).toHaveValue('2026-03-10')
  await form.getByRole('button', { name: 'Apply reporting period' }).click()
  await expect(form.getByRole('status')).toContainText('2026-03-04 through 2026-03-10 (inclusive)')
})

test('upload queue uses the shared drop zone and opens the native picker from its surface', async ({ page }) => {
  const form = page.locator('#file-upload-example')
  const zone = form.locator('.sds-file-upload')
  const input = form.getByLabel('PDF attachments')
  await zone.scrollIntoViewIfNeeded()
  await expect(zone).toHaveAttribute('data-sds-size', 'lg')
  await expect(zone).toHaveCSS('border-top-style', 'dashed')
  await expect(input).toHaveAccessibleDescription(/Each PDF must be smaller than 10 MB/)
  await input.focus()
  await expect(zone).not.toHaveCSS('box-shadow', 'none')
  const bounds = await zone.boundingBox()
  const point = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
  expect(await input.evaluate((element, point) => document.elementFromPoint(point.x, point.y) === element, point)).toBe(true)
  const chooser = page.waitForEvent('filechooser')
  await page.mouse.click(point.x, point.y)
  await (await chooser).setFiles({
    name: 'surface.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-example'),
  })
  await expect(form.getByRole('list', { name: 'Queued files' })).toContainText('surface.pdf')
  await expect(form.getByText('Ready to upload', { exact: true })).toBeVisible()
})

test('uploads validate exact limits, submit retained files, report HTTP errors, retry, and remove', async ({ page }) => {
  let attempts = 0
  await page.route('**/api/uploads', async route => {
    attempts += 1
    expect(route.request().postDataBuffer().toString()).toContain('filename="report.pdf"')
    await route.fulfill({ status: attempts === 1 ? 503 : 201, body: '' })
  })
  const form = page.locator('#file-upload-example')
  const input = form.getByLabel('PDF attachments')
  await input.setInputFiles([
    { name: 'report.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-example') },
    { name: 'limit.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(10 * 1024 * 1024) },
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a PDF') },
  ])
  const list = form.getByRole('list', { name: 'Queued files' })
  await expect(list.getByText('Choose a PDF smaller than 10 MB.', { exact: true })).toHaveCount(2)
  await expect(list.getByRole('button', { name: /^Cancel / })).toHaveCount(0)
  await expect(list.getByRole('button', { name: 'Upload report.pdf', exact: true })).toBeVisible()
  await expect(list.getByRole('button', { name: 'Upload limit.pdf', exact: true })).toHaveCount(0)
  expect(await form.evaluate(element => new FormData(element).getAll('attachment').map(file => file.name))).toEqual(['report.pdf'])
  const failureResponse = page.waitForResponse(response =>
    new URL(response.url()).pathname === '/api/uploads' && response.request().method() === 'POST',
  )
  await form.getByRole('button', { name: 'Upload queued files' }).click()
  const response = await failureResponse
  expect(response.status()).toBe(503)
  await response.finished()
  await expect(list.getByText(/Upload failed \(HTTP 503\)/)).toBeVisible()
  const retryResponse = page.waitForResponse(response =>
    new URL(response.url()).pathname === '/api/uploads' && response.request().method() === 'POST',
  )
  await form.getByRole('button', { name: 'Retry report.pdf', exact: true }).click()
  const retried = await retryResponse
  expect(retried.status()).toBe(201)
  await retried.finished()
  await expect(list.getByText('Uploaded', { exact: true })).toBeVisible()
  await expect(list.getByRole('button', { name: 'Retry report.pdf', exact: true })).toHaveCount(0)
  expect(attempts).toBe(2)
  await form.getByRole('button', { name: 'Remove report.pdf', exact: true }).click()
  await expect(input).toBeFocused()
  expect(await form.evaluate(element => new FormData(element).getAll('attachment'))).toEqual([])
  await form.getByRole('button', { name: 'Clear file queue' }).click()
  await expect(list.getByRole('listitem')).toHaveCount(0)
})

test('uploads cancel in-flight requests and reset without reporting false success', async ({ page }) => {
  await page.route('**/api/uploads', () => {})
  const form = page.locator('#file-upload-example')
  await form.getByLabel('PDF attachments').setInputFiles({
    name: 'pending.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-example'),
  })
  const upload = form.getByRole('button', { name: 'Upload pending.pdf', exact: true })
  await upload.focus()
  await upload.press('Enter')
  await expect(form.getByText('Uploading', { exact: true })).toBeVisible()
  await expect(form.getByRole('progressbar')).toBeVisible()
  const cancel = form.getByRole('button', { name: 'Cancel pending.pdf', exact: true })
  await expect(cancel).toBeFocused()
  await cancel.press('Enter')
  await expect(form.getByText('Upload cancelled. You can retry.', { exact: true })).toBeVisible()
  const retry = form.getByRole('button', { name: 'Retry pending.pdf', exact: true })
  await expect(retry).toBeFocused()
  await retry.press('Enter')
  await expect(form.getByText('Uploading', { exact: true })).toBeVisible()
  await form.getByRole('button', { name: 'Clear file queue' }).click()
  await expect(form.getByRole('listitem')).toHaveCount(0)
  await expect(form.getByRole('status')).toHaveText('File queue cleared.')
})

test('file queue rows keep readable sizes, compact actions, and wrapping filenames at every viewport', async ({ page }) => {
  const form = page.locator('#file-upload-example')
  const name = `${'annual-compliance-training-'.repeat(6)}report.pdf`
  await form.getByLabel('PDF attachments').setInputFiles([
    { name, mimeType: 'application/pdf', buffer: Buffer.alloc(329467) },
    { name: 'summary.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(1048576) },
  ])
  const list = form.getByRole('list', { name: 'Queued files' })
  const row = list.getByRole('listitem').first()
  await expect(row.locator('strong')).toHaveText(name)
  await expect(row.locator('small')).toContainText('321.7 KB')
  await expect(list.getByRole('listitem').nth(1).locator('small')).toContainText('1 MB')
  await expect(row.getByRole('button')).toHaveCount(2)
  const remove = row.getByRole('button', { name: `Remove ${name}`, exact: true })
  await expect(remove).toHaveAttribute('data-sds-tone', 'danger')
  await expect(remove).toHaveAttribute('data-sds-variant', 'text')
  await expect(form.getByRole('button', { name: 'Clear file queue', exact: true })).toHaveAttribute('data-sds-tone', 'danger')
  const colors = await row.evaluate(element => {
    const buttons = element.querySelectorAll('button:not([hidden])')
    const reference = document.createElement('span')
    reference.style.color = 'var(--sds-color-danger-text)'
    element.append(reference)
    const expected = getComputedStyle(reference).color
    reference.remove()
    return { upload: getComputedStyle(buttons[0]).color, remove: getComputedStyle(buttons[1]).color, expected }
  })
  expect(colors.remove).toBe(colors.expected)
  expect(colors.remove).not.toBe(colors.upload)
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await row.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const details = await row.locator('.sds-file-details').boundingBox()
    const actions = await row.locator('.sds-action-group').boundingBox()
    const bounds = await row.boundingBox()
    expect(actions.x + actions.width).toBeLessThanOrEqual(bounds.x + bounds.width)
    if (width < 768) expect(actions.y).toBeGreaterThanOrEqual(details.y + details.height)
    else expect(actions.x).toBeGreaterThanOrEqual(details.x + details.width)
    await expect(row.getByRole('button').first()).toHaveCSS('height', '32px')
  }
})

test('catalog searches familiar names and copied recipes run with their JavaScript', async ({ page }) => {
  const search = page.getByRole('searchbox', { name: 'Search all examples' })
  await search.fill('segmented')
  await expect(page.locator('#playground-results a')).toHaveAttribute('href', '#selection-recipes')
  await search.fill('drawer')
  await expect(page.locator('#playground-results a[href="#structure"]')).toBeVisible()
  await search.fill('multi-select')
  await expect(page.locator('#playground-results a[href="#multiple-selection-recipe"]')).toBeVisible()
  await search.fill('not-a-component')
  await expect(page.locator('#playground-search-status')).toHaveText('0 matching components or recipes.')
  await search.fill('')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async text => { window.copiedRecipe = text },
    } })
  })
  await page.getByRole('button', { name: 'Copy multiple-selection form HTML + JavaScript', exact: true }).click()
  const copied = await page.evaluate(() => window.copiedRecipe)
  expect(copied).toContain('<script type="module">')
  expect(copied).toContain("new FormData(form).getAll('topic')")
  await page.route('**/copied-recipe', route => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html lang="en"><head><title>Copied recipe</title><link rel="stylesheet" href="/src/style.css"></head><body><main data-sds-root>${copied}</main><script type="module" src="/src/auto.ts"></script></body></html>`,
  }))
  await page.goto('/copied-recipe')
  const form = page.locator('#multiple-selection-example')
  await expect(form.getByRole('button', { name: 'Remove Research' })).toBeVisible()
  await form.getByRole('button', { name: 'Remove Research' }).click()
  await expect(form.getByRole('combobox')).toBeFocused()
  await form.getByRole('combobox').fill('Eng')
  await form.getByRole('option', { name: 'Engineering', exact: true }).click()
  await form.getByRole('combobox').press('Escape')
  await form.getByRole('button', { name: 'Show topic IDs' }).click()
  await expect(form.locator('p[role="status"]')).toContainText('["engineering"]')
})

test('RTL tabs reverse horizontal arrows without reversing vertical navigation', async ({ page }) => {
  const tabs = page.locator('sds-tabs').first()
  await tabs.evaluate(element => {
    element.dir = 'rtl'
    element.activation = 'manual'
  })
  const enabled = tabs.locator('[role="tab"]:not(:disabled):not([aria-disabled="true"])')
  const first = enabled.nth(0)
  const second = enabled.nth(1)
  await first.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(second).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(first).toBeFocused()
  await tabs.evaluate(element => { element.orientation = 'vertical' })
  await page.keyboard.press('ArrowDown')
  await expect(second).toBeFocused()
  await page.keyboard.press('Home')
  await expect(first).toBeFocused()
})

for (const direction of ['ltr', 'rtl']) {
  test(`${direction} tablists navigate by layout rather than individual label direction`, async ({ page }) => {
    await page.evaluate(direction => {
      const element = document.createElement('sds-tabs')
      element.id = 'mixed-direction-tabs'
      element.activation = 'manual'
      const labelDirection = direction === 'rtl' ? 'ltr' : 'rtl'
      element.innerHTML = `
        <div dir="${direction}" aria-label="Mixed-direction tabs">
          <button type="button" dir="${labelDirection}">Alpha</button>
          <button type="button" dir="${labelDirection}">Beta</button>
          <button type="button" dir="${labelDirection}">Gamma</button>
        </div>
        <section>Alpha panel</section>
        <section>Beta panel</section>
        <section>Gamma panel</section>
      `
      document.querySelector('[data-sds-root]').append(element)
    }, direction)
    const tabs = page.locator('#mixed-direction-tabs')
    const enabled = tabs.locator('[role="tab"]:not(:disabled):not([aria-disabled="true"])')
    const first = enabled.nth(0)
    const second = enabled.nth(1)
    await first.focus()
    await page.keyboard.press(direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight')
    await expect(second).toBeFocused()
    await page.keyboard.press(direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft')
    await expect(first).toBeFocused()
    await tabs.evaluate(element => { element.orientation = 'vertical' })
    await page.keyboard.press('ArrowDown')
    await expect(second).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(first).toBeFocused()
  })
}

test('all six application recipes export executable, self-contained HTML and JavaScript', async ({ page }) => {
  test.setTimeout(30_000)
  const recipes = [
    ['Segmented controls and selectable cards', 'selection-example', 'Show archived'],
    ['Advanced data table', 'table-selection-example', 'Task'],
    ['Multiple-selection form', 'multiple-selection-example', 'Reset topics'],
    ['Password, clear, and copy actions', 'input-actions-example', 'Show password'],
    ['Date range and preset', 'date-range-example', 'Last 7 days'],
    ['File queue and upload states', 'file-upload-example', 'Clear file queue'],
  ]
  for (const [name, id, action] of recipes) {
    await page.goto('/')
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: async text => { window.copiedRecipe = text },
      } })
    })
    await page.getByRole('button', { name: `Copy ${name.toLowerCase()} HTML + JavaScript`, exact: true }).click()
    const copied = await page.evaluate(() => window.copiedRecipe)
    expect(copied).toContain('<script type="module">')
    const errors = []
    const recordError = error => errors.push(error.message)
    page.on('pageerror', recordError)
    await page.route(`**/copied-${id}`, route => route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en"><head><title>Copied recipe</title><link rel="stylesheet" href="/src/style.css"></head><body><main data-sds-root>${copied}</main><script type="module" src="/src/auto.ts"></script></body></html>`,
    }))
    await page.goto(`/copied-${id}`)
    const form = page.locator(`#${id}`)
    await form.getByRole('button', { name: action, exact: true }).click()
    if (id === 'selection-example' || id === 'input-actions-example') {
      await expect(form.getByRole('button', { name: action, exact: true })).toHaveAttribute('aria-pressed', 'true')
    } else if (id === 'table-selection-example') {
      await expect(form.locator('th[aria-sort]')).toHaveAttribute('aria-sort', 'descending')
    } else if (id === 'multiple-selection-example') {
      await expect(form.getByRole('button', { name: 'Remove Research' })).toBeVisible()
    } else if (id === 'date-range-example') {
      await expect(form.locator('[name="start"]')).toHaveValue(/\d{4}-\d{2}-\d{2}/)
    } else {
      await expect(form.getByRole('status')).toHaveText('File queue cleared.')
    }
    expect(errors, name).toEqual([])
    page.off('pageerror', recordError)
  }
})

test('segmented state transitions animate normally and respect reduced motion', async ({ page }) => {
  const segment = page.locator('#selection-example .sds-segment').first()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const motion = await segment.evaluate(element => {
    const style = getComputedStyle(element)
    return { properties: style.transitionProperty, durations: style.transitionDuration.split(',').map(parseFloat) }
  })
  expect(motion.properties).toContain('background-color')
  expect(motion.properties).toContain('box-shadow')
  expect(Math.max(...motion.durations)).toBeGreaterThanOrEqual(0.15)
  expect(Math.max(...motion.durations)).toBeLessThanOrEqual(0.3)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const reduced = await segment.evaluate(element => getComputedStyle(element).transitionDuration.split(',').map(parseFloat))
  expect(Math.max(...reduced)).toBeLessThanOrEqual(0.001)
})
