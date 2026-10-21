import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
})

test('the catalog uses only public SDS classes and keeps each preview and copy action together', async ({ page }) => {
  const manifest = await readFile('interface-manifest.json', 'utf8')
  const classes = [...new Set(manifest.match(/\bsds-[\w-]+/g))]
  const unknown = await page.locator('main#top, #catalog-sidebar').evaluateAll((roots, classes) => {
    const allowed = new Set(classes)
    return [...new Set(roots.flatMap(root => [root, ...root.querySelectorAll('*')])
      .flatMap(element => [...element.classList]).filter(name => !allowed.has(name)))]
  }, classes)
  expect(unknown).toEqual([])
  await expect(page.locator('style:not([data-vite-dev-id]), [style]')).toHaveCount(0)
  for (const style of await page.locator('style[data-vite-dev-id]').all()) {
    await expect(style).toHaveAttribute('data-vite-dev-id', /\/src\/(?:style|brand)\.css$/)
  }
  const examples = page.locator('[data-example-container]')
  expect(await examples.count()).toBeGreaterThan(30)
  for (const example of await examples.all()) {
    const tools = example.locator(':scope > [data-example-tools]')
    await expect(tools.locator('h3, h4')).toHaveCount(1)
    const source = example.locator(':scope > [data-example-source]').first()
    await expect(source).not.toHaveAttribute('open')
    const order = await example.evaluate(element => {
      const tools = element.querySelector(':scope > [data-example-tools]')
      const preview = element.querySelector(':scope > [data-example-preview], :scope > details:not([data-example-source])')
      const source = element.querySelector(':scope > [data-example-source]')
      return Boolean(tools.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(preview.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING)
    })
    expect(order).toBe(true)
    for (const control of await tools.locator('[data-copy-target]').all()) {
      const id = await control.getAttribute('data-copy-target')
      await expect(example.locator(`#${id}`)).toHaveCount(1)
    }
  }
})

test('recipe links and the overview search reach individual examples with category context', async ({ page }) => {
  for (const link of await page.locator('#recipes .sds-card-link').all()) {
    const hash = await link.getAttribute('href')
    await expect(page.locator(`${hash}[data-example-container]`)).toHaveCount(1)
  }
  const search = page.getByRole('searchbox', { name: 'Search all examples' })
  await search.fill('upload')
  const upload = page.locator('#playground-results a[href="#file-upload-recipe"]')
  await expect(upload).toBeVisible()
  await expect(upload.locator('../..').locator('p')).toContainText('Application recipe')
  await upload.focus()
  await upload.press('Enter')
  const tools = page.locator('#file-upload-recipe > [data-example-tools]')
  await expect(tools).toBeFocused()
  const headerBottom = await page.locator('body > .sds-app > .sds-app-header')
    .evaluate(element => element.getBoundingClientRect().bottom)
  const target = await page.locator('#file-upload-recipe').boundingBox()
  expect(target.y).toBeGreaterThanOrEqual(headerBottom - 1)
  await search.fill('directory')
  await expect(page.locator('#playground-results a')).toHaveCount(1)
  await expect(page.locator('#playground-results a')).toHaveText('Directory')
  await expect(page.locator('#playground-results p')).toContainText('Page pattern')
  await expect(page.locator('#catalog-sections')).toBeVisible()
  await search.fill('')
  await expect(page.locator('#playground-results')).toBeHidden()
})

for (const width of [1440, 320]) {
  test(`section example navigation is compact, wraps, and supports keyboard navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    const indexes = page.locator('[data-example-index]')
    await expect(indexes).toHaveCount(8)
    for (const index of await indexes.all()) {
      await expect(index).toHaveRole('navigation')
      await expect(index).toHaveAttribute('aria-label', /.+ examples$/)
      await expect(index.locator('summary')).toHaveCount(0)
      const group = index.locator(':scope > .sds-cluster')
      await expect(group).toHaveCSS('gap', '8px')
      const bounds = await index.boundingBox()
      for (const link of await group.getByRole('link').all()) {
        await expect(link).toBeVisible()
        await expect(link).toHaveCSS('min-height', '32px')
        await expect(link).toHaveCSS('text-decoration-line', 'none')
        const target = await link.getAttribute('href')
        await expect(page.locator(`${target}[data-example-container]`)).toHaveCount(1)
        const box = await link.boundingBox()
        expect(box.x).toBeGreaterThanOrEqual(bounds.x - 1)
        expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1)
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const directory = page.locator('#patterns > [data-example-index]').getByRole('link', { name: 'Directory', exact: true })
    const hash = await directory.getAttribute('href')
    await directory.focus()
    await directory.press('Enter')
    await expect(page).toHaveURL(new RegExp(`${hash}$`))
    await expect(page.locator(`${hash} > [data-example-tools]`)).toBeFocused()
  })
}

test('example tools fit mobile screens and copying failure reveals the selectable source', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#file-upload-recipe')
  const example = page.locator('#file-upload-recipe')
  const tools = example.locator(':scope > [data-example-tools]')
  const button = tools.getByRole('button', { name: /Copy file queue/ })
  const bounds = await button.boundingBox()
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390)
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: async () => { throw new Error('Clipboard unavailable for test') } },
  }))
  await button.click()
  const source = example.locator(':scope > [data-example-source]')
  await expect(source).toHaveAttribute('open')
  await expect(source.locator('summary')).toBeFocused()
  await source.locator('pre').scrollIntoViewIfNeeded()
  await source.locator('summary').press('Tab')
  await expect(source.locator('pre')).toBeFocused()
  await expect(source.locator('code')).toContainText('new XMLHttpRequest()')
  await expect(page.locator('#copy-status')).toContainText('could not copy')
  await page.setViewportSize({ width: 320, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

for (const width of [1440, 390]) {
  test(`collapsed playground groups highlight their active descendant and clear when navigation changes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    if (width === 390) await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
    const navigation = page.getByRole('navigation', { name: 'Playground sections' })
    const active = navigation.locator('a[aria-current="location"]')
    await expect(active).toHaveAttribute('href', '#overview')
    const group = navigation.locator('details').filter({ has: page.locator('a[href="#overview"]') })
    const summary = group.locator(':scope > summary')
    const restingBackground = await summary.evaluate(element => getComputedStyle(element).backgroundColor)
    const activeBackground = await active.evaluate(element => getComputedStyle(element).backgroundColor)
    const activeEdge = await active.evaluate(element => getComputedStyle(element).borderInlineStartColor)
    await summary.focus()
    await summary.press('Enter')
    await expect(group).not.toHaveAttribute('open')
    await expect(summary).toHaveCSS('background-color', activeBackground)
    await expect(summary).toHaveCSS('border-inline-start-color', activeEdge)
    await summary.press('Enter')
    await expect(summary).toHaveCSS('background-color', restingBackground)
    await summary.press('Enter')
    await page.goto('/#actions')
    await expect(active).toHaveAttribute('href', '#actions')
    await expect(group).not.toHaveAttribute('open')
    await expect(summary).toHaveCSS('background-color', restingBackground)
    const components = navigation.locator('details').filter({ has: page.locator('a[href="#actions"]') })
    await components.locator(':scope > summary').focus()
    await components.locator(':scope > summary').press('Enter')
    await expect(components.locator(':scope > summary')).toHaveCSS('background-color', activeBackground)
    await expect(navigation.locator('summary[aria-current]')).toHaveCount(0)
  })
}

for (const variant of ['standalone', 'application', 'documentation']) {
  test(`shipped ${variant} sidebar gives collapsed nested groups identical page and location indicators`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    const host = variant === 'standalone' ? '' : `class="sds-app" data-sds-variant="${variant}"`
    await page.setContent(`<main data-sds-root><div ${host}>
      <aside class="sds-sidebar"><nav aria-label="Nested pages"><ul><li>
        <details id="parent" open><summary>Parent</summary><ul><li>
          <details id="nested" open><summary>Nested</summary><ul><li>
            <a href="#selected">Selected</a>
          </li></ul></details>
        </li></ul></details>
      </li></ul></nav></aside>
    </div></main>`)
    await page.addStyleTag({ path: 'dist/sds.css' })
    const link = page.locator('a[href="#selected"]')
    await expect(link).toHaveCSS('font-size', '14px')
    await expect(link).toHaveCSS('font-weight', '400')
    await expect(link).toHaveCSS('padding-inline-start', variant === 'documentation' ? '8px' : '24px')
    for (const summary of await page.locator('summary').all()) {
      await expect(summary).toHaveCSS('font-size', '14px')
      await expect(summary).toHaveCSS('font-weight', '600')
      await expect(summary).toHaveCSS('text-transform', 'none')
      const mutedColor = await link.evaluate(element => getComputedStyle(element).color)
      await expect(summary).not.toHaveCSS('color', mutedColor)
    }
    const appearance = summary => summary.evaluate(element => {
      const style = getComputedStyle(element)
      const indicator = getComputedStyle(element, '::before')
      return {
        color: style.color,
        background: style.backgroundColor,
        edge: style.borderInlineStartColor,
        weight: style.fontWeight,
        indicator: [indicator.content, indicator.backgroundColor, indicator.inlineSize, indicator.insetInlineStart],
      }
    })
    for (const id of ['nested', 'parent']) {
      const group = page.locator(`#${id}`)
      const summary = group.locator(':scope > summary')
      const resting = await appearance(summary)
      await group.evaluate(element => { element.open = false })
      await link.evaluate(element => element.setAttribute('aria-current', 'page'))
      const pageIndicator = await appearance(summary)
      expect(pageIndicator).not.toEqual(resting)
      await link.evaluate(element => element.removeAttribute('aria-current'))
      expect(await appearance(summary)).toEqual(resting)
      await link.evaluate(element => element.setAttribute('aria-current', 'location'))
      expect(await appearance(summary)).toEqual(pageIndicator)
      await group.evaluate(element => { element.open = true })
      expect(await appearance(summary)).toEqual(resting)
      await link.evaluate(element => element.removeAttribute('aria-current'))
    }
  })
}

for (const width of [1440, 390]) {
  test(`playground sidebar uses exactly the default persistent and application sidebar spacing at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    const catalog = page.locator('#catalog-sidebar')
    const persistent = page.getByRole('navigation', { name: 'Project navigation', exact: true }).locator('..')
    const application = page.locator('#application-preview-sidebar')
    await application.evaluate(element => { element.closest('details').open = true })
    const spacing = (locator, properties) => locator.evaluate((element, properties) => {
      const style = getComputedStyle(element)
      return Object.fromEntries(properties.map(property => [property, style[property]]))
    }, properties)
    const padding = ['paddingBlockStart', 'paddingBlockEnd', 'paddingInlineStart', 'paddingInlineEnd']
    const rows = ['minBlockSize', 'fontSize', 'fontFamily', 'lineHeight', 'alignItems', 'borderInlineStartWidth', 'paddingBlockStart', 'paddingBlockEnd']
    expect(await spacing(catalog.locator(':scope > header'), [...padding, 'gap']))
      .toEqual(await spacing(application.locator(':scope > header'), [...padding, 'gap']))
    for (const reference of [persistent, application]) {
      expect(await spacing(catalog.locator(':scope > nav > ul'), [...padding, 'gap', 'display']))
        .toEqual(await spacing(reference.locator(':scope > nav > ul'), [...padding, 'gap', 'display']))
    }
    const summary = catalog.locator('summary').first()
    expect(await spacing(summary, [...rows, 'paddingInlineStart', 'paddingInlineEnd']))
      .toEqual(await spacing(persistent.locator('summary'), [...rows, 'paddingInlineStart', 'paddingInlineEnd']))
    expect(await spacing(summary, rows))
      .toEqual(await spacing(application.locator('nav a').first(), rows))
    expect(await spacing(catalog.locator('nav a').first(), rows))
      .toEqual(await spacing(application.locator('nav a').first(), rows))
    expect(await spacing(catalog.locator('nav a').first(), [...rows, 'paddingInlineStart', 'paddingInlineEnd']))
      .toEqual(await spacing(persistent.locator('details a').first(), [...rows, 'paddingInlineStart', 'paddingInlineEnd']))
    await expect(catalog).not.toHaveAttribute('data-sds-density')
  })
}

test('sidebar groups align their headings and links and work with the keyboard', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const sidebar = page.locator('#catalog-sidebar')
  const navigation = sidebar.getByRole('navigation', { name: 'Playground sections' })
  const groups = navigation.locator('#catalog-sections > li > details')
  await expect(groups).toHaveCount(3)
  await expect(sidebar.getByRole('searchbox')).toHaveCount(0)
  await expect(sidebar.locator('input, #catalog-results, #catalog-search-status')).toHaveCount(0)
  await expect(navigation.locator('#catalog-sections')).toHaveCSS('gap', 'normal')
  for (let index = 1; index < await groups.count(); index++) {
    const previous = await groups.nth(index - 1).boundingBox()
    const current = await groups.nth(index).boundingBox()
    expect(Math.abs(current.y - previous.y - previous.height)).toBeLessThanOrEqual(1)
  }
  await expect(navigation).toHaveCSS('font-size', '14px')
  for (const group of await groups.all()) {
    const summary = group.locator(':scope > summary')
    const link = group.locator('a').first()
    await expect(summary).toHaveCSS('font-size', '14px')
    await expect(summary).toHaveCSS('font-weight', '600')
    const textColor = await sidebar.evaluate(element => getComputedStyle(element).color)
    await expect(summary).toHaveCSS('color', textColor)
    await expect(link).toHaveCSS('font-size', '14px')
    await expect(link).toHaveCSS('padding-inline-start', '24px')
    await expect(link).toHaveCSS('font-weight', /400|600/)
    const title = await summary.boundingBox()
    const bounds = await link.boundingBox()
    const textStart = await link.evaluate(element => {
      const range = document.createRange()
      range.selectNodeContents(element)
      return range.getBoundingClientRect().x
    })
    const headingStart = await summary.evaluate(element => {
      const range = document.createRange()
      range.selectNodeContents(element)
      return range.getBoundingClientRect().x
    })
    expect(textStart - headingStart).toBeCloseTo(12, 0)
    await expect(summary).toHaveCSS('height', '40px')
    await expect(link).toHaveCSS('height', '40px')
    expect(bounds.y - title.y).toBeLessThanOrEqual(48)
  }
  const first = groups.first()
  const summary = first.locator(':scope > summary')
  await summary.focus()
  await summary.press('Enter')
  await expect(first).not.toHaveAttribute('open')
  const collapsed = await first.boundingBox()
  const next = await groups.nth(1).boundingBox()
  expect(Math.abs(next.y - collapsed.y - collapsed.height)).toBeLessThanOrEqual(1)
  await summary.press('Enter')
  const overview = first.getByRole('link', { name: 'Overview', exact: true })
  if (browserName === 'webkit') await overview.focus()
  else await summary.press('Tab')
  await expect(overview).toBeFocused()
  await overview.press('Enter')
  await expect(page).toHaveURL(/#overview$/)
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 })
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
    await expect(sidebar).toBeVisible()
    expect(await sidebar.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.keyboard.press('Escape')
    await expect(sidebar).not.toBeVisible()
  }
})

test('compact sidebar density ships for standalone and application layouts without changing defaults', async ({ page }) => {
  for (const variant of ['standalone', 'application', 'documentation']) {
    const host = variant === 'standalone' ? '' : `class="sds-app" data-sds-variant="${variant}"`
    await page.setContent(`<main data-sds-root><div ${host}>
      <aside class="sds-sidebar" data-sds-density="compact">
        <nav aria-label="Example">
          <ul><li><details open><summary>Components</summary><ul>
            <li><a href="#example" aria-current="page">Overview</a></li>
          </ul></details></li></ul>
        </nav>
      </aside>
    </div></main>`)
    await page.addStyleTag({ path: 'dist/sds.css' })
    const sidebar = page.locator('.sds-sidebar')
    const link = sidebar.getByRole('link', { name: 'Overview' })
    await expect(link).toHaveCSS('height', '32px')
    await expect(sidebar.locator('summary')).toHaveCSS('height', '32px')
    await expect(link).toHaveCSS('font-size', '14px')
    await sidebar.evaluate(element => element.removeAttribute('data-sds-density'))
    await expect(link).toHaveCSS('height', variant === 'documentation' ? '32px' : '40px')
  }
})
