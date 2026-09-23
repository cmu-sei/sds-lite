import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('filters suggestions and selects with keyboard without losing native form state', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('#project-combobox')
  const list = page.locator('#project-options')
  await input.evaluate((element) => {
    element.closest('sds-combobox').addEventListener('sds-select', (event) => {
      element.dataset.selectedOption = event.detail.option.id
    })
  })
  await input.fill('or')
  await expect(input).toHaveAttribute('aria-expanded', 'true')
  await expect(list.locator('li:visible')).toHaveCount(1)
  await input.press('ArrowDown')
  await expect(input).toHaveAttribute('aria-activedescendant', 'project-orion')
  await input.press('Enter')
  await expect(input).toHaveValue('Orion')
  await expect(input).toBeFocused()
  await expect(list).toBeHidden()
  await expect(input).toHaveAttribute('aria-expanded', 'false')
  await expect(input).toHaveAttribute('name', 'project')
  await expect(input).toHaveAttribute('data-selected-option', 'project-orion')
})

test('selects a rich record by its label and keeps its ID separate from the query', async ({ page }) => {
  await page.goto('/')
  const form = page.locator('#record-form')
  const input = page.locator('#record-combobox')
  const list = page.locator('#record-options')
  const id = page.locator('#record-id')

  await input.scrollIntoViewIfNeeded()
  await input.fill('engineering')
  await expect(id).toHaveValue('')
  await expect(list.getByRole('option', { name: /Vega.*Engineering.*Casey/ })).toBeVisible()
  await expect(list.locator('li:visible')).toHaveCount(1)
  const results = await new AxeBuilder({ page }).withTags([
    'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa',
  ]).analyze()
  expect(results.violations.map(({ id: violation, nodes }) => ({
    id: violation,
    targets: nodes.map(({ target }) => target),
  }))).toEqual([])
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(input).toHaveValue('')
  await expect(id).toHaveValue('p-vega')
  expect(await form.evaluate((element) => Object.fromEntries(new FormData(element)))).toEqual({
    projectQuery: '',
    projectId: 'p-vega',
  })
  await expect(page.locator('#record-selection')).toContainText('owner Casey (ID p-vega)')
  await expect(list).toBeHidden()

  await input.fill('Avery')
  await expect(id).toHaveValue('')
  await expect(page.locator('#record-selection')).toBeEmpty()
  await list.getByRole('option', { name: /Atlas.*Research.*Avery/ }).locator('small').click()
  await expect(input).toHaveValue('')
  await expect(id).toHaveValue('p-atlas')
  await form.evaluate((element) => element.reset())
  await expect(input).toHaveValue('')
  await expect(id).toHaveValue('')
  await expect(page.locator('#record-selection')).toBeEmpty()
})

test('the rich-record example clears its search while retaining the selected ID', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('#record-combobox')
  const id = page.locator('#record-id')
  const form = page.locator('#record-form')
  await input.scrollIntoViewIfNeeded()
  await input.fill('engineering')
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(input).toHaveValue('')
  await expect(id).toHaveValue('p-vega')
  await expect(page.locator('#record-selection')).toContainText('Vega')
  expect(await form.evaluate((element) => Object.fromEntries(new FormData(element)))).toEqual({
    projectQuery: '',
    projectId: 'p-vega',
  })
})

test('the tag-list example clears its search after adding a tag', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('#topic-combobox')
  await input.scrollIntoViewIfNeeded()
  await input.fill('a')
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(page.locator('#topic-tags').getByRole('button', { name: 'Remove Accessibility' })).toBeVisible()
  await expect(input).toHaveValue('')
})

test('rejects an empty rich-option label without selecting an ID', async ({ page }) => {
  const warnings = []
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text())
  })
  await page.goto('/')
  const input = page.locator('#record-combobox')
  await page.locator('#record-vega').evaluate((option) => {
    option.setAttribute('data-label', '  ')
  })
  await input.fill('engineering')
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(input).toHaveValue('engineering')
  await expect(page.locator('#record-id')).toHaveValue('')
  expect(warnings).toContain('<sds-combobox> option data-label must be nonempty.')
})

test('announces no matching options without adding a fake listbox option', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('#project-combobox')
  const list = page.locator('#project-options')
  const status = page.locator('sds-combobox:has(#project-combobox) > output')
  await input.fill('zzz')
  await expect(status).toHaveText('No matching projects.')
  await expect(page.getByRole('status').filter({ hasText: 'No matching projects.' })).toBeVisible()
  await expect(list).toBeHidden()
  await expect(input).toHaveAttribute('aria-expanded', 'false')
  await expect(input).not.toHaveAttribute('aria-activedescendant')
  const results = await new AxeBuilder({ page }).withTags([
    'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa',
  ]).analyze()
  expect(results.violations.map(({ id, nodes }) => ({
    id,
    targets: nodes.map(({ target }) => target),
  }))).toEqual([])

  await input.press('Escape')
  await expect(status).toBeEmpty()
  await expect(input).toHaveValue('zzz')
  await input.fill('or')
  await expect(status).toBeEmpty()
  await expect(list).toBeVisible()
  await input.fill('zzz')
  await expect(status).toHaveText('No matching projects.')
  await input.press('Tab')
  await expect(status).toBeEmpty()
  await input.fill('zzz')
  await expect(status).toHaveText('No matching projects.')
  await input.evaluate((element) => { element.disabled = true })
  await expect(status).toBeEmpty()
  await input.evaluate((element) => { element.disabled = false })
  await input.fill('')
  await expect(status).toBeEmpty()
})

test('empty results appear as a positioned dropdown outside clipped containers', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('#project-combobox')
  const status = page.locator('sds-combobox:has(#project-combobox) > output')
  await input.scrollIntoViewIfNeeded()
  const field = input.locator('..').locator('..')
  await field.evaluate((element) => {
    element.style.maxHeight = '3.5rem'
    element.style.overflow = 'hidden'
  })
  await input.fill('zzz')
  await expect(status).toHaveText('No matching projects.')
  const geometry = await status.evaluate((output) => {
    const inputRect = document.querySelector('#project-combobox').getBoundingClientRect()
    const outputRect = output.getBoundingClientRect()
    const fieldRect = output.closest('.sds-field').getBoundingClientRect()
    return {
      topGap: Math.abs(outputRect.top - inputRect.bottom),
      leftGap: Math.abs(outputRect.left - inputRect.left),
      outputWidth: outputRect.width,
      inputWidth: inputRect.width,
      escapesField: outputRect.bottom > fieldRect.bottom || outputRect.top < fieldRect.top,
    }
  })
  expect(geometry.topGap).toBeLessThan(8)
  expect(geometry.leftGap).toBeLessThan(8)
  expect(geometry.outputWidth).toBeGreaterThanOrEqual(geometry.inputWidth)
  expect(geometry.escapesField).toBe(true)
  await page.evaluate(() => {
    document.querySelector('.sds-app-body')?.scrollBy(0, 50)
  })
  await expect.poll(() => status.evaluate((output) => {
    const inputRect = document.querySelector('#project-combobox').getBoundingClientRect()
    const outputRect = output.getBoundingClientRect()
    return Math.min(
      Math.abs(outputRect.top - inputRect.bottom),
      Math.abs(inputRect.top - outputRect.bottom),
    )
  })).toBeLessThan(8)
})

test('keeps matching suggestions open while adding and removing tags', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('#topic-combobox')
  const list = page.locator('#topic-options')
  const tags = page.locator('#topic-tags')
  await input.scrollIntoViewIfNeeded()
  await input.fill('a')
  await expect(list.locator('li:visible')).toHaveCount(3)
  await input.evaluate((element) => {
    element.addEventListener('input', () => { element.dataset.selectedInput = 'fired' })
    element.addEventListener('change', () => { element.dataset.selectedChange = 'fired' })
  })
  await input.press('ArrowDown')
  await input.press('Enter')
  const accessibilityTag = tags.getByRole('button', { name: 'Remove Accessibility' })
  await expect(accessibilityTag).toHaveAttribute('data-sds-tone', 'danger')
  await expect(accessibilityTag.locator('a, button')).toHaveCount(0)
  await expect(accessibilityTag.locator('.sds-tag-action')).toHaveAttribute('aria-hidden', 'true')
  const restingBackground = await accessibilityTag.evaluate((tag) => getComputedStyle(tag).backgroundColor)
  await accessibilityTag.locator('.sds-tag-label').hover()
  const dangerColor = await accessibilityTag.locator('.sds-tag-action').evaluate((icon) => getComputedStyle(icon).color)
  await expect.poll(() => accessibilityTag.evaluate((tag) => getComputedStyle(tag).borderTopColor)).toBe(dangerColor)
  await expect.poll(() => accessibilityTag.evaluate((tag) => getComputedStyle(tag).color)).toBe(dangerColor)
  await expect.poll(() => accessibilityTag.evaluate((tag) => getComputedStyle(tag).backgroundColor)).not.toBe(restingBackground)
  await accessibilityTag.locator('.sds-tag-action').hover()
  await expect(accessibilityTag).toHaveCSS('border-top-color', dangerColor)
  await expect(input).toHaveValue('')
  await expect(input).toBeFocused()
  await expect(input).toHaveAttribute('aria-expanded', 'true')
  await expect(input).toHaveAttribute('data-selected-input', 'fired')
  await expect(input).toHaveAttribute('data-selected-change', 'fired')
  await expect(list).toBeVisible()
  await expect(page.locator('#topic-accessibility')).toHaveAttribute('aria-disabled', 'true')

  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(tags.getByRole('button', { name: 'Remove Architecture' })).toBeVisible()
  await expect(input).toHaveValue('')
  await expect(list).toBeVisible()
  const results = await new AxeBuilder({ page }).withTags([
    'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa',
  ]).analyze()
  expect(results.violations.map(({ id, nodes }) => ({
    id,
    targets: nodes.map(({ target }) => target),
  }))).toEqual([])
  await list.getByRole('option', { name: 'Automation' }).click()
  await expect(tags.getByRole('button', { name: 'Remove Automation' })).toBeVisible()
  await expect(input).toHaveValue('')
  await expect(list).toBeHidden()
  await expect(page.locator('#topic-picker > output')).toBeEmpty()

  await accessibilityTag.locator('.sds-tag-label').click()
  await expect(tags.getByRole('button', { name: 'Remove Accessibility' })).toHaveCount(0)
  await expect(page.locator('#topic-accessibility')).not.toHaveAttribute('aria-disabled', 'true')
  await expect(input).not.toBeFocused()
  await expect(list).toBeHidden()
  await input.fill('a')
  await expect(list).toBeVisible()
  await list.getByRole('option', { name: 'Accessibility' }).click()
  await expect(tags.getByRole('button', { name: 'Remove Accessibility' })).toBeVisible()
  await tags.getByRole('button', { name: 'Remove Architecture' }).focus()
  await tags.getByRole('button', { name: 'Remove Architecture' }).press('Space')
  await expect(tags.getByRole('button', { name: 'Remove Architecture' })).toHaveCount(0)
  await expect(input).not.toBeFocused()
  await input.fill('s')
  await expect(list).toBeVisible()
  await input.press('Escape')
  await expect(list).toBeHidden()
})

test('keep-open writes the selected suggestion to the input without losing other matches', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root) => {
    root.insertAdjacentHTML('afterbegin', `
      <label for="standalone-combobox">Topic</label>
      <sds-combobox keep-open>
        <input id="standalone-combobox" type="search">
        <ul hidden>
          <li>Accessibility</li>
          <li>Architecture</li>
          <li>Automation</li>
        </ul>
      </sds-combobox>
    `)
  })
  const input = page.locator('#standalone-combobox')
  const list = page.locator('sds-combobox:has(#standalone-combobox) > ul')
  await input.scrollIntoViewIfNeeded()
  await input.fill('a')
  await expect(list.locator('li:visible')).toHaveCount(3)
  await list.getByRole('option', { name: 'Accessibility' }).click()
  await expect(input).toHaveValue('Accessibility')
  await expect(list).toBeVisible()
  await expect(list.getByRole('option', { name: 'Architecture' })).toBeVisible()
  await expect(list.getByRole('option', { name: 'Automation' })).toBeVisible()
})

test('keep-open emits a rich label before the application clears the query', async ({ page }) => {
  await page.goto('/')
  const picker = page.locator('#record-picker')
  const input = page.locator('#record-combobox')
  const list = page.locator('#record-options')
  const id = page.locator('#record-id')
  await picker.evaluate((element) => element.setAttribute('keep-open', ''))
  await input.scrollIntoViewIfNeeded()
  await input.fill('a')
  await input.evaluate((element) => {
    element.dataset.events = ''
    element.addEventListener('input', () => { element.dataset.events += 'input,' })
    element.addEventListener('change', () => { element.dataset.events += 'change,' })
    element.closest('sds-combobox').addEventListener('sds-select', () => {
      element.dataset.events += 'select'
    })
  })
  await list.getByRole('option', { name: /Atlas/ }).click()
  await expect(input).toHaveValue('')
  await expect(input).toHaveAttribute('data-events', 'input,change,select')
  await expect(id).toHaveValue('p-atlas')
  await expect(list.getByRole('option', { name: /Vega/ })).toBeVisible()
  await input.fill('engineering')
  await expect(id).toHaveValue('')
  await expect(list.getByRole('option', { name: /Atlas/ })).toBeHidden()
  await expect(list.getByRole('option', { name: /Vega/ })).toBeVisible()
})

test('tag selection clears its query when keep-open is removed', async ({ page }) => {
  await page.goto('/')
  const picker = page.locator('#topic-picker')
  const input = page.locator('#topic-combobox')
  const list = page.locator('#topic-options')
  await picker.evaluate((element) => element.removeAttribute('keep-open'))
  await input.scrollIntoViewIfNeeded()
  await input.fill('arch')
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(page.locator('#topic-tags').getByRole('button', { name: 'Remove Architecture' })).toBeVisible()
  await expect(input).toHaveValue('')
  await expect(list).toBeHidden()
  await input.fill('a')
  await list.getByRole('option', { name: 'Accessibility' }).click()
  await expect(page.locator('#topic-tags').getByRole('button', { name: 'Remove Accessibility' })).toBeVisible()
  await expect(input).toHaveValue('')
  await expect(list).toBeHidden()
})

test('accepts application-supplied options, pointer selection, and escape', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('#remote-combobox')
  const list = page.locator('#team-options')
  await input.scrollIntoViewIfNeeded()
  await input.fill('eng')
  await expect(list.getByRole('option', { name: 'Engineering' })).toBeVisible()
  await list.getByRole('option', { name: 'Engineering' }).click()
  await expect(input).toHaveValue('Engineering')
  await expect(list).toBeHidden()
  await input.fill('')
  await expect(input).toHaveAttribute('aria-expanded', 'true')
  await input.press('Escape')
  await expect(input).toHaveAttribute('aria-expanded', 'false')
  await expect(list).toBeHidden()
})

test('registration preserves complete server markup after hydration', async ({ page }) => {
  await page.route('**/ssr-combobox', (route) => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html lang="en"><head><title>SSR combobox</title></head>
      <body data-sds-root><form>
        <label for="ssr-project">Project</label>
        <sds-combobox>
          <input id="ssr-project" name="project" type="search" role="combobox"
            aria-autocomplete="list" aria-controls="ssr-options" aria-expanded="false">
          <ul id="ssr-options" class="sds-combobox-list" role="listbox" popover="manual" hidden>
            <li id="ssr-atlas" role="option" aria-selected="false" data-label="Atlas" data-project-id="p-atlas">
              <strong>Atlas</strong> <small>Research</small>
            </li>
          </ul>
          <output data-empty-message="No projects found."></output>
        </sds-combobox>
      </form></body></html>`,
  }))
  await page.goto('/ssr-combobox')
  const combobox = page.locator('sds-combobox')
  const markup = await combobox.evaluate((element) => element.outerHTML)
  await expect(page.getByRole('combobox', { name: 'Project' })).toBeVisible()
  await expect(page.locator('#ssr-options')).toBeHidden()
  expect(await page.evaluate(() => customElements.get('sds-combobox'))).toBeUndefined()

  await page.evaluate(async () => {
    const { setupSds } = await import('/src/sds.ts')
    setupSds()
  })
  await expect(combobox).toHaveJSProperty('outerHTML', markup)
  await page.locator('#ssr-project').fill('zzz')
  await expect(combobox.locator('output')).toHaveText('No projects found.')
  await page.locator('#ssr-project').fill('atl')
  await expect(combobox.locator('output')).toBeEmpty()
  await page.locator('#ssr-project').press('ArrowDown')
  await page.locator('#ssr-project').press('Enter')
  expect(await page.locator('form').evaluate((form) =>
    new FormData(form).get('project'))).toBe('Atlas')
  await page.locator('form').evaluate((form) => form.reset())
  await expect(page.locator('#ssr-project')).toHaveValue('')
  await expect(page.locator('#ssr-options')).toBeHidden()
  await expect(combobox.locator('output')).toBeEmpty()
})

test('keeps the accessible list synchronized with option changes and disabled state', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('#remote-combobox')
  const list = page.locator('#team-options')
  const status = page.locator('sds-combobox:has(#remote-combobox) > output')
  await list.evaluate((element) => element.setAttribute('aria-busy', 'true'))
  await input.fill('zzz')
  await expect(input).toHaveAttribute('aria-expanded', 'false')
  await expect(status).toBeEmpty()
  await list.evaluate((element) => element.setAttribute('aria-busy', 'false'))
  await expect(status).toHaveText('No results found.')
  await page.evaluate(() => {
    const option = document.createElement('li')
    option.textContent = 'Zzz team'
    document.querySelector('#team-options').append(option)
  })
  await expect(status).toBeEmpty()
  await expect(input).toHaveAttribute('aria-expanded', 'true')
  await input.press('ArrowDown')
  await expect(input).toHaveAttribute('aria-activedescendant', /sds-combobox-option-/)
  await input.evaluate((element) => { element.disabled = true })
  await expect(list).toBeHidden()
  await expect(input).toHaveAttribute('aria-expanded', 'false')
})

test('open suggestions have no detectable accessibility violations', async ({ page }) => {
  await page.goto('/')
  await page.locator('#project-combobox').fill('or')
  const results = await new AxeBuilder({ page }).withTags([
    'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa',
  ]).analyze()
  expect(results.violations.map(({ id, nodes }) => ({
    id,
    targets: nodes.map(({ target }) => target),
  }))).toEqual([])
})

test('skips unavailable suggestions and leaves free text intact on Tab', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('#project-combobox')
  await page.locator('#project-orion').evaluate((option) =>
    option.setAttribute('aria-disabled', 'true'))
  await input.fill('')
  await input.press('ArrowUp')
  await expect(input).toHaveAttribute('aria-activedescendant', 'project-vega')
  await input.fill('or')
  await expect(input).toHaveAttribute('aria-expanded', 'false')
  await input.press('Tab')
  await expect(input).toHaveValue('or')
})

test('suggestions escape an overflowing container and follow scrolling', async ({ page }) => {
  await page.goto('/')
  const input = page.locator('#project-combobox')
  await input.scrollIntoViewIfNeeded()
  await input.locator('..').locator('..').evaluate((field) => {
    field.style.maxHeight = '6rem'
    field.style.overflow = 'hidden'
  })
  await input.fill('a')
  const list = page.locator('#project-options')
  await expect(list).toBeVisible()
  expect(await list.evaluate((element) => {
    const listRect = element.getBoundingClientRect()
    const fieldRect = element.parentElement.parentElement.getBoundingClientRect()
    return listRect.bottom > fieldRect.bottom || listRect.top < fieldRect.top
  })).toBe(true)
  await page.evaluate(() => {
    document.querySelector('.sds-app-body')?.scrollBy(0, 50)
  })
  await expect.poll(() => list.evaluate((element) => {
    const inputRect = document.querySelector('#project-combobox').getBoundingClientRect()
    const listRect = element.getBoundingClientRect()
    return Math.min(
      Math.abs(listRect.top - inputRect.bottom),
      Math.abs(inputRect.top - listRect.bottom),
    )
  })).toBeLessThan(8)
})
