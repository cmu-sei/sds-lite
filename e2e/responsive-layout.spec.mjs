import { expect, test } from '@playwright/test'

const gridColumnWidths = {
  sm: 160,
  md: 224,
  lg: 288,
  xl: 384,
  '2xl': 512,
}

const clusterStackWidths = {
  sm: 480,
  md: 640,
  lg: 768,
  xl: 1024,
}

test('sidebar marks the section currently visible in its scroll container', async ({
  page,
}) => {
  await page.goto('/')

  const currentLink = page.locator(
    '.sds-sidebar > nav a[aria-current="location"]',
  )
  await expect(currentLink).toHaveAttribute('href', '#overview')

  await page.locator('.sds-sidebar > nav a[href="#actions"]').click()
  await expect(currentLink).toHaveAttribute('href', '#actions')

  await page.locator('.sds-sidebar > nav a[href="#forms"]').click()
  await expect(currentLink).toHaveAttribute('href', '#forms')
})

test('Overview actions stack on mobile and share a row on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.locator('#overview .sds-callout')).toHaveCount(0)
  const nextSection = page.locator('#getting-started')
  expect((await nextSection.boundingBox()).y).toBeLessThan(844)

  const group = page.locator('#overview > .sds-cluster')
  const actions = group.locator(':scope > a')
  await expect(actions).toHaveCount(2)
  const geometry = await actions.evaluateAll((links) =>
    links.map((link) => {
      const rect = link.getBoundingClientRect()
      return { width: rect.width, center: rect.left + rect.width / 2, top: rect.top }
    }),
  )

  expect(geometry[0].top).toBeLessThan(geometry[1].top)
  expect(Math.abs(geometry[0].width - geometry[1].width)).toBeLessThan(1)
  expect(Math.abs(geometry[0].center - geometry[1].center)).toBeLessThan(1)

  await page.setViewportSize({ width: 1280, height: 900 })
  expect((await nextSection.boundingBox()).y).toBeLessThan(900)
  const desktopGeometry = await actions.evaluateAll((links) =>
    links.map((link) => {
      const rect = link.getBoundingClientRect()
      return { width: rect.width, top: rect.top }
    }),
  )

  expect(Math.abs(desktopGeometry[0].top - desktopGeometry[1].top)).toBeLessThan(1)
  expect(desktopGeometry[0].width).toBeLessThan(await group.evaluate((element) => element.getBoundingClientRect().width))
})

test('playground page tracks and table captions stay within their mobile containers', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const sections = await page.locator('.sds-page').first().locator(':scope > section').evaluateAll((elements) =>
    elements.map((element) => ({ right: element.getBoundingClientRect().right, width: element.getBoundingClientRect().width })),
  )
  for (const section of sections) {
    expect(section.right).toBeLessThanOrEqual(374)
    expect(section.width).toBeLessThanOrEqual(358)
  }
  await expect(page.locator('.sds-table caption').first()).toHaveCSS('box-sizing', 'border-box')
  const bodyGeometry = await page.locator('.sds-app-body').first().evaluate((element) =>
    ({ width: element.clientWidth, scrollWidth: element.scrollWidth }),
  )
  expect(bodyGeometry.scrollWidth).toBe(bodyGeometry.width)
})

test('page header action links share the available width on narrow screens', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const actions = page.locator(
    '.sds-page-header > .sds-action-group > .sds-button',
  )
  await expect(actions).toHaveCount(2)

  const widths = await actions.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().width),
  )
  expect(Math.abs(widths[0] - widths[1])).toBeLessThan(1)
})

test('grid columns respond to their available width', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => {
    const grid = document.createElement('div')
    grid.id = 'responsive-grid'
    grid.className = 'sds-grid'
    grid.dataset.sdsMinColumnWidth = 'lg'
    grid.style.width = '600px'
    grid.replaceChildren(
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div'),
    )
    document.querySelector('[data-sds-root]')?.append(grid)
  })

  const grid = page.locator('#responsive-grid')
  const columnCount = () =>
    grid.evaluate(
      (element) =>
        getComputedStyle(element).gridTemplateColumns.split(' ').length,
    )

  await expect.poll(columnCount).toBe(2)

  await grid.evaluate((element) => {
    element.style.width = '280px'
  })
  await expect.poll(columnCount).toBe(1)

  await grid.evaluate((element) => {
    element.style.width = '600px'
    element.dataset.sdsMinColumnWidth = 'sm'
  })
  await expect.poll(columnCount).toBe(3)
})

test('column count caps a grid while the minimum controls collapse', async ({
  page,
}) => {
  await page.goto('/')

  await page.evaluate(() => {
    const grid = document.createElement('div')
    grid.id = 'explicit-grid'
    grid.className = 'sds-grid'
    grid.dataset.sdsColumns = '3'
    grid.dataset.sdsMinColumnWidth = 'lg'
    grid.style.width = '1000px'
    grid.replaceChildren(
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div'),
    )
    document.querySelector('[data-sds-root]')?.append(grid)
  })

  const grid = page.locator('#explicit-grid')
  const columnCount = () =>
    grid.evaluate(
      (element) =>
        getComputedStyle(element).gridTemplateColumns.split(' ').length,
    )

  await expect.poll(columnCount).toBe(3)

  await grid.evaluate((element) => {
    element.style.width = '600px'
  })
  await expect.poll(columnCount).toBe(2)

  await grid.evaluate((element) => {
    element.style.width = '280px'
  })
  await expect.poll(columnCount).toBe(1)

  await grid.evaluate((element) => {
    delete element.dataset.sdsMinColumnWidth
  })
  await expect.poll(columnCount).toBe(3)

})

test('component and layout size presets map to their documented dimensions', async ({
  page,
}) => {
  await page.goto('/')

  const dimensions = await page.evaluate(() => {
    const style = (selector) => getComputedStyle(document.querySelector(selector))
    const size = (selector) =>
      document.querySelector(selector).getBoundingClientRect()

    return {
      avatar2xl: size('.sds-avatar[data-sds-size="2xl"]').width,
      buttonXs: size('#button-sizes [data-sds-size="xs"]').height,
      calloutLgPadding: style(
        '.sds-callout[data-sds-size="lg"]',
      ).paddingTop,
      datapointXl: style(
        '.sds-datapoint[data-sds-size="xl"] strong',
      ).fontSize,
      fileActionLg: style(
        '.sds-file-upload[data-sds-size="lg"] .sds-file-upload-action',
      ).fontSize,
      fileSurfaceLgPadding: style(
        '.sds-file-upload[data-sds-size="lg"] .sds-file-upload-surface',
      ).paddingTop,
      cluster3xlGap: style('.sds-cluster[data-sds-gap="3xl"]').gap,
      cluster4xlGap: style('.sds-cluster[data-sds-gap="4xl"]').gap,
      grid4xlGap: style('.sds-grid[data-sds-gap="4xl"]').gap,
      linkMd: style(
        '[role="group"][aria-label="Link sizes"] [data-sds-size="md"]',
      ).fontSize,
      proseLg: style('.sds-prose[data-sds-size="lg"]').fontSize,
      spinnerLg: style('.sds-spinner[data-sds-size="lg"]').width,
      spinnerMd: style(
        '.sds-spinner[aria-label="Loading medium"]',
      ).width,
      spinnerSm: style('.sds-spinner[data-sds-size="sm"]').width,
      spinnerXl: style('.sds-spinner[data-sds-size="xl"]').width,
      tableLgBodyPadding: style(
        '#content .sds-table[data-sds-size="lg"] tbody td',
      ).paddingTop,
      tableLgHeadPadding: style(
        '#content .sds-table[data-sds-size="lg"] thead th',
      ).paddingTop,
      tableSmBodyPadding: style(
        '#content .sds-table[data-sds-size="sm"] tbody td',
      ).paddingTop,
      tableSmHeadPadding: style(
        '#content .sds-table[data-sds-size="sm"] thead th',
      ).paddingTop,
    }
  })

  expect(dimensions).toEqual({
    avatar2xl: 128,
    buttonXs: 24,
    calloutLgPadding: '24px',
    datapointXl: '64px',
    fileActionLg: '16px',
    fileSurfaceLgPadding: '32px',
    cluster3xlGap: '48px',
    cluster4xlGap: '64px',
    grid4xlGap: '64px',
    linkMd: '16px',
    proseLg: '18px',
    spinnerLg: '48px',
    spinnerMd: '24px',
    spinnerSm: '16px',
    spinnerXl: '80px',
    tableLgBodyPadding: '16px',
    tableLgHeadPadding: '16px',
    tableSmBodyPadding: '4px',
    tableSmHeadPadding: '4px',
  })
})

test('cluster children stack based on container width', async ({ page }) => {
  await page.goto('/')

  await page.evaluate(() => {
    const cluster = document.createElement('div')
    cluster.id = 'responsive-cluster'
    cluster.className = 'sds-cluster'
    cluster.dataset.sdsStackAt = 'md'
    cluster.style.width = '41rem'
    cluster.append(
      Object.assign(document.createElement('div'), { textContent: 'First' }),
      Object.assign(document.createElement('div'), { textContent: 'Second' }),
    )
    document.querySelector('[data-sds-root]')?.append(cluster)
  })

  const cluster = page.locator('#responsive-cluster')
  const childrenShareRow = () =>
    cluster.locator(':scope > div').evaluateAll(
      ([first, second]) => first.offsetTop === second.offsetTop,
    )

  await expect.poll(childrenShareRow).toBe(true)

  await cluster.evaluate((element) => {
    element.style.width = '39rem'
  })
  await expect.poll(childrenShareRow).toBe(false)
})

test('layout primitives shrink within their parent and preserve their axes', async ({
  page,
}) => {
  await page.goto('/')

  await page.evaluate(() => {
    const parent = document.createElement('div')
    parent.id = 'constrained-layout-parent'
    parent.style.display = 'flex'
    parent.style.width = '240px'

    for (const name of ['grid', 'cluster', 'stack']) {
      const layout = document.createElement('div')
      layout.id = `constrained-${name}`
      layout.className = `sds-${name}`
      layout.dataset.sdsGap = 'lg'
      layout.style.flex = '1 1 auto'
      layout.append(
        Object.assign(document.createElement('div'), {
          textContent: 'Unbreakable-content-that-must-not-size-the-layout',
        }),
        document.createElement('div'),
      )
      parent.append(layout)
    }

    document.querySelector('[data-sds-root]')?.append(parent)
  })

  const parent = page.locator('#constrained-layout-parent')
  const grid = page.locator('#constrained-grid')
  const cluster = page.locator('#constrained-cluster')
  const stack = page.locator('#constrained-stack')

  for (const layout of [grid, cluster, stack]) {
    await expect(layout).toHaveCSS('min-inline-size', '0px')
    await expect(layout).toHaveCSS('gap', '16px')
    expect(await layout.evaluate((element) => element.offsetWidth)).toBeLessThan(
      await parent.evaluate((element) => element.offsetWidth),
    )
  }

  await expect(grid).toHaveCSS('display', 'grid')
  await expect(cluster).toHaveCSS('display', 'flex')
  await expect(cluster).toHaveCSS('flex-direction', 'row')
  await expect(cluster).toHaveCSS('flex-wrap', 'wrap')
  await expect(stack).toHaveCSS('display', 'flex')
  await expect(stack).toHaveCSS('flex-direction', 'column')
})

test('the playground demonstrates wrapping and responsive clusters', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/#composition')

  const wrappingExample = page.locator('#cluster-example')
  await expect(wrappingExample).toHaveCSS('display', 'flex')
  await expect(wrappingExample).toHaveCSS('flex-wrap', 'wrap')
  await expect(wrappingExample).toHaveCSS('gap', '8px')

  const actions = page.locator('#cluster-stack-example > button')
  const shareRow = () =>
    actions.evaluateAll(
      ([first, second]) => first.offsetTop === second.offsetTop,
    )

  await expect.poll(shareRow).toBe(true)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(shareRow).toBe(false)
})

test('timelines support vertical and keyboard-reachable horizontal layouts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#content')

  const vertical = page.locator(
    '.sds-timeline[data-sds-orientation="vertical"]',
  )
  const verticalItems = vertical.locator(':scope > .sds-timeline-item')
  const verticalPositions = await verticalItems.evaluateAll((items) =>
    items.slice(0, 2).map((item) => ({
      left: item.getBoundingClientRect().left,
      top: item.getBoundingClientRect().top,
    })),
  )
  expect(verticalPositions[1].top).toBeGreaterThan(verticalPositions[0].top)
  expect(verticalPositions[1].left).toBe(verticalPositions[0].left)

  const horizontal = page.getByRole('list', { name: 'Release progress' })
  const horizontalItems = horizontal.locator(':scope > .sds-timeline-item')
  await expect(horizontal).toHaveAttribute('data-sds-orientation', 'horizontal')
  await expect(horizontal).toHaveAttribute('tabindex', '0')
  await expect(horizontal).toHaveCSS('grid-auto-flow', 'column')
  await expect(horizontal).toHaveCSS('overflow-x', 'auto')

  const horizontalLayout = await horizontal.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  expect(horizontalLayout.scrollWidth).toBeGreaterThan(horizontalLayout.clientWidth)

  const horizontalPositions = await horizontalItems.evaluateAll((items) =>
    items.slice(0, 2).map((item) => ({
      left: item.getBoundingClientRect().left,
      top: item.getBoundingClientRect().top,
    })),
  )
  expect(horizontalPositions[1].left).toBeGreaterThan(horizontalPositions[0].left)
  expect(horizontalPositions[1].top).toBe(horizontalPositions[0].top)

  await horizontal.focus()
  await expect(horizontal).toBeFocused()
})

test('responsive size names map to every documented threshold', async ({
  page,
}) => {
  await page.goto('/')

  const results = await page.evaluate(
    async ({ gridColumnWidths, clusterStackWidths }) => {
      const root = document.querySelector('[data-sds-root]')
      const nextLayout = () =>
        new Promise((resolve) => requestAnimationFrame(() => resolve()))
      const actual = { grid: {}, gridCaps: {}, cluster: {} }

      const grid = document.createElement('div')
      grid.className = 'sds-grid'
      grid.style.width = '1000px'
      for (let index = 0; index < 10; index += 1) {
        grid.append(document.createElement('div'))
      }
      root?.append(grid)

      for (const size of Object.keys(gridColumnWidths)) {
        grid.dataset.sdsMinColumnWidth = size
        await nextLayout()
        actual.grid[size] =
          getComputedStyle(grid).gridTemplateColumns.split(' ').length
      }

      grid.dataset.sdsMinColumnWidth = 'sm'
      grid.style.width = '1200px'
      for (const columns of ['1', '2', '3', '4', '5', '6']) {
        grid.dataset.sdsColumns = columns
        await nextLayout()
        actual.gridCaps[columns] =
          getComputedStyle(grid).gridTemplateColumns.split(' ').length
      }

      const cluster = document.createElement('div')
      cluster.className = 'sds-cluster'
      cluster.append(document.createElement('div'), document.createElement('div'))
      root?.append(cluster)

      for (const [size, threshold] of Object.entries(clusterStackWidths)) {
        cluster.dataset.sdsStackAt = size
        cluster.style.width = `${threshold + 16}px`
        await nextLayout()
        const [first, second] = cluster.children
        const above = first.offsetTop === second.offsetTop

        cluster.style.width = `${threshold - 16}px`
        await nextLayout()
        actual.cluster[size] = {
          above,
          below: first.offsetTop !== second.offsetTop,
        }
      }

      return actual
    },
    { gridColumnWidths, clusterStackWidths },
  )

  expect(results).toEqual({
    grid: { sm: 5, md: 4, lg: 3, xl: 2, '2xl': 1 },
    gridCaps: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 },
    cluster: {
      sm: { above: true, below: true },
      md: { above: true, below: true },
      lg: { above: true, below: true },
      xl: { above: true, below: true },
    },
  })
})

test('the navigation sidebar disappears without animating at the mobile breakpoint', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 720 })
  await page.goto('/')

  const sidebar = page.locator('#catalog-sidebar')
  await expect(sidebar).toBeVisible()
  await sidebar.evaluate((element) => {
    window.sidebarResizeTransitions = []
    element.addEventListener('transitionrun', (event) => {
      if (event.target === element) {
        window.sidebarResizeTransitions.push(event.propertyName)
      }
    })
  })

  await page.setViewportSize({ width: 900, height: 720 })
  await page.waitForTimeout(300)

  await expect(sidebar).toBeHidden()
  expect(await page.evaluate(() => window.sidebarResizeTransitions)).toEqual([])
})

test('the application breakpoint does not make narrower viewports gain columns', async ({
  page,
}) => {
  const widths = [1025, 1024, 800, 700, 600, 390]
  const columns = []

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    columns.push(
      await page.locator('article.sds-card.sds-grid[data-sds-columns="2"][data-sds-min-column-width="lg"]')
        .evaluate((element) =>
          getComputedStyle(element).gridTemplateColumns.split(' ').length,
        ),
    )
  }

  expect(columns[0]).toBe(2)
  expect(columns.at(-1)).toBe(1)
  for (const [index, count] of columns.entries()) {
    if (index > 0) expect(count).toBeLessThanOrEqual(columns[index - 1])
  }
})

test('the playground keeps deliberate page, section, and card rhythm', async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')

    await expect(page.locator('main#top > .sds-page')).toHaveCSS('gap', '64px')
    await expect(page.locator('#actions')).toHaveCSS('gap', '32px')
    await expect(page.locator('#getting-started')).toHaveCSS('padding', '0px')
    await expect(page.locator('#getting-started > details')).not.toHaveAttribute(
      'open',
    )
  }
})

test('card and toaster spacing scales fluidly between responsive bounds', async ({
  page,
}) => {
  const spacingAt = async (width) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')

    return page.evaluate(() => {
      const card = document.querySelector('.sds-card')
      const toaster = document.querySelector('.sds-toaster')
      return {
        card: getComputedStyle(card).paddingTop,
        toaster: getComputedStyle(toaster).paddingTop,
      }
    })
  }

  expect(await spacingAt(390)).toEqual({ card: '24px', toaster: '16px' })
  expect(await spacingAt(800)).toEqual({ card: '28px', toaster: '20px' })
  expect(await spacingAt(1440)).toEqual({ card: '32px', toaster: '24px' })
})

test('badges keep their intrinsic height inside grids', async ({ page }) => {
  await page.goto('/')
  await page.locator('#getting-started > details > summary').click()

  const badges = page.locator('#getting-started .sds-badge')
  await expect(badges).toHaveCount(2)

  const heights = await badges.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().height),
  )

  expect(heights).toEqual([26, 26])
})

test('catalog compositions group related options and reflow before crowding', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const setupDisclosure = page.locator('#getting-started > details')
  await setupDisclosure.locator(':scope > summary').click()
  await expect(setupDisclosure).toHaveAttribute('open', '')

  const desktopSetupCards = await page
    .locator('#getting-started > details > .sds-grid > article')
    .evaluateAll((cards) =>
      cards.map((card) => card.getBoundingClientRect().height),
    )
  expect(Math.abs(desktopSetupCards[0] - desktopSetupCards[1])).toBeLessThan(1)

  const formFieldRows = await page
    .locator(
      '.sds-field:has(#text-input), .sds-field:has(#email-input), .sds-field:has(#password-input)',
    )
    .evaluateAll((fields) =>
      fields.map((field) => field.getBoundingClientRect().y),
    )
  expect(formFieldRows).toHaveLength(3)
  expect(formFieldRows[0]).toBe(formFieldRows[1])
  expect(formFieldRows[2]).toBeGreaterThan(formFieldRows[0])

  const calloutToneGroups = page.locator(
    '#callout-variants > .sds-grid > section',
  )
  await expect(calloutToneGroups).toHaveCount(6)
  for (const group of await calloutToneGroups.all()) {
    await expect(group.locator('.sds-callout')).toHaveCount(3)
  }
  const calloutGrid = page.locator('#callout-variants > .sds-grid')
  await expect
    .poll(() =>
      calloutGrid.evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(' ').length,
      ),
    )
    .toBe(3)

  await expect(
    page.locator('#actions > details.sds-card').first(),
  ).toHaveCSS('padding-top', '32px')

  await page.setViewportSize({ width: 800, height: 900 })
  const setupCards = await page
    .locator('#getting-started > details > .sds-grid > article')
    .evaluateAll((cards) =>
      cards.map((card) => {
        const { x, y, height } = card.getBoundingClientRect()
        return { x, y, height }
      }),
    )

  expect(setupCards).toHaveLength(2)
  expect(setupCards[1].x).toBe(setupCards[0].x)
  expect(setupCards[1].y).toBeGreaterThan(
    setupCards[0].y + setupCards[0].height,
  )
  await expect
    .poll(() =>
      calloutGrid.evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(' ').length,
      ),
    )
    .toBe(2)

  await page.setViewportSize({ width: 390, height: 900 })
  await expect
    .poll(() =>
      calloutGrid.evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(' ').length,
      ),
    )
    .toBe(1)
})

test('the navigation sidebar animates when a user closes it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 700, height: 720 })
  await page.goto('/')

  const sidebar = page.locator('#catalog-sidebar')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(sidebar).toBeVisible()

  await sidebar.evaluate((element) => {
    window.sidebarCloseTransitions = []
    element.addEventListener('transitionrun', (event) => {
      if (event.target === element) {
        window.sidebarCloseTransitions.push(event.propertyName)
      }
    })
  })

  await page.getByRole('button', { name: 'Close navigation' }).click()
  await expect(sidebar).toBeHidden()
  await expect(sidebar).not.toHaveAttribute('sds-closing')

  expect(await page.evaluate(() => window.sidebarCloseTransitions))
    .toContain('transform')
})

test('closed toasts never paint during initial rendering', async ({ page }) => {
  await page.goto('/')

  const styles = await page.locator('sds-toast').evaluateAll((toasts) =>
    toasts.map((toast) => ({
      display: getComputedStyle(toast).display,
      visibility: getComputedStyle(toast).visibility,
    })),
  )

  expect(styles.length).toBeGreaterThan(0)
  expect(styles).toEqual(
    Array.from({ length: styles.length }, () => ({
      display: 'none',
      visibility: 'hidden',
    })),
  )

  await page.locator('[data-sds-toast-open="toast-neutral"]').click()
  const toast = page.locator('#toast-neutral')
  await expect(toast).toBeVisible()
  await toast.locator('[data-sds-toast-close]').click()
  await expect(toast).toBeHidden()
})

test('section anchors remain visible below the sticky page header', async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/#navigation')

    const header = await page.locator('main#top > .sds-page-header').boundingBox()
    const heading = await page.locator('#navigation-title').boundingBox()

    expect(header).not.toBeNull()
    expect(heading).not.toBeNull()
    expect(heading.y).toBeGreaterThanOrEqual(header.y + header.height)
  }
})

test('section anchors do not move the application shell', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const sidebar = page.locator('#catalog-sidebar')
  await expect(sidebar).toBeVisible()
  expect((await sidebar.boundingBox())?.y).toBe(0)

  await page.getByRole('link', { name: 'Loading', exact: true }).click()

  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  expect((await sidebar.boundingBox())?.y).toBe(0)
})
