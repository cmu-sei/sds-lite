import { expect, test } from '@playwright/test'

const gridColumnWidths = {
  sm: 160,
  md: 224,
  lg: 288,
  xl: 384,
  '2xl': 512,
}

async function documentationRuntimeFixture(page, content, scheme = 'light') {
  await page.route('**/__documentation-regression__', route => route.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html><head>
      <link rel="stylesheet" href="/src/style.css?direct">
      <link rel="stylesheet" href="/src/brand.css?direct">
      <link rel="stylesheet" href="/src/documentation.css?direct">
      <script type="module" src="/src/documentation.ts"></script>
      </head><body class="sds-document" data-sds-root data-sds-theme="forge" data-sds-color-scheme="${scheme}">${content}</body></html>`,
  }))
  await page.goto('/__documentation-regression__')
}

test('documentation tables sort text and decimal values by keyboard with accessible headers', async ({ page }) => {
  await documentationRuntimeFixture(page, `<div class="sds-app" data-sds-variant="documentation"><article class="sds-prose" data-sds-tone="info">
    <table><thead><tr><th>Name</th><th>Score</th></tr></thead><tbody>
      <tr><td>Beta</td><td>9.12</td></tr><tr><td>Alpha</td><td>9.5</td></tr><tr><td>Gamma</td><td>-1</td></tr>
    </tbody></table>
    <table class="sds-table" id="merged"><thead><tr><th colspan="2">Merged</th></tr></thead><tbody><tr><td>One</td><td>Two</td></tr></tbody></table>
  </article></div>`)
  const table = page.locator('table').first()
  const score = table.getByRole('button', { name: 'Sort by Score' })
  await expect(score).toBeVisible()
  await expect(table).toHaveClass('sds-table')
  const header = table.locator('th').last()
  const typography = await header.evaluate(element => {
    const style = getComputedStyle(element)
    return { color: style.color, fontSize: style.fontSize, fontWeight: style.fontWeight, lineHeight: style.lineHeight }
  })
  for (const [property, value] of Object.entries(typography)) {
    await expect(score).toHaveCSS(property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`), value)
  }
  await expect(score.locator('[data-sds-sort-arrow]')).toHaveCSS('opacity', '0')
  await score.press('Enter')
  await expect(score.locator('[data-sds-sort-arrow]')).toHaveCSS('opacity', '1')
  await expect(table.locator('tbody td:last-child')).toHaveText(['-1', '9.12', '9.5'])
  await expect(table.locator('th').last()).toHaveAttribute('aria-sort', 'ascending')
  await score.press('Space')
  await expect(table.locator('tbody td:last-child')).toHaveText(['9.5', '9.12', '-1'])
  await expect(table.locator('th').last()).toHaveAttribute('aria-sort', 'descending')
  await table.getByRole('button', { name: 'Sort by Name' }).click()
  await expect(table.locator('tbody td:first-child')).toHaveText(['Alpha', 'Beta', 'Gamma'])
  await expect(table.locator('th').last()).toHaveAttribute('aria-sort', 'none')
  await expect(page.locator('#merged button')).toHaveCount(0)
})

test('documentation TOCs preserve heading levels and reject invalid or cross-shell targets', async ({ page }) => {
  await documentationRuntimeFixture(page, `
    <div class="sds-app" data-sds-variant="documentation">
      <main class="sds-app-main"><h2 id="section">Section</h2><h3 id="detail">Detail</h3><h5 id="preview">Preview heading</h5><p id="paragraph">Not a heading</p></main>
      <nav class="sds-app-toc" aria-label="On this page"><ul>
        <li><a href="#section">Section</a></li><li><a href="#detail">Detail</a></li><li><a href="#preview">Preview heading</a></li>
        <li><a href="#paragraph">Paragraph</a></li><li><a href="#missing">Missing</a></li><li><a href="#%ZZ">Malformed</a></li><li><a href="#other">Other shell</a></li>
      </ul></nav>
    </div>
    <div class="sds-app" data-sds-variant="documentation"><h2 id="other">Other shell</h2></div>`)
  const links = page.getByRole('navigation', { name: 'On this page' }).getByRole('link')
  await expect(links).toHaveText(['Section', 'Detail', 'Preview heading'])
})

for (const mode of ['light', 'dark', 'forced-colors']) {
  test(`documentation search focus outline stays inset in ${mode} mode`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: mode === 'forced-colors' ? 'active' : 'none' })
    await documentationRuntimeFixture(page, `
      <dialog class="sds-dialog"><h2>Search</h2>
        <input class="sds-input" type="search" aria-label="Search" autofocus>
        <div class="sds-search-results"><ul class="sds-list">
          ${Array.from({ length: 30 }, (_, index) => `<li class="sds-list-item"><a href="#result-${index}"><span>Result ${index + 1}</span><small>Documentation</small></a></li>`).join('')}
        </ul></div>
      </dialog>`, mode === 'dark' ? 'dark' : 'light')
    const dialog = page.getByRole('dialog')
    await page.locator('dialog').evaluate(element => element.showModal())
    await dialog.getByRole('searchbox').press('ArrowDown')
    const results = dialog.locator('.sds-search-results')
    const links = results.getByRole('link')
    for (const link of [links.first(), links.last()]) {
      await link.focus()
      await expect(link).toBeFocused()
      await expect(link).toHaveCSS('outline-style', 'solid')
      await expect(link).toHaveCSS('outline-width', '2px')
      await expect(link).toHaveCSS('outline-offset', '-2px')
      if (mode !== 'forced-colors') {
        const textColor = await link.evaluate(element => getComputedStyle(element).color)
        await expect(link).toHaveCSS('outline-color', textColor)
      }
      const row = await link.boundingBox()
      const viewport = await results.boundingBox()
      expect(row.y).toBeGreaterThanOrEqual(viewport.y - 1)
      expect(row.y + row.height).toBeLessThanOrEqual(viewport.y + viewport.height + 1)
      expect(row.x).toBeGreaterThanOrEqual(viewport.x - 1)
      expect(row.x + row.width).toBeLessThanOrEqual(viewport.x + viewport.width + 1)
    }
    expect(await results.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
  })
}

for (const width of [390, 884]) {
  test(`documentation mobile navigation slides into a child panel at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await documentationRuntimeFixture(page, `
      <div class="sds-app" data-sds-variant="documentation"><div class="sds-app-layout">
        <aside id="mobile-menu" class="sds-sidebar" popover="auto">
          <header><strong>CERT Secure Coding</strong></header>
          <nav class="sds-app-navigation" aria-label="Documentation sections"><ul>
            <li><a href="/">Home</a></li>
            <li><details class="sds-navigation-panel"><summary>Coding Standards</summary>
              <div><button type="button" data-sds-action="navigation-back">Go Back</button><strong>Coding Standards</strong>
                <ul><li><a href="/android/">Android</a></li><li><a href="/c/">C</a></li>
                  <li><details class="sds-navigation-panel"><summary>Reference</summary><div>
                    <button type="button" data-sds-action="navigation-back">Go Back</button><strong>Reference</strong>
                    <ul><li><a href="/reference/">Headings</a></li></ul>
                  </div></details></li>
                </ul>
              </div>
            </details></li>
          </ul></nav>
          <nav class="sds-app-toc" aria-label="On this page"><strong>On this page</strong><ul><li><a href="#intro">Introduction</a></li></ul></nav>
        </aside>
        <main class="sds-app-main"><h2 id="intro">Introduction</h2></main>
      </div></div>`)
    const drawer = page.locator('#mobile-menu')
    await drawer.evaluate(element => element.showPopover())
    const trigger = drawer.locator('.sds-app-navigation > ul > li > .sds-navigation-panel > summary')
    const home = drawer.getByRole('link', { name: 'Home', exact: true })
    await expect(home).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Android', exact: true })).toBeHidden()
    await trigger.focus()
    await trigger.press('Enter')
    const back = drawer.getByRole('button', { name: 'Go Back', exact: true })
    await expect(back).toBeVisible()
    await drawer.locator('header').click()
    await expect(back).toBeVisible()
    await expect(home).toBeHidden()
    await expect(trigger).toBeHidden()
    await expect(drawer.locator('.sds-app-toc')).toBeHidden()
    await expect(drawer.getByRole('link', { name: 'Android', exact: true })).toBeVisible()
    await expect(trigger).toHaveCSS('font-size', '18px')
    const bounds = await back.boundingBox()
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    await back.click()
    await expect(home).toBeVisible()
    await expect(trigger).toBeFocused()
    await expect(drawer.locator('.sds-app-toc')).toBeVisible()
    await trigger.press('Enter')
    await expect(back).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(drawer.locator('.sds-navigation-panel[open]')).toHaveCount(0)
    await drawer.evaluate(element => element.showPopover())
    await expect(home).toBeVisible()
    await trigger.focus()
    await trigger.press('Enter')
    const nestedTrigger = drawer.getByText('Reference', { exact: true }).filter({ visible: true })
    await nestedTrigger.click()
    await expect(drawer.getByRole('link', { name: 'Headings', exact: true })).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Android', exact: true })).toBeHidden()
    await back.click()
    await expect(nestedTrigger).toBeFocused()
    await expect(drawer.getByRole('link', { name: 'Android', exact: true })).toBeVisible()
    await drawer.evaluate(element => element.hidePopover())
    await expect(drawer.locator('.sds-navigation-panel[open]')).toHaveCount(0)
    await drawer.evaluate(element => element.showPopover())
    await expect(home).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Android', exact: true })).toBeHidden()
    await drawer.getByRole('link', { name: 'Introduction', exact: true }).click()
    await expect(drawer).toBeHidden()
  })
}

test('documentation mobile panel motion and controls use shared theme recipes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await documentationRuntimeFixture(page, `
    <div class="sds-app" data-sds-variant="documentation"><div class="sds-app-layout">
      <aside id="themed-menu" class="sds-sidebar" popover="auto">
        <span class="sds-text-h3" hidden>Theme typography</span>
        <header><a href="/">CERT Secure Coding</a><button class="sds-sidebar-close sds-button" type="button" data-sds-shape="icon" data-sds-density="compact" data-sds-variant="text" popovertarget="themed-menu" popovertargetaction="hide" aria-label="Close navigation">&times;</button></header>
        <nav class="sds-app-navigation"><ul><li><a href="/">Home</a></li><li>
          <details class="sds-navigation-panel"><summary>Coding Standards</summary><div>
            <button type="button" data-sds-action="navigation-back"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>Go Back</button>
            <strong>Coding Standards</strong><ul><li><a href="/c/">C Coding Standard</a></li></ul>
          </div></details>
        </li></ul></nav>
      </aside>
    </div></div>`)
  const drawer = page.locator('#themed-menu')
  await drawer.evaluate(element => element.showPopover())
  const close = drawer.getByRole('button', { name: 'Close navigation', exact: true })
  await expect(close).toHaveCSS('font-size', '32px')
  const closeBounds = await close.boundingBox()
  expect(closeBounds.width).toBeGreaterThanOrEqual(44)
  expect(closeBounds.height).toBeGreaterThanOrEqual(44)
  const title = drawer.locator('header > a')
  await expect(title).toHaveCSS('font-size', '20px')
  const titleBounds = await title.boundingBox()
  expect(Math.abs(titleBounds.y + titleBounds.height / 2 - closeBounds.y - closeBounds.height / 2)).toBeLessThan(1)
  const trigger = drawer.locator('summary')
  await expect(trigger).toHaveCSS('align-items', 'center')
  expect(await trigger.evaluate(element => getComputedStyle(element, '::after').marginBlockStart)).toBe('0px')
  await trigger.click()
  await expect.poll(() => drawer.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation instanceof CSSAnimation && animation.animationName === 'sds-navigation-enter' && animation.playState === 'running').length)).toBeGreaterThan(0)
  const back = drawer.getByRole('button', { name: 'Go Back', exact: true })
  await expect(back).toHaveCSS('align-items', 'center')
  await expect(back).toHaveCSS('font-size', '20px')
  await expect(back).toHaveCSS('line-height', '28px')
  for (const theme of ['forge', 'plaid']) {
    await page.locator('body').evaluate((element, value) => { element.dataset.sdsTheme = value }, theme)
    for (const scheme of ['light', 'dark']) {
      await page.locator('body').evaluate((element, value) => { element.dataset.sdsColorScheme = value }, scheme)
      await expect(back).toHaveCSS('font-family', await drawer.locator('.sds-text-h3').evaluate(element => getComputedStyle(element).fontFamily))
      await expect(back).toHaveCSS('font-weight', await drawer.locator('.sds-text-h3').evaluate(element => getComputedStyle(element).fontWeight))
      await expect.poll(() => drawer.evaluate(element => {
        const back = element.querySelector('[data-sds-action="navigation-back"]')
        const close = element.querySelector('.sds-sidebar-close')
        return getComputedStyle(back).color === getComputedStyle(close).color
      })).toBe(true)
    }
  }
  await back.click()
  await expect.poll(() => drawer.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation instanceof CSSAnimation && ['sds-navigation-exit', 'sds-navigation-return'].includes(animation.animationName) && animation.playState === 'running').length)).toBeGreaterThan(0)
  await expect(drawer.getByRole('link', { name: 'Home', exact: true })).toBeVisible()
})

test('documentation runtime restores preferences only for independently controlled roots', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sds-color-scheme', 'dark')
    localStorage.setItem('sds-color-scheme:controlled', 'dark')
    localStorage.setItem('sds-color-scheme:uncontrolled', 'dark')
  })
  await documentationRuntimeFixture(page, `
    <main id="controlled" data-sds-root data-sds-color-scheme="system"><button data-sds-action="toggle-color-scheme"><svg aria-hidden="true"></svg><svg aria-hidden="true"></svg></button></main>
    <section id="independent" data-sds-root data-sds-color-scheme="system"><button data-sds-action="toggle-color-scheme"><svg aria-hidden="true"></svg><svg aria-hidden="true"></svg></button></section>
    <section id="uncontrolled" data-sds-root data-sds-color-scheme="system">Independent region</section>`)
  const controlled = page.locator('#controlled')
  const independent = page.locator('#independent')
  await expect(controlled).toHaveAttribute('data-sds-color-scheme', 'dark')
  await expect(independent).toHaveAttribute('data-sds-color-scheme', 'system')
  await expect(page.locator('#uncontrolled')).toHaveAttribute('data-sds-color-scheme', 'system')
  await controlled.getByRole('button', { name: 'Switch to light mode' }).click()
  expect(await page.evaluate(() => localStorage.getItem('sds-color-scheme:controlled'))).toBe('light')
  expect(await page.evaluate(() => localStorage.getItem('sds-color-scheme'))).toBe('dark')
  await expect(independent).toHaveAttribute('data-sds-color-scheme', 'system')
})

const clusterStackWidths = {
  sm: 480,
  md: 640,
  lg: 768,
  xl: 1024,
}

test('documentation runtime retains page preferences without sharing them with anonymous roots', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.addInitScript(() => localStorage.setItem('sds-color-scheme', 'dark'))
  await documentationRuntimeFixture(page, `
    <button id="page-theme" data-sds-action="toggle-color-scheme"><svg aria-hidden="true"></svg><svg aria-hidden="true"></svg></button>
    <main data-sds-root data-sds-color-scheme="system"><button id="anonymous-theme" data-sds-action="toggle-color-scheme"><svg aria-hidden="true"></svg><svg aria-hidden="true"></svg></button></main>`, 'system')
  await expect(page.locator('body')).toHaveAttribute('data-sds-color-scheme', 'dark')
  await expect(page.locator('main')).toHaveAttribute('data-sds-color-scheme', 'system')
  await page.locator('#anonymous-theme').click()
  await page.locator('#anonymous-theme').click()
  await expect(page.locator('main')).toHaveAttribute('data-sds-color-scheme', 'light')
  expect(await page.evaluate(() => localStorage.getItem('sds-color-scheme'))).toBe('dark')
  await expect(page.locator('#page-theme')).toHaveAttribute('aria-label', 'Switch to light mode')
})

test('documentation runtime preserves modal Escape before background navigation dismissal', async ({ page }) => {
  await documentationRuntimeFixture(page, `
    <nav class="sds-app-navigation"><details id="background-menu" open><summary>Menu</summary><a href="#">Item</a></details></nav>
    <dialog id="native-modal" class="sds-dialog" aria-label="Modal"><label>Query<input autofocus></label></dialog>`)
  const dialog = page.getByRole('dialog', { name: 'Modal', exact: true })
  await page.locator('#native-modal').evaluate(element => element.showModal())
  await dialog.locator('input').focus()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.locator('#background-menu')).toHaveAttribute('open')
  const summary = page.getByText('Menu', { exact: true })
  await summary.focus()
  await page.keyboard.press('Escape')
  await expect(page.locator('#background-menu')).not.toHaveAttribute('open')
  await expect(summary).toBeFocused()
})

test('documentation runtime updates controls for document-element root changes', async ({ page }) => {
  await documentationRuntimeFixture(page, '<button data-sds-action="toggle-color-scheme">Theme</button>')
  await page.evaluate(() => {
    document.body.removeAttribute('data-sds-root')
    document.documentElement.dataset.sdsRoot = ''
    document.documentElement.dataset.sdsColorScheme = 'light'
  })
  const button = page.locator('button')
  await expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
  await page.locator('html').evaluate(element => { element.dataset.sdsColorScheme = 'dark' })
  await expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
  await expect(button).toHaveAttribute('aria-pressed', 'true')
})

test('documentation runtime updates controls for root attribute and system scheme changes', async ({ page }) => {
  await documentationRuntimeFixture(page, `
    <main id="changing-theme" data-sds-root data-sds-color-scheme="light"><button data-sds-action="toggle-color-scheme"><svg aria-hidden="true"></svg><svg aria-hidden="true"></svg></button></main>`)
  const root = page.locator('#changing-theme')
  const button = root.locator('button')
  await expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
  await root.evaluate(element => { element.dataset.sdsColorScheme = 'dark' })
  await expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(button).toHaveAttribute('title', 'Switch to light mode')
  await expect(button.locator('svg').first()).toBeHidden()
  await expect(button.locator('svg').nth(1)).toBeVisible()
  await page.emulateMedia({ colorScheme: 'light' })
  await root.evaluate(element => { element.dataset.sdsColorScheme = 'system' })
  await expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
  await root.evaluate(element => element.removeAttribute('data-sds-root'))
  await expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
  await expect(button).toHaveAttribute('aria-pressed', 'false')
})

for (const width of [1440, 390]) {
  test(`documentation runtime code fullscreen preserves its nested root at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await documentationRuntimeFixture(page, `
      <section id="code-theme" data-sds-root data-sds-theme="plaid" data-sds-color-scheme="dark" style="--sds-color-text-default:rgb(11,222,33);--sds-font-body:Georgia,serif;--sds-radius-control:0.375rem">
        <div class="sds-app" data-sds-variant="documentation"><main class="sds-app-main"><article class="sds-prose">
          <div id="nested-code" class="sds-code-block"><header><strong>Code example</strong><nav><button data-sds-action="toggle-code-fullscreen" hidden>Fullscreen</button></nav></header>
            <div data-sds-code-slot="default"><pre><code><span style="--shiki-light:#123456;--shiki-dark:#fedcba">return 0;</span></code></pre></div>
          </div>
        </article></main></div>
      </section>`)
    const block = page.locator('#nested-code')
    const presentation = () => block.evaluate(element => {
      const style = getComputedStyle(element)
      return { root: element.closest('[data-sds-root]').id, scheme: style.colorScheme, color: style.color, font: style.fontFamily, radius: style.borderRadius, code: getComputedStyle(element.querySelector('code span')).color }
    })
    const before = await presentation()
    const button = page.getByRole('button', { name: 'Fullscreen', exact: true })
    await button.click()
    const dialog = page.getByRole('dialog', { name: 'Code example', exact: true })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
    expect(await presentation()).toEqual(before)
    const bounds = await dialog.boundingBox()
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.y).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(900)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    expect(await presentation()).toEqual(before)
    await expect(button).toBeFocused()
  })
}

for (const width of [1440, 1024, 390]) {
  for (const scheme of ['light', 'dark']) {
    test(`documentation sidebar tree matches reference at ${width}px in ${scheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const icon = '<svg aria-hidden="true" viewBox="0 0 16 16"><path d="M2 2h12v12H2z"></path></svg>'
      await documentationRuntimeFixture(page, `<div class="sds-app" data-sds-variant="documentation">
        <div class="sds-app-layout"><aside class="sds-sidebar" popover="auto">
          <header><strong>${icon}ScribeAI</strong></header>
          <nav class="sds-app-navigation"><ul><li><a href="#">Home</a></li></ul></nav>
          <nav aria-label="Documentation"><ul>
            <li><a href="#features">${icon}Key Features</a><details open>
              <summary><span class="sds-sr-only">Toggle Key Features</span></summary><ul>
                <li><a href="#suggestions">${icon}Real-Time Suggestions</a></li>
                <li><a href="#languages">${icon}Multilingual Support</a><details open>
                  <summary><span class="sds-sr-only">Toggle Multilingual Support</span></summary><ul>
                    <li><a href="#chinese" aria-current="page">${icon}Chinese</a></li>
                    <li><a href="#english">English</a></li>
                  </ul>
                </details></li>
              </ul>
            </details></li>
            <li><details><summary>${icon}Installation Guide</summary><ul>
              <li><a href="#installation" aria-current="location">Getting Started</a></li>
            </ul></details></li>
          </ul></nav>
        </aside><main>Content</main></div></div>`, scheme)
      const sidebar = page.locator('.sds-sidebar')
      if (width < 1024) await sidebar.evaluate(element => element.showPopover())
      const tree = sidebar.getByRole('navigation', { name: 'Documentation', exact: true })
      const features = tree.getByRole('link', { name: 'Key Features', exact: true })
      const languages = tree.getByRole('link', { name: 'Multilingual Support', exact: true })
      const chinese = tree.getByRole('link', { name: 'Chinese', exact: true })
      const installation = tree.getByText('Installation Guide', { exact: true })
      for (const item of [features, languages, chinese, installation]) {
        await expect(item).toHaveCSS('font-size', '14px')
        await expect(item).toHaveCSS('font-weight', '400')
        await expect(item).toHaveCSS('line-height', '20px')
        await expect(item).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      }
      const suggestions = tree.getByRole('link', { name: 'Real-Time Suggestions', exact: true })
      await expect(suggestions).toHaveCSS('padding', '6px 8px')
      await expect(suggestions).toHaveCSS('min-height', '32px')
      const toggle = tree.getByText('Toggle Key Features', { exact: true }).locator('..')
      await expect(toggle).toHaveCSS('width', '28px')
      await expect(toggle).toHaveCSS('height', '32px')
      await expect(toggle).toHaveCSS('border-radius', '4px')
      await expect(toggle).toHaveCSS('align-items', 'center')
      const toggleBounds = await toggle.boundingBox()
      const featuresBounds = await features.boundingBox()
      expect(toggleBounds.x - featuresBounds.x - featuresBounds.width).toBeCloseTo(4, 0)
      await features.evaluate(element => { element.style.inlineSize = '90px' })
      await expect.poll(() => features.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(32)
      const firstLineCenter = await features.evaluate(element => {
        const text = [...element.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
        if (!text) throw new Error('Sidebar link must contain a text label')
        const range = document.createRange()
        range.setStart(text, 0)
        range.setEnd(text, 1)
        const bounds = range.getBoundingClientRect()
        return bounds.y + bounds.height / 2
      })
      const wrappedToggleBounds = await toggle.boundingBox()
      expect(Math.abs(wrappedToggleBounds.y + wrappedToggleBounds.height / 2 - firstLineCenter)).toBeLessThanOrEqual(1)
      await features.evaluate(element => element.style.removeProperty('inline-size'))
      await expect(tree.locator(':scope > ul > li > details > ul').first()).toHaveCSS('border-left-width', '2px')
      await expect(tree.locator('details details > ul')).toHaveCSS('border-left-width', '0px')
      const marker = await chinese.evaluate(element => {
        const style = getComputedStyle(element)
        const before = getComputedStyle(element, '::before')
        return { overflow: style.overflowX, color: style.color, markerColor: before.backgroundColor, x: element.getBoundingClientRect().x + parseFloat(before.left) }
      })
      expect(marker.overflow).toBe('visible')
      expect(marker.markerColor).toBe(marker.color)
      expect(marker.x).toBeCloseTo((await tree.locator(':scope > ul > li > details > ul').first().boundingBox()).x, 0)
      await languages.locator('+ details').evaluate(element => { element.open = false })
      await expect(languages).toHaveCSS('color', marker.color)
      await expect(languages).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      await toggle.click()
      await page.mouse.move(0, 0)
      await expect(features.locator('+ details')).not.toHaveAttribute('open')
      await expect(features).toHaveCSS('color', marker.color)
      await expect(toggle).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      for (const root of [features, installation]) {
        await expect(root).toHaveCSS('border-left-width', '0px')
        expect(await root.evaluate(element => getComputedStyle(element, '::before').content)).toBe('none')
      }
      for (const value of ['page', 'location']) {
        await features.evaluate((element, value) => element.setAttribute('aria-current', value), value)
        expect(await features.evaluate(element => getComputedStyle(element, '::before').content)).toBe('none')
        await expect(features).toHaveCSS('color', marker.color)
      }
      await features.evaluate(element => element.removeAttribute('aria-current'))
      await toggle.focus()
      await page.keyboard.press('Enter')
      await expect(features.locator('+ details')).toHaveAttribute('open')
      for (const svg of await tree.locator('svg').all()) {
        await expect(svg).toHaveCSS('width', '16px')
        await expect(svg).toHaveCSS('height', '16px')
      }
      if (width >= 1024) {
        await expect(sidebar.locator(':scope > header strong')).toHaveCSS('font-weight', '600')
      }
      await sidebar.evaluate(element => { element.dataset.sdsDensity = 'compact' })
      await expect(features).toHaveCSS('padding', '4px 8px')
    })
  }
}

for (const width of [1440, 1280, 1024, 390]) {
  test(`documentation reference grid at ${width}px needs no consumer CSS`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    await page.setContent(`<!doctype html><html><head>
      <link rel="stylesheet" href="${new URL(page.url()).origin}/src/style.css?direct">
      <link rel="stylesheet" href="${new URL(page.url()).origin}/src/brand.css?direct">
      <link rel="stylesheet" href="${new URL(page.url()).origin}/src/documentation.css?direct">
    </head><body class="sds-document" data-sds-root>
      <div class="sds-app" data-sds-variant="documentation">
        <div class="sds-app-masthead"><a href="/"><span class="sds-sei-wordmark"></span></a><div class="sds-cluster" data-sds-gap="sm"><button class="sds-button" data-sds-shape="icon" data-sds-size="sm">G</button><button class="sds-button" data-sds-shape="icon" data-sds-size="sm" data-sds-action="toggle-fullscreen">F</button><button class="sds-button" data-sds-shape="icon" data-sds-size="sm" data-sds-action="toggle-color-scheme">T</button><button class="sds-button" data-sds-shape="icon" data-sds-size="sm">S</button></div></div>
        <header class="sds-app-header"><a class="sds-app-brand" href="/">CERT Secure Coding</a><nav class="sds-app-navigation"><ul><li><a href="/">Home</a></li></ul></nav></header>
        <div class="sds-app-layout"><aside class="sds-sidebar" popover="auto"><nav><ul><li><a href="#guidelines">Guidelines</a><details><summary><span class="sds-sr-only">Toggle Guidelines navigation</span></summary><ul><li><a href="#guidelines">Rules</a></li></ul></details></li></ul></nav></aside>
          <div class="sds-app-body"><main class="sds-app-main"><div class="sds-app-content">
            <article class="sds-prose"><h1>Concurrency (CON)</h1><h2 id="guidelines">Guidelines</h2><p>Documentation content.</p></article>
            <nav class="sds-app-toc"><strong>On this page</strong><ul><li><a href="#guidelines">Guidelines</a></li></ul></nav>
          </div></main></div>
        </div><footer class="sds-app-footer">Legal</footer>
      </div></body></html>`)
    await page.waitForLoadState('networkidle')
    const shell = page.locator('.sds-app')
    await expect(shell.locator('.sds-app-masthead')).toHaveCSS('height', width < 1024 ? '66px' : '76px')
    const article = await shell.locator('article').boundingBox()
    expect(article.x).toBeCloseTo(width >= 1024 ? width / 4 + 20 : 16, 0)
    expect(article.width).toBeCloseTo(width >= 1280 ? width / 2 - 40 : width === 1024 ? 645.333 : width - 32, 0)
    await expect(shell.locator('.sds-sidebar')).toHaveCSS('display', width >= 1024 ? 'flex' : 'none')
    if (width < 1024) await expect(shell.locator('.sds-sidebar')).toHaveCSS('overscroll-behavior-y', 'contain')
    await expect(shell.locator('.sds-sidebar summary a')).toHaveCount(0)
    if (width >= 1024) {
      const toggle = shell.locator('.sds-sidebar summary')
      const link = shell.locator('.sds-sidebar > nav > ul > li > a')
      const toggleBounds = await toggle.boundingBox()
      const linkBounds = await link.boundingBox()
      expect(toggleBounds.x - linkBounds.x - linkBounds.width).toBeCloseTo(4, 0)
      expect(toggleBounds.y).toBeCloseTo(linkBounds.y, 0)
      await expect(link).toHaveCSS('padding-inline-end', '8px')
      await toggle.click()
      await expect(shell.locator('.sds-sidebar details')).toHaveAttribute('open')
    }
    await expect(shell.locator('.sds-app-content > .sds-app-toc')).toHaveCSS('display', width >= 1280 ? 'block' : 'none')
    await expect(shell.locator('h1')).toHaveCSS('font-size', width < 768 ? '30px' : '36px')
    await expect(shell.locator('article')).toHaveCSS('font-size', width < 768 ? '14px' : '16px')
    await expect(shell.locator('.sds-app-masthead .sds-button:visible')).toHaveCount(width < 1024 ? 2 : 4)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await shell.locator('.sds-sidebar').evaluate(element => element.remove())
    const withoutSidebar = await shell.locator('article').boundingBox()
    expect(withoutSidebar.x).toBeCloseTo(article.x, 0)
    expect(withoutSidebar.width).toBeCloseTo(article.width, 0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

for (const width of [1280, 390]) {
  test(`documentation mobile-only navigation drawer at ${width}px preserves the reading column`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await documentationRuntimeFixture(page, `<div class="sds-app" data-sds-variant="documentation">
      <header class="sds-app-header"><a class="sds-app-brand" href="#home">Documentation</a>
        <button class="sds-button" popovertarget="mobile-only-navigation" aria-label="Open site navigation">Menu</button>
      </header>
      <div class="sds-app-layout"><aside id="mobile-only-navigation" class="sds-sidebar" popover="auto" aria-label="Site navigation">
        <header><strong>Documentation</strong><button class="sds-sidebar-close sds-button" popovertarget="mobile-only-navigation" popovertargetaction="hide" aria-label="Close site navigation">Close</button></header>
        <nav class="sds-app-navigation" aria-label="Documentation sections"><ul><li><a href="#home">Home</a></li><li><a href="#guides">Guides</a></li></ul></nav>
        <nav class="sds-app-toc"><strong>On this page</strong><ul><li><a href="#home">Welcome</a></li></ul></nav>
      </aside><div class="sds-app-body"><main class="sds-app-main"><div class="sds-app-content">
        <article class="sds-prose"><h1 id="home">Welcome</h1><p>Documentation content.</p></article>
      </div></main></div></div>
    </div>`)
    const drawer = page.getByRole('complementary', { name: 'Site navigation', includeHidden: true })
    const toggle = page.getByRole('button', { name: 'Open site navigation', includeHidden: true })
    await expect(drawer).toBeHidden()
    const article = await page.locator('article').boundingBox()
    expect(article.x).toBeCloseTo(width >= 1024 ? width / 4 + 20 : 16, 0)
    if (width >= 1024) await expect(toggle).toBeHidden()
    else {
      await expect(toggle).toBeVisible()
      await toggle.focus()
      await toggle.press('Enter')
      await expect(drawer).toBeVisible()
      await expect(drawer.getByRole('link', { name: 'Home', exact: true })).toBeVisible()
      await expect(drawer.getByRole('link', { name: 'Guides', exact: true })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(drawer).toBeHidden()
      await expect(toggle).toBeFocused()
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

for (const width of [1024, 1440]) {
  for (const [rows, behavior] of [[2, 'boundary'], [60, 'internal'], [60, 'boundary']]) {
    test(`documentation sidebar wheel scrolling ${behavior} at ${width}px with ${rows} links`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="http://127.0.0.1:4173/src/style.css?direct"><link rel="stylesheet" href="http://127.0.0.1:4173/src/brand.css?direct"></head>
        <body class="sds-document" data-sds-root><div class="sds-app" data-sds-variant="documentation">
          <header class="sds-app-header">Documentation</header><div class="sds-app-layout">
            <aside class="sds-sidebar" popover="auto"><nav aria-label="Pages"><ul>${Array.from({ length: rows }, (_, index) => `<li><a href="#content">Page ${index + 1}</a></li>`).join('')}</ul></nav></aside>
            <div class="sds-app-body"><main class="sds-app-main" id="content">${'<p>Documentation content.</p>'.repeat(100)}</main></div>
          </div></div></body></html>`)
      await page.waitForLoadState('networkidle')
      const navigation = page.getByRole('navigation', { name: 'Pages', exact: true })
      const sidebar = page.locator('.sds-sidebar')
      const scroller = await navigation.evaluate(element => element.scrollHeight > element.clientHeight)
        ? navigation
        : sidebar
      if (rows === 60 && behavior === 'boundary') {
        await scroller.evaluate(element => { element.scrollTop = element.scrollHeight })
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      }
      await sidebar.hover({ position: { x: 20, y: 20 } })
      const before = await page.evaluate(() => scrollY)
      await page.mouse.wheel(0, behavior === 'internal' ? 200 : 400)
      if (behavior === 'internal') {
        await expect.poll(() => scroller.evaluate(element => element.scrollTop)).toBeGreaterThanOrEqual(190)
        expect(await page.evaluate(() => scrollY)).toBe(before)
      } else {
        await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before)
      }
    })
  }
}

test('optional documentation runtime tracks sections, theme, and code controls', async ({ page }) => {
  await page.goto('/')
  await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="http://127.0.0.1:4173/src/style.css?direct"><link rel="stylesheet" href="http://127.0.0.1:4173/src/documentation.css?direct"></head><body data-sds-root data-sds-color-scheme="light">
    <button class="sds-button" data-sds-shape="icon" data-sds-action="toggle-color-scheme"><svg aria-hidden="true"></svg><svg aria-hidden="true"></svg></button>
    <nav class="sds-app-navigation" aria-label="Documentation"><details><summary>More</summary><a href="#first">First section</a></details></nav>
    <div class="sds-app" data-sds-variant="documentation"><main class="sds-app-main"><article><h2 id="first">First</h2><p>Content</p><h2 id="second">Second</h2></article></main>
    <nav class="sds-app-toc"><ul><li><a href="#first">First</a></li><li><a href="#second">Second</a></li></ul></nav></div>
    <figure class="sds-code-block"><header><strong>Example</strong><nav><button data-sds-action="copy-code" hidden>Copy</button><button data-sds-action="toggle-complete-code" aria-pressed="false" hidden>Complete</button><button data-sds-action="toggle-code-fullscreen" aria-pressed="false" hidden>Fullscreen</button></nav></header><div data-sds-code-slot="default"><pre><code>return 0;</code></pre></div><div data-sds-code-slot="complete" hidden><pre><code>int main() { return 0; }</code></pre></div><output class="sds-sr-only"></output></figure>
    <script type="module" src="http://127.0.0.1:4173/src/documentation.ts?runtime-fixture"></script>
  </body></html>`)
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible()
  await expect(page.locator('[data-sds-action="toggle-color-scheme"] > svg').nth(1)).toBeHidden()
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect(page.locator('body')).toHaveAttribute('data-sds-color-scheme', 'dark')
  await expect(page.locator('[data-sds-action="toggle-color-scheme"] > svg').first()).toBeHidden()
  await page.getByText('More', { exact: true }).click()
  await page.locator('#first').click()
  await expect(page.locator('.sds-app-navigation details')).not.toHaveAttribute('open')
  await page.getByText('More', { exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.locator('.sds-app-navigation details')).not.toHaveAttribute('open')
  await expect(page.getByText('More', { exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await expect(page.locator('body')).toHaveAttribute('data-sds-color-scheme', 'light')
  await page.getByRole('button', { name: 'Complete', exact: true }).click()
  await expect(page.locator('[data-sds-code-slot="complete"]')).toBeVisible()
  await expect(page.locator('[data-sds-code-slot="default"]')).toBeHidden()
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Fullscreen', exact: true })).toBeFocused()
  await page.evaluate(() => { window.__copied = ''; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text } } }) })
  await page.getByRole('button', { name: 'Copy', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__copied)).toBe('int main() { return 0; }')
  await expect(page.locator('output')).toHaveText('Code copied.')
  await expect(page.locator('.sds-app-toc a[href="#first"]')).toHaveAttribute('aria-current', 'location')
  await page.locator('#first').evaluate(element => { element.style.marginBottom = '1500px' })
  await page.locator('#second').scrollIntoViewIfNeeded()
  await expect(page.locator('.sds-app-toc a[href="#second"]')).toHaveAttribute('aria-current', 'location')
})

for (const width of [1440, 390]) {
  for (const name of ['Application', 'Simple application', 'Documentation site', 'Brochure']) {
    test(`${name} uses full-height document flow and a scrolling footer at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      const markup = await page.locator(`[data-copy-layout="${name}"]`).evaluate(element => element.outerHTML)
      await page.setContent(`<!doctype html><html><head>
        <link rel="stylesheet" href="http://127.0.0.1:4173/src/style.css?direct">
        <link rel="stylesheet" href="http://127.0.0.1:4173/src/brand.css?direct">
      </head><body class="sds-document" data-sds-root>${markup}</body></html>`)
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => document.fonts.ready)
      const shell = page.locator('[data-copy-layout]')
      expect(await shell.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(800)
      if (name === 'Documentation site' && width > 1024) {
        await shell.locator('.sds-app-main').evaluate(element => element.style.minHeight = '700px')
        await page.evaluate(() => window.scrollTo(0, 100))
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(100)
        const headerBottom = await shell.locator(':scope > .sds-app-header').evaluate(element => element.getBoundingClientRect().bottom)
        expect(await shell.locator('.sds-sidebar').evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(headerBottom + 29, 0)
        expect(await shell.locator('.sds-app-main > .sds-app-toc').evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(headerBottom)
        await page.evaluate(() => window.scrollTo(0, 0))
      }
      await shell.locator('.sds-app-main').evaluate(element => element.style.minHeight = '1800px')
      await expect(shell.locator('.sds-app-main')).toHaveCSS('min-height', '1800px')
      const footer = shell.locator('.sds-app-footer')
      const footerTop = await footer.evaluate(element => element.getBoundingClientRect().top)
      expect(footerTop).toBeGreaterThanOrEqual(800)
      await page.evaluate(() => window.scrollTo(0, 300))
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(300)
      expect(await footer.evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(footerTop - 300, 0)
      if (name === 'Documentation site') {
        expect(await shell.locator(':scope > .sds-app-masthead').evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0)
        expect(await shell.locator(':scope > .sds-app-header').evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(0, 0)
        const headerBottom = await shell.locator(':scope > .sds-app-header').evaluate(element => element.getBoundingClientRect().bottom)
        if (width > 1024) {
          expect(await shell.locator('.sds-sidebar').evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(headerBottom + 29, 0)
          expect(await shell.locator('.sds-app-main > .sds-app-toc').evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(headerBottom)
        }
        await page.evaluate(() => { location.hash = 'documentation-installation' })
        await expect.poll(() => shell.locator('#documentation-installation').evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(headerBottom)
      }
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await expect(footer).toBeInViewport()
    })
  }
}

for (const width of [1440, 390]) {
  for (const name of ['Application', 'Simple application', 'Documentation site', 'Brochure']) {
    test(`shared ${name} shell preserves unique presentation and nested isolation at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/')
      const markup = await page.locator(`[data-copy-layout="${name}"]`).evaluate(element => element.outerHTML)
      await page.setContent(`<!doctype html><html><head>
        <link rel="stylesheet" href="http://127.0.0.1:4173/src/style.css?direct">
        <link rel="stylesheet" href="http://127.0.0.1:4173/src/brand.css?direct">
      </head><body class="sds-document" data-sds-root>${markup}</body></html>`)
      const shell = page.locator('[data-copy-layout]')
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => document.fonts.ready)
      await expect(shell).toHaveCSS('display', 'flex')
      const presentation = () => shell.evaluate(element => {
        const origin = element.getBoundingClientRect()
        return [...element.querySelectorAll('*')].filter(node => !node.childElementCount && node.textContent.trim()).map(node => {
          const style = getComputedStyle(node)
          const rect = node.getBoundingClientRect()
          return {
            text: node.textContent,
            rect: [rect.x - origin.x, rect.y - origin.y, rect.width, rect.height],
            style: Object.fromEntries(['display', 'color', 'background-color', 'font-family', 'font-size', 'font-weight', 'line-height', 'padding', 'margin', 'border-width', 'border-color', 'border-radius', 'gap', 'box-shadow'].map(property => [property, style.getPropertyValue(property)])),
          }
        })
      })
      const original = await presentation()
      for (const variant of ['application', 'simple', 'documentation', 'brochure']) {
        await shell.evaluate((element, variant) => {
          const outer = document.createElement('div')
          outer.className = 'sds-app'
          outer.dataset.sdsVariant = variant
          const layout = document.createElement('div')
          layout.className = 'sds-app-layout'
          layout.style.padding = '0'
          layout.style.gap = '0'
          layout.style.gridTemplateColumns = 'minmax(0, 1fr)'
          const body = document.createElement('div')
          body.className = 'sds-app-body'
          body.style.gridColumn = 'auto'
          element.replaceWith(outer)
          outer.append(layout)
          layout.append(body)
          body.append(element)
        }, variant)
        expect(await presentation(), `inside ${variant}`).toEqual(original)
        await shell.evaluate(element => document.body.replaceChildren(element))
      }
    })
  }
}

test('one authored shell scaffold supports all variants without DOM enhancement', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await page.setContent(`<!doctype html><html><head>
    <link rel="stylesheet" href="http://127.0.0.1:4173/src/style.css?direct">
    <link rel="stylesheet" href="http://127.0.0.1:4173/src/brand.css?direct">
  </head><body class="sds-document" data-sds-root>
    <div class="sds-app" data-sds-variant="application">
      <header class="sds-app-header">Project Atlas</header>
      <div class="sds-app-layout"><div class="sds-app-body"><main class="sds-app-main">Project content</main></div></div>
      <footer class="sds-app-footer">Legal information</footer>
    </div>
  </body></html>`)
  const shell = page.locator('.sds-app')
  const scaffold = await shell.innerHTML()
  for (const variant of ['application', 'simple', 'documentation', 'brochure']) {
    await shell.evaluate((element, variant) => element.dataset.sdsVariant = variant, variant)
    await expect(shell).toHaveCSS('display', 'flex')
    await expect(shell.locator('.sds-app-header')).toHaveCSS('display', variant === 'application' ? 'none' : variant === 'brochure' ? 'block' : 'flex')
    await expect(shell).toHaveCSS('overflow', 'visible')
    await expect(shell.locator('.sds-app-body')).toHaveCSS('overflow', 'visible')
    expect(await shell.innerHTML()).toEqual(scaffold)
  }
})

for (const theme of ['forge', 'plaid']) {
  test(`unthemed nested shells preserve ${theme} theme tokens`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.setContent(`<!doctype html><html><head>
      <link rel="stylesheet" href="http://127.0.0.1:4173/src/style.css?direct">
      <link rel="stylesheet" href="http://127.0.0.1:4173/src/brand.css?direct">
    </head><body class="sds-document" data-sds-root data-sds-theme="${theme}">
      <div class="sds-app" data-sds-variant="simple" id="nested-shell">
        <header class="sds-app-header">Project Atlas</header>
        <div class="sds-app-layout"><div class="sds-app-body"><main class="sds-app-main">
          <h2 class="sds-text-h2">Project settings</h2>
          <button class="sds-button" type="button">Save</button>
          <div class="sds-card">Project details</div>
        </main></div></div>
      </div>
    </body></html>`)
    await page.waitForLoadState('networkidle')
    const shell = page.locator('#nested-shell')
    const presentation = () => shell.evaluate(element => ({
      headingFont: getComputedStyle(element.querySelector('h2')).fontFamily,
      controlRadius: getComputedStyle(element.querySelector('button')).borderRadius,
      containerRadius: getComputedStyle(element.querySelector('.sds-card')).borderRadius,
    }))
    for (const variant of ['application', 'simple', 'documentation', 'brochure']) {
      await shell.evaluate((element, variant) => element.dataset.sdsVariant = variant, variant)
      await expect(shell.locator('.sds-card')).toHaveCSS('border-radius', theme === 'plaid' || variant === 'brochure' ? '0px' : '8px')
      await expect(shell.locator('.sds-button')).toHaveCSS('border-radius', theme === 'plaid' || variant === 'brochure' ? '0px' : '4px')
      const standalone = await presentation()
      await shell.evaluate(element => {
        const outer = document.createElement('div')
        outer.className = 'sds-app'
        outer.dataset.sdsVariant = 'brochure'
        element.replaceWith(outer)
        outer.append(element)
      })
      await expect.poll(presentation, { message: `${variant} inside brochure` }).toEqual(standalone)
      await shell.evaluate(element => document.body.replaceChildren(element))
    }
    await shell.evaluate(element => {
      element.dataset.sdsVariant = 'simple'
      document.body.style.setProperty('--sds-font-heading', 'monospace')
      document.body.style.setProperty('--sds-radius-control', '13px')
      document.body.style.setProperty('--sds-radius-container', '17px')
    })
    await expect(shell.locator('h2')).toHaveCSS('font-family', 'monospace')
    await expect(shell.locator('.sds-button')).toHaveCSS('border-radius', '13px')
    await expect(shell.locator('.sds-card')).toHaveCSS('border-radius', '17px')
  })
}

test('settings pattern uses a card surface and consistently styled form controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#patterns')
  const form = page.locator('[data-copy-example="settings"]')
  const input = form.getByRole('textbox', { name: 'Project name', exact: true })
  const description = form.getByRole('textbox', { name: 'Description', exact: true })
  await expect(input).toHaveValue('Project Atlas')
  await expect(description).toHaveValue('Security research and analysis.')
  await expect(description).toHaveAttribute('rows', '3')
  await expect(description).toHaveAccessibleDescription("Briefly describe the project's purpose and scope.")
  await expect(form.getByRole('checkbox')).toBeChecked()
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect(form).toHaveCSS('padding', '24px')
    await expect(form).toHaveCSS('border-width', '1px')
    await expect(form).not.toHaveCSS('box-shadow', 'none')
    await expect(form.getByRole('heading', { name: 'Project settings' })).toHaveCSS('font-size', '20px')
    for (const group of await form.getByRole('group').all()) await expect(group).toHaveCSS('padding', '16px')
    const controlStyles = await form.evaluate(element => [...element.querySelectorAll('#settings-name, #settings-description')].map(control => {
      const computed = getComputedStyle(control)
      return Object.fromEntries(['font-family', 'font-size', 'line-height', 'border-color', 'border-radius', 'background-color', 'padding'].map(property => [property, computed.getPropertyValue(property)]))
    }))
    expect(controlStyles[1]).toEqual(controlStyles[0])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await input.fill('Updated project')
  await description.fill('Updated description')
  await form.getByRole('checkbox').uncheck()
  await form.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(input).toHaveValue('Project Atlas')
  await expect(description).toHaveValue('Security research and analysis.')
  await expect(form.getByRole('checkbox')).toBeChecked()
})

test('directory cards group related content tightly and separate pagination from the grid', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#patterns')
  const directory = page.locator('[data-copy-example="directory"]')
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const card of await directory.locator('.sds-card').all()) {
      await expect(card).toHaveCSS('padding-top', '24px')
      await expect(card).toHaveCSS('padding-left', '24px')
      await expect(card.getByRole('heading')).toHaveCSS('font-size', '24px')
      await expect(card.locator('.sds-card-link')).toHaveCSS('font-size', '24px')
      const spacing = await card.evaluate(element => {
        const label = element.querySelector('.sds-card-label').getBoundingClientRect()
        const title = element.querySelector('h4').getBoundingClientRect()
        const paragraphs = element.querySelectorAll('p')
        const description = paragraphs[0].getBoundingClientRect()
        const owner = paragraphs[1].getBoundingClientRect()
        return { eyebrow: title.top - label.bottom, description: description.top - title.bottom, owner: owner.top - description.bottom }
      })
      expect(spacing.eyebrow).toBeCloseTo(4, 0)
      expect(spacing.description).toBeCloseTo(8, 0)
      expect(spacing.owner).toBeCloseTo(16, 0)
    }
    const gap = await directory.evaluate(element => element.querySelector('.sds-pagination').getBoundingClientRect().top - element.querySelector('.sds-grid').getBoundingClientRect().bottom)
    expect(gap).toBeCloseTo(32, 0)
    await expect(directory.locator('.sds-pagination-status')).toHaveCSS('margin-top', '0px')
    await expect(directory.locator('.sds-pagination-status')).toHaveCSS('margin-bottom', '0px')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

for (const width of [1440, 390]) {
  test(`stretched card links preserve independent controls and show hover and focus feedback at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/#patterns')
    const recipe = page.locator('#recipes .sds-card').first()
    await recipe.hover()
    await expect(recipe.locator('.sds-card-link')).toHaveCSS('text-decoration-line', 'none')
    const card = page.locator('[data-copy-example="directory"] .sds-card').first()
    const primary = card.getByRole('link', { name: 'Project Atlas', exact: true })
    await card.evaluate(element => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'sds-button'
      button.textContent = 'Archive project'
      button.addEventListener('click', () => { element.dataset.archiveClicks = '1' })
      const secondary = document.createElement('a')
      secondary.className = 'sds-link'
      secondary.href = '/projects/atlas/activity'
      secondary.textContent = 'Project activity'
      secondary.addEventListener('click', event => {
        event.preventDefault()
        element.dataset.activityClicks = '1'
      })
      const label = document.createElement('label')
      label.className = 'sds-choice'
      const checkbox = document.createElement('input')
      checkbox.className = 'sds-checkbox'
      checkbox.type = 'checkbox'
      label.append(checkbox, 'Notify owner')
      element.append(button, secondary, label)
      const staticCard = document.createElement('article')
      staticCard.className = 'sds-card'
      staticCard.textContent = 'Static card'
      element.parentElement.append(staticCard)
    })
    await card.scrollIntoViewIfNeeded()
    await page.mouse.move(0, 0)
    await expect.poll(() => card.evaluate(element => element.matches(':hover'))).toBe(false)
    const restingShadow = await card.evaluate(element => getComputedStyle(element).boxShadow)
    await card.hover({ position: { x: 12, y: 12 } })
    await expect(card).not.toHaveCSS('box-shadow', restingShadow)
    await expect(primary).toHaveCSS('text-decoration-line', 'none')
    expect(await card.evaluate(element => {
      const rect = element.getBoundingClientRect()
      return document.elementFromPoint(rect.left + 12, rect.top + 12) === element.querySelector('.sds-card-link')
    })).toBe(true)
    await card.getByRole('button', { name: 'Archive project' }).click()
    await expect(card).toHaveAttribute('data-archive-clicks', '1')
    const activity = card.getByRole('link', { name: 'Project activity', exact: true })
    await activity.hover()
    await expect(activity).toHaveCSS('text-decoration-line', 'underline')
    await activity.click()
    await expect(card).toHaveAttribute('data-activity-clicks', '1')
    await card.getByText('Notify owner', { exact: true }).click()
    await expect(card.getByRole('checkbox', { name: 'Notify owner' })).toBeChecked()
    await page.keyboard.press('Tab')
    await primary.focus()
    await expect(primary).toBeFocused()
    await expect(card).toHaveCSS('outline-style', 'solid')
    await expect(card).toHaveCSS('outline-width', '2px')
    await expect(primary).toHaveCSS('box-shadow', 'none')
    await expect(primary).toHaveCSS('text-decoration-line', 'none')
    const staticCard = page.locator('[data-copy-example="directory"] .sds-card').filter({ hasNot: page.locator('.sds-card-link') }).first()
    const staticShadow = await staticCard.evaluate(element => getComputedStyle(element).boxShadow)
    await staticCard.hover()
    await expect(staticCard).toHaveCSS('box-shadow', staticShadow)
    await page.route('**/projects/atlas', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Project Atlas</title>' }))
    await card.click({ position: { x: 12, y: 12 } })
    await expect(page).toHaveURL(/\/projects\/atlas$/)
  })
}

test('brochure footer links have no underlines and dark-footer links turn white on hover', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByText('Brochure site shell preview', { exact: true }).click()
  const footer = page.locator('[data-copy-layout="Brochure"] > footer')
  const mutedColor = await footer.locator('.sds-app-footer-main').evaluate(element => getComputedStyle(element).color)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    const decorations = await footer.locator('a').evaluateAll(links => links.map(link => getComputedStyle(link).textDecorationLine))
    expect(decorations.every(decoration => decoration === 'none')).toBe(true)
    for (const selector of ['.sds-app-footer-about address a', '.sds-app-footer-navigation a', '.sds-app-footer-legal ul a', '.sds-app-footer-legal p a']) {
      const link = footer.locator(selector).first()
      await expect(link).toHaveCSS('color', mutedColor)
      await link.hover()
      await expect(link).toHaveCSS('color', 'rgb(255, 255, 255)')
      await expect(link).toHaveCSS('text-decoration-line', 'none')
      await expect(link).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      await page.mouse.move(0, 0)
    }
    const action = footer.locator('.sds-app-footer-links a').first()
    await action.hover()
    await expect(action).toHaveCSS('text-decoration-line', 'none')
    await page.mouse.move(0, 0)
  }
})

for (const width of [1440, 700, 390, 320]) {
  test(`brochure footer disclosures use compact rows and right-aligned chevrons at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.getByText('Brochure site shell preview', { exact: true }).click()
    const navigation = page.locator('[data-copy-layout="Brochure"]').getByRole('navigation', { name: 'SEI footer', exact: true })
    const disclosures = navigation.locator('details')
    for (const disclosure of await disclosures.all()) {
      const summary = disclosure.locator('summary')
      await expect(summary).toHaveCSS('display', 'flex')
      await expect(summary).toHaveCSS('font-size', '16px')
      await expect(summary).toHaveCSS('line-height', '24px')
      await expect(summary).toHaveCSS('list-style-type', 'none')
      await expect(summary).toHaveCSS('cursor', 'pointer')
      const expanded = await summary.evaluate(element => {
        const styles = getComputedStyle(element, '::after')
        return { height: element.getBoundingClientRect().height, border: styles.borderBottomWidth, transform: styles.transform, display: styles.display }
      })
      expect(expanded.height).toBeCloseTo(width >= 1024 ? 32 : 40, 0)
      expect(expanded.border).toBe('1px')
      expect(expanded.display).not.toBe('none')
      await summary.click()
      await expect(disclosure).not.toHaveAttribute('open')
      await expect(disclosure.getByRole('link').first()).not.toBeVisible()
      expect(await summary.evaluate(element => getComputedStyle(element, '::after').transform)).not.toBe(expanded.transform)
      await summary.press('Enter')
      await expect(disclosure).toHaveAttribute('open', '')
      await expect(disclosure.getByRole('link').first()).toBeVisible()
    }
    await expect(disclosures.first()).toHaveCSS('border-bottom-width', width >= 1024 ? '0px' : '1px')
    await expect(disclosures.last()).toHaveCSS('border-bottom-width', '0px')
    if (width >= 1024) {
      await expect(navigation).toHaveCSS('grid-template-columns', /\S+ \S+ \S+/)
    }
    for (const link of await navigation.getByRole('link').all()) await expect(link).toBeVisible()
  })
}

test('playground introductions keep CTAs left-aligned and compact examples use their own typography', async ({ page }) => {
  await page.goto('/')
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const sectionId of ['getting-started', 'layouts', 'patterns']) {
      const bounds = await page.locator(`#${sectionId} > .sds-section-header`).evaluate(header => {
        const heading = header.querySelector('h2').getBoundingClientRect()
        const link = header.querySelector('[data-sds-variant="cta"]').getBoundingClientRect()
        return { headingLeft: heading.left, linkLeft: link.left, headingBottom: heading.bottom, linkTop: link.top }
      })
      expect(bounds.linkLeft).toBeCloseTo(bounds.headingLeft, 0)
      expect(bounds.linkTop).toBeGreaterThanOrEqual(bounds.headingBottom)
    }
    for (const label of await page.locator('.sds-list-item h3, .sds-timeline-item h3').all()) {
      await expect(label).toHaveCSS('font-size', '14px')
      await expect(label).toHaveCSS('margin-top', '0px')
      await expect(label).toHaveCSS('margin-bottom', '0px')
      await expect(label).toHaveCSS('line-height', '20px')
      const description = label.locator('+ p')
      await expect(description).toHaveCSS('margin-top', '4px')
      await expect(description).toHaveCSS('margin-bottom', '0px')
      await expect(description).toHaveCSS('line-height', '20px')
      const gap = await label.evaluate(element => element.nextElementSibling.getBoundingClientRect().top - element.getBoundingClientRect().bottom)
      expect(gap).toBeCloseTo(4, 0)
    }
    const small = page.getByRole('heading', { name: 'Small prose', exact: true })
    const large = page.getByRole('heading', { name: 'Large prose', exact: true })
    await expect(small).toHaveCSS('font-size', '18px')
    await expect(large).toHaveCSS('font-size', '24px')
    await expect(small.locator('..').locator('p')).toHaveCSS('font-size', '14px')
    await expect(large.locator('..').locator('p')).toHaveCSS('font-size', '18px')
  }
})

for (const [name, panelId, openLabel, closeLabel, side] of [
  ['Application', 'application-preview-sidebar', 'Open preview navigation', 'Close preview navigation', 'left'],
  ['Documentation site', 'documentation-preview-sidebar', 'Open documentation navigation', 'Close documentation navigation', 'right'],
  ['Brochure', 'brochure-preview-navigation', 'Open brochure navigation', 'Close brochure navigation', 'right'],
]) {
  test(`${name} mobile navigation opens from the ${side}`, async ({ page }) => {
    await page.goto('/#layouts')
    const root = page.locator(`[data-copy-layout="${name}"]`)
    await root.evaluate(element => { element.closest('details').open = true })
    for (const width of [700, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      const open = root.getByRole('button', { name: openLabel, exact: true })
      const panel = root.locator(`#${panelId}`)
      await expect(open).toBeVisible()
      const buttonBounds = await open.boundingBox()
      const rootBounds = await root.boundingBox()
      expect(buttonBounds.x + buttonBounds.width / 2 > rootBounds.x + rootBounds.width / 2).toBe(side === 'right')
      await open.click()
      await expect(panel).toBeVisible()
      await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
      const panelBounds = await panel.boundingBox()
      expect(side === 'right' ? width - panelBounds.x - panelBounds.width : panelBounds.x).toBeCloseTo(0, 0)
      if (name === 'Documentation site') {
        expect(panelBounds.width).toBeCloseTo(Math.min(448, width - 12), 0)
        expect(panelBounds.y).toBeCloseTo(0, 0)
        expect(panelBounds.height).toBeCloseTo(1000, 0)
        await expect(panel).toHaveCSS('border-top-left-radius', '16px')
        await expect(panel.locator('header > strong')).toHaveCSS('font-size', '20px')
        const primary = panel.getByRole('navigation', { name: 'Documentation sections', exact: true })
        await expect(primary).toBeVisible()
        for (const link of await primary.getByRole('link').all()) {
          await expect(link).toHaveCSS('font-size', '16px')
          await expect(link).toHaveCSS('min-height', '48px')
        }
        const toc = panel.getByRole('navigation', { name: 'On this page', exact: true })
        await expect(toc).toBeVisible()
        const separators = await panel.locator(':scope > nav + nav').evaluateAll(sections => sections.map(section => {
          const previousRow = section.previousElementSibling.querySelector(':scope > ul > li:last-child > a').getBoundingClientRect()
          const nextRow = section.querySelector('strong, summary, a').getBoundingClientRect()
          const divider = getComputedStyle(section, '::before')
          const top = section.getBoundingClientRect().top
          return { height: divider.height, above: top - previousRow.bottom, below: nextRow.top - top - parseFloat(divider.height) }
        }))
        expect(separators).toHaveLength(2)
        for (const separator of separators) {
          expect(separator.height).toBe('1px')
          expect(separator.above).toBeCloseTo(16, 0)
          expect(separator.below).toBeCloseTo(16, 0)
        }
        await expect(toc.getByRole('link')).toHaveCount(3)
        await expect(toc.getByRole('link').first()).toHaveCSS('font-size', '14px')
        if (width === 390) {
          const link = toc.getByRole('link').first()
          await link.hover()
          await expect(link).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
          const inset = await link.evaluate(element => {
            const list = element.closest('ul')
            return element.getBoundingClientRect().left - list.getBoundingClientRect().left - parseFloat(getComputedStyle(list).borderLeftWidth)
          })
          expect(inset).toBeCloseTo(0, 0)
          await link.evaluate(element => { element.setAttribute('aria-current', 'location') })
          const marker = await link.evaluate(element => {
            const style = getComputedStyle(element)
            return { width: style.borderLeftWidth, left: element.getBoundingClientRect().left, guideLeft: element.closest('ul').getBoundingClientRect().left }
          })
          expect(marker.width).toBe('2px')
          expect(marker.left).toBeCloseTo(marker.guideLeft, 0)
          await link.evaluate(element => { element.removeAttribute('aria-current') })
        }
      }
      if (name === 'Brochure') {
        expect(panelBounds.width).toBeCloseTo(Math.min(448, width - 12), 0)
        expect(panelBounds.y).toBeCloseTo(0, 0)
        expect(panelBounds.height).toBeCloseTo(1000, 0)
        await expect(panel).toHaveCSS('border-top-left-radius', '16px')
        const title = panel.locator('header > strong')
        await expect(title).toHaveText('Software Engineering Institute')
        await expect(title).toHaveCSS('font-size', '24px')
        const titleBounds = await title.boundingBox()
        const closeBounds = await root.getByRole('button', { name: closeLabel, exact: true }).boundingBox()
        expect(titleBounds.x + titleBounds.width).toBeLessThanOrEqual(closeBounds.x)
        const links = panel.getByRole('navigation', { name: 'Brochure pages', exact: true }).getByRole('link')
        await expect(links).toHaveCount(2)
        const items = elements => elements.map(element => ({ text: element.textContent.trim(), href: element.getAttribute('href'), current: element.getAttribute('aria-current') }))
        expect(await links.evaluateAll(items)).toEqual(await root.getByRole('navigation', { name: 'Brochure preview', exact: true, includeHidden: true }).locator('a').evaluateAll(items))
        for (const link of await links.all()) {
          await expect(link).toHaveCSS('font-size', '16px')
          await expect(link).toHaveCSS('min-height', '48px')
          const chevron = await link.evaluate(element => getComputedStyle(element, '::after').content)
          expect(chevron).toBe('none')
        }
        await expect(panel.locator('nav li + li').first()).toHaveCSS('border-top-width', '0px')
        if (width === 390) {
          const link = links.last()
          await link.hover()
          await expect(link).toHaveCSS('border-radius', '0px')
          await expect(link).toHaveCSS('padding-left', '24px')
          await expect(link).toHaveCSS('padding-right', '24px')
          await expect(link).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
          const alignment = await link.evaluate(element => {
            const range = document.createRange()
            range.selectNodeContents(element)
            return { textLeft: range.getBoundingClientRect().left, dividerLeft: element.parentElement.getBoundingClientRect().left }
          })
          expect(alignment.textLeft - alignment.dividerLeft).toBeCloseTo(24, 0)
        }
      }
      await root.getByRole('button', { name: closeLabel, exact: true }).click()
      await expect(panel).not.toBeVisible()
      const closedOffset = await panel.evaluate(element => {
        const transition = element.style.transition
        element.style.transition = 'none'
        element.setAttribute('sds-closing', '')
        const offset = new DOMMatrixReadOnly(getComputedStyle(element).transform).m41
        element.removeAttribute('sds-closing')
        element.style.transition = transition
        return offset
      })
      expect(side === 'right' ? closedOffset : -closedOffset).toBeGreaterThan(0)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
    await page.setViewportSize({ width: 1440, height: 1000 })
    await expect(root.getByRole('button', { name: openLabel, exact: true })).not.toBeVisible()
    if (name === 'Documentation site') {
      await expect(root.locator('.sds-sidebar > .sds-app-navigation')).not.toBeVisible()
      await expect(root.locator('.sds-sidebar > .sds-app-toc')).not.toBeVisible()
    }
    if (name === 'Brochure') await expect(root.getByRole('navigation', { name: 'Brochure preview', exact: true })).toBeVisible()
  })

  test(`${name} mobile navigation supports Escape and outside click`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 })
    await page.goto('/#layouts')
    const root = page.locator(`[data-copy-layout="${name}"]`)
    await root.evaluate(element => { element.closest('details').open = true })
    const open = root.getByRole('button', { name: openLabel, exact: true })
    const panel = root.locator(`#${panelId}`)
    await open.click()
    await expect(panel).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel).not.toBeVisible()
    await open.click()
    await expect(panel).toBeVisible()
    await page.mouse.click(side === 'right' ? 2 : 388, 500)
    await expect(panel).not.toBeVisible()
  })
}

for (const theme of ['forge', 'plaid']) {
  test(`Documentation and Brochure primary mobile links use identical normal, hover, and current styles in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 })
    await page.goto('/#layouts')
    const snapshots = []
    for (const [name, openLabel, linkLabel] of [
      ['Documentation site', 'Open documentation navigation', 'Reference'],
      ['Brochure', 'Open brochure navigation', 'Research'],
    ]) {
      const root = page.locator(`[data-copy-layout="${name}"]`)
      await root.evaluate((element, theme) => {
        element.closest('details').open = true
        element.setAttribute('data-sds-theme', theme)
      }, theme)
      await root.getByRole('button', { name: openLabel, exact: true }).click()
      const panel = root.locator('.sds-sidebar')
      await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
      const link = panel.locator('header + nav').getByRole('link', { name: linkLabel, exact: true })
      const styles = async () => link.evaluate(element => {
        const computed = getComputedStyle(element)
        const properties = ['display', 'box-sizing', 'font-family', 'font-size', 'font-weight', 'line-height', 'color', 'background-color', 'min-height', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right', 'border-radius', 'border-left-width', 'border-right-width', 'border-top-width', 'border-bottom-width', 'text-align', 'text-decoration-line', 'align-items', 'justify-content']
        const marker = getComputedStyle(element, '::before')
        return {
          values: Object.fromEntries(properties.map(property => [property, computed.getPropertyValue(property)])),
          marker: { content: marker.content, width: marker.width, background: marker.backgroundColor },
          chevron: getComputedStyle(element, '::after').content,
        }
      })
      const normal = await styles()
      await link.hover()
      const hover = await styles()
      await page.mouse.move(2, 500)
      await link.evaluate(element => { element.setAttribute('aria-current', 'location') })
      const current = await styles()
      snapshots.push({ normal, hover, current })
      await panel.evaluate(element => { element.hidePopover() })
      await expect(panel).not.toBeVisible()
    }
    expect(snapshots[1]).toEqual(snapshots[0])
  })
}

test('simple shell keeps its avatar account control beside the brand on mobile', async ({ page }) => {
  await page.goto('/#layouts')
  const root = page.locator('[data-copy-layout="Simple application"]')
  await root.evaluate(element => { element.closest('details').open = true })
  const header = root.locator(':scope > .sds-app-header')
  const brand = header.locator('.sds-app-brand')
  const account = header.getByRole('button', { name: 'Alex Morgan', exact: true })
  await expect(account).toHaveAttribute('data-sds-variant', 'text')
  await expect(account.locator('.sds-avatar')).toHaveText('AM')
  for (const width of [1440, 700, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect(header).toHaveCSS('flex-direction', 'row')
    const headerBounds = await header.boundingBox()
    const brandBounds = await brand.boundingBox()
    const accountBounds = await account.boundingBox()
    expect(accountBounds.x).toBeGreaterThanOrEqual(brandBounds.x + brandBounds.width + 8)
    expect(Math.abs(brandBounds.y + brandBounds.height / 2 - accountBounds.y - accountBounds.height / 2)).toBeLessThanOrEqual(1)
    expect(headerBounds.x + headerBounds.width - accountBounds.x - accountBounds.width).toBeCloseTo(16, 0)
    expect(headerBounds.height).toBeLessThanOrEqual(50)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('simple shell keeps a long primary navigation in its own scrolling mobile row', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/#layouts')
  const root = page.locator('[data-copy-layout="Simple application"]')
  await root.evaluate(element => {
    element.closest('details').open = true
    const navigation = document.createElement('nav')
    navigation.setAttribute('aria-label', 'Primary sections')
    const list = document.createElement('ul')
    for (const name of ['Overview', 'Assignments', 'Approvals', 'Reports', 'Settings', 'Administration']) {
      const item = document.createElement('li')
      const link = document.createElement('a')
      link.href = '#layouts'
      link.textContent = name
      item.append(link)
      list.append(item)
    }
    navigation.append(list)
    element.querySelector('.sds-app-header').append(navigation)
  })
  const navigation = root.getByRole('navigation', { name: 'Primary sections' })
  await expect(navigation).toHaveCSS('overflow-x', 'auto')
  expect(await navigation.evaluate(element => {
    const brand = element.parentElement.querySelector('.sds-app-brand').getBoundingClientRect()
    return element.scrollWidth > element.clientWidth && element.getBoundingClientRect().top >= brand.bottom
  })).toBe(true)
  await expect(root.getByRole('button', { name: 'Alex Morgan', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('persistent sidebar example keeps content inset from its navigation', async ({ page }) => {
  await page.goto('/#composition')
  const layout = page.locator('[data-example-container]').filter({
    has: page.getByRole('heading', { name: 'Persistent sidebar', exact: true }),
  }).locator('.sds-sidebar-layout')
  const content = layout.locator(':scope > .sds-stack')
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect(content).toHaveCSS('padding-left', '24px')
    await expect(content).toHaveCSS('padding-right', '24px')
    await expect(content).toHaveCSS('padding-top', '24px')
    const sidebarBounds = await layout.locator('.sds-sidebar').boundingBox()
    const textBounds = await content.locator('.sds-eyebrow').boundingBox()
    const inset = width > 1024 ? textBounds.x - sidebarBounds.x - sidebarBounds.width : textBounds.y - sidebarBounds.y - sidebarBounds.height
    expect(inset).toBeCloseTo(24, 0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('sidebar trees align optional icons and retain guide lines through expanded child groups', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#layouts')
  const root = page.locator('[data-copy-layout="Documentation site"]')
  await root.evaluate(element => { element.closest('details').open = true })
  const sidebar = root.locator('.sds-sidebar')
  const groups = sidebar.getByRole('navigation', { name: 'Documentation pages' }).locator('details')
  const parent = groups.first()
  const child = groups.nth(1)
  const summary = child.locator(':scope > summary')
  const installation = child.getByRole('link', { name: 'Installation' })
  const current = sidebar.getByRole('link', { name: 'Introduction', exact: true })
  for (const disclosure of await sidebar.locator('summary').all()) {
    await expect(disclosure).toHaveCSS('font-weight', '400')
  }
  await summary.evaluate(element => { element.style.inlineSize = '150px' })
  await expect.poll(() => summary.evaluate(element => {
    const icon = element.querySelector('svg').getBoundingClientRect()
    const style = getComputedStyle(element)
    const firstLineCenter = element.getBoundingClientRect().top + parseFloat(style.paddingTop) + parseFloat(style.lineHeight) / 2
    return Math.abs(icon.top + icon.height / 2 - firstLineCenter)
  })).toBeLessThanOrEqual(1)
  await summary.evaluate(element => { element.style.removeProperty('inline-size') })
  await expect(parent.locator(':scope > ul')).toHaveCSS('border-left-width', '2px')
  await expect(child.locator(':scope > ul')).toHaveCSS('border-left-width', '0px')
  for (const list of await sidebar.locator('details > ul').all()) {
    await expect(list).toHaveCSS('margin-left', await list.evaluate(element => element.matches('nav details details > ul') ? '0px' : '16px'))
  }
  await expect(sidebar.locator(':scope > .sds-app-navigation')).not.toBeVisible()
  await expect.poll(() => sidebar.evaluate(element => {
    const heading = element.querySelector('header strong').getBoundingClientRect()
    const firstRow = element.querySelector('nav[aria-label="Documentation pages"] > ul > li > details > summary').getBoundingClientRect()
    return firstRow.top - heading.bottom
  })).toBeCloseTo(16, 0)
  for (const icon of await sidebar.locator('nav svg').all()) {
    await expect(icon).toHaveCSS('width', '16px')
    await expect(icon).toHaveCSS('height', '16px')
    await expect(icon).toHaveCSS('flex-shrink', '0')
    await expect(icon).toHaveAttribute('aria-hidden', 'true')
  }
  await expect(current).toHaveCSS('border-left-width', '0px')
  await expect(current).toHaveCSS('border-radius', '8px')
  await expect(current).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(current).toHaveCSS('font-weight', '400')
  const currentColor = await current.evaluate(element => getComputedStyle(element, '::before').backgroundColor)
  await expect(current).toHaveCSS('color', currentColor)
  await expect(current.locator('svg')).toHaveCSS('color', currentColor)
  expect(await current.evaluate(element => {
    const marker = getComputedStyle(element, '::before')
    const guide = getComputedStyle(element.closest('ul'))
    return marker.width === guide.borderLeftWidth &&
      parseFloat(marker.left) === -parseFloat(guide.paddingLeft) - parseFloat(guide.borderLeftWidth)
  })).toBe(true)
  const expanded = await summary.evaluate(element => getComputedStyle(element, '::after').transform)
  await summary.click()
  await expect(installation).not.toBeVisible()
  expect(await summary.evaluate(element => getComputedStyle(element, '::after').transform)).not.toBe(expanded)
  await summary.click()
  await expect(installation).toBeVisible()
  const parentIcon = await parent.locator(':scope > summary svg').boundingBox()
  const headingIcon = await sidebar.locator('header strong > svg').boundingBox()
  const childIcon = await summary.locator('svg').boundingBox()
  const leafIcon = await installation.locator('svg').boundingBox()
  expect(Math.abs(headingIcon.x - parentIcon.x)).toBeLessThanOrEqual(1)
  expect(childIcon.x).toBeGreaterThan(parentIcon.x)
  expect(leafIcon.x).toBeGreaterThan(childIcon.x)
  await installation.hover()
  expect(await installation.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)')
  await expect(installation).toHaveCSS('border-radius', '8px')
  await current.hover()
  await expect(current).toHaveCSS('color', currentColor)
  await expect(current).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await current.evaluate(element => element.removeAttribute('aria-current'))
  await installation.evaluate(element => element.setAttribute('aria-current', 'page'))
  expect(await installation.evaluate(element => {
    const guide = element.closest('nav').querySelector(':scope > ul > li > details > ul').getBoundingClientRect()
    const marker = getComputedStyle(element, '::before')
    return Math.abs(element.getBoundingClientRect().x + parseFloat(marker.left) - guide.x) <= 1
  })).toBe(true)
  await sidebar.locator('nav svg').evaluateAll(icons => icons.forEach(icon => icon.remove()))
  await expect(installation).toHaveCSS('height', '32px')
  await summary.click()
  await expect(installation).not.toBeVisible()
  await summary.press('Enter')
  await expect(installation).toBeVisible()
})

for (const width of [1440, 390]) {
  test(`editorial navigation and table of contents match reference typography at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/#layouts')
    const root = page.locator('[data-copy-layout="Documentation site"]')
    await root.evaluate(element => { element.closest('details').open = true })
    if (width === 390) await root.getByRole('button', { name: 'Open documentation navigation' }).click()
    const toc = width === 390 ? root.locator('.sds-sidebar > .sds-app-toc') : root.locator('.sds-app-content > .sds-app-toc')
    await expect(toc).toHaveCSS('border-left-width', '0px')
    await expect(toc.locator('strong')).toHaveCSS('font-weight', '600')
    const link = toc.getByRole('link').first()
    await link.evaluate(element => { element.removeAttribute('aria-current') })
    await expect(link).toHaveCSS('font-size', '14px')
    await expect(link).toHaveCSS('line-height', '20px')
    await expect(link).toHaveCSS('padding-top', '6px')
    await expect(link).toHaveCSS('padding-left', '20px')
    await expect(link).toHaveCSS('border-left-width', '2px')
    await expect(link).toHaveCSS('font-weight', '400')
    await link.evaluate(element => { element.setAttribute('aria-current', 'location') })
    await expect(link).toHaveCSS('font-weight', '600')
    await expect.poll(() => link.evaluate(element => getComputedStyle(element).borderLeftColor === getComputedStyle(element).color)).toBe(true)
    if (width === 1440) {
      const primary = root.locator(':scope > .sds-app-header > .sds-app-navigation a').first()
      await expect(primary).toHaveCSS('font-size', '14px')
      await expect(primary).toHaveCSS('font-weight', '600')
      const brochure = page.locator('[data-copy-layout="Brochure"]')
      await brochure.evaluate(element => { element.closest('details').open = true })
      await expect(brochure.locator('.sds-app-header-content > nav a').first()).toHaveCSS('font-size', '14px')
      await expect(brochure.locator('.sds-app-header-content > nav a').first()).toHaveCSS('font-weight', '600')
    }
  })
}

test('documentation content uses a continuous surface without a sidebar edge', async ({ page }) => {
  await page.goto('/#layouts')
  const root = page.locator('[data-copy-layout="Documentation site"]')
  await root.evaluate(element => { element.closest('details').open = true })
  const sidebar = root.locator('.sds-sidebar')
  const content = root.locator('.sds-app-body')
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    if (width === 390) await root.getByRole('button', { name: 'Open documentation navigation' }).click()
    await expect(sidebar).toBeVisible()
    for (const scheme of ['light', 'dark']) {
      await root.evaluate((element, scheme) => { element.dataset.sdsColorScheme = scheme }, scheme)
      const surface = await sidebar.evaluate(element => getComputedStyle(element).backgroundColor)
      await expect(content).toHaveCSS('background-color', surface)
      await expect(root).toHaveCSS('background-color', surface)
      await expect(sidebar).toHaveCSS('border-right-width', '0px')
      if (scheme === 'light') await expect(content).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    }
    if (width === 390) await root.getByRole('button', { name: 'Close documentation navigation' }).click()
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  const application = page.locator('[data-copy-layout="Application"]')
  await application.evaluate(element => { element.closest('details').open = true })
  expect(await application.locator('.sds-app-body').evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgb(255, 255, 255)')
})

test('documentation header matches primary tabs, site title, and compact utility actions', async ({ page }) => {
  await page.goto('/#layouts')
  const root = page.locator('[data-copy-layout="Documentation site"]')
  await root.evaluate(element => { element.closest('details').open = true })
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    const current = root.locator('.sds-app-header .sds-app-navigation [aria-current="page"]')
    const inactive = root.locator('.sds-app-header .sds-app-navigation a:not([aria-current])')
    const brand = root.locator('.sds-app-header > .sds-app-brand')
    await expect(current).toHaveCSS('border-bottom-width', '0px')
    await expect.poll(() => current.evaluate(element => {
      const style = getComputedStyle(element)
      return style.boxShadow.includes('inset') && style.boxShadow.includes('-2px') && style.boxShadow.includes(style.color)
    })).toBe(true)
    await expect(current).toHaveCSS('font-size', '14px')
    await expect(current).toHaveCSS('padding-top', '20px')
    await expect(inactive).toHaveCSS('box-shadow', 'none')
    await expect(brand).toHaveText('Documentation Site')
    await expect(brand).toHaveCSS('font-size', '18px')
    await expect(brand).toHaveCSS('font-weight', '600')
    await expect(brand.locator('svg')).toHaveCSS('width', '16px')
    await expect(brand.locator('svg')).toHaveAttribute('aria-hidden', 'true')
    for (const action of await root.locator('.sds-app-masthead .sds-button').all()) {
      await expect(action).toHaveCSS('font-size', '20px')
      await expect(action.locator('svg').first()).toHaveCSS('width', '20px')
      await expect(action.locator('svg').first()).toHaveAttribute('aria-hidden', 'true')
      await expect(action).toHaveAttribute('data-sds-size', 'sm')
      await expect(action).toHaveAttribute('data-sds-density', 'compact')
    }
    const utilities = root.locator('.sds-app-masthead')
    await expect(utilities.locator('.sds-button')).toHaveCount(3)
    await expect(utilities.locator('hr')).toHaveCSS('width', '1px')
    await expect(utilities.locator('hr')).toHaveCSS('height', '24px')
    await expect(utilities.locator('hr')).toHaveAttribute('aria-hidden', 'true')
    const displayControls = utilities.locator('[data-sds-action]')
    await expect(displayControls).toHaveCount(1)
    for (const control of await displayControls.all()) {
      if (width >= 1024) await expect(control).toBeVisible()
      else await expect(control).toBeHidden()
    }
    await expect(root.getByRole('navigation', { name: 'Documentation footer' }).getByRole('link').first()).toHaveCSS('border-bottom-width', '0px')
    if (width > 1024) expect(await current.evaluate(element => {
      const tab = element.getBoundingClientRect()
      const header = element.closest('.sds-app-header').getBoundingClientRect()
      return tab.bottom <= header.bottom && header.bottom - tab.bottom <= 1
    })).toBe(true)
    else {
      await expect(root.locator('.sds-app-header .sds-app-navigation')).not.toBeVisible()
      await expect(root.locator('.sds-app-content > .sds-app-toc')).not.toBeVisible()
      const menu = root.getByRole('button', { name: 'Open documentation navigation' })
      await expect(menu).toBeVisible()
      const titleBounds = await brand.boundingBox()
      const menuBounds = await menu.boundingBox()
      expect(menuBounds.x).toBeGreaterThan(titleBounds.x + titleBounds.width)
      expect(Math.abs(titleBounds.y + titleBounds.height / 2 - menuBounds.y - menuBounds.height / 2)).toBeLessThanOrEqual(1)
      await expect(root.locator('.sds-app-header')).toHaveCSS('height', '60px')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('documentation masthead uses reference artwork without fullscreen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/#layouts')
  const root = page.locator('[data-copy-layout="Documentation site"]')
  await root.evaluate(element => { element.closest('details').open = true })
  await expect(root.locator('[data-sds-action="toggle-fullscreen"]')).toHaveCount(0)
  await expect(root.locator('.sds-app-masthead a[title="GitHub"] svg')).toHaveAttribute('viewBox', '0 0 12 13')
  await expect(root.locator('.sds-app-masthead a[title="GitHub"] path')).toHaveAttribute('d', /^M4\.05469 9\.82812/)
  await expect(root.locator('.sds-app-masthead a[aria-haspopup="dialog"] path')).toHaveAttribute('d', /^m19\.6 21l-6\.3-6\.3/)
  await expect(root.locator('.sds-app-header > button path')).toHaveAttribute('d', 'M3 18v-2h18v2zm0-5v-2h18v2zm0-5V6h18v2z')
  const theme = root.locator('[data-sds-action="toggle-color-scheme"]')
  for (const scheme of ['light', 'dark']) {
    await page.locator('body').evaluate((element, value) => { element.dataset.sdsColorScheme = value }, scheme)
    await expect(theme).toHaveAttribute('aria-pressed', String(scheme === 'dark'))
    const icon = theme.locator(scheme === 'light' ? 'svg:first-child' : 'svg:last-child')
    await expect(icon).toBeVisible()
    await expect(icon.locator('path')).toHaveAttribute('d', scheme === 'light' ? /^M14 22q-2\.05/ : /^M11 5V1/)
  }
})

test('documentation header dropdowns use primary tab styling in light and dark schemes', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#layouts')
  const root = page.locator('[data-copy-layout="Documentation site"]')
  await root.evaluate(element => {
    element.closest('details').open = true
    element.querySelector('.sds-app-header .sds-app-navigation > ul').insertAdjacentHTML('beforeend', `
      <li><sds-dropdown><button class="sds-button" type="button" data-sds-density="compact" data-sds-variant="text" popovertarget="documentation-tab-menu">Coding Standards</button>
      <menu id="documentation-tab-menu" class="sds-dropdown-menu" popover><li><a role="menuitem" href="#layouts">Android</a></li></menu></sds-dropdown></li>`)
  })
  const button = root.getByRole('button', { name: 'Coding Standards', exact: true })
  for (const scheme of ['light', 'dark']) {
    await root.evaluate((element, value) => { element.dataset.sdsColorScheme = value }, scheme)
    await page.mouse.move(0, 0)
    await expect(button).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(button).toHaveCSS('padding', '20px 16px')
    await expect(button).toHaveCSS('border-radius', '0px')
    await expect(button).toHaveCSS('font-size', '14px')
    await expect(button).toHaveCSS('font-weight', '600')
    const inactiveTab = root.locator('.sds-app-header .sds-app-navigation a:not([aria-current])').first()
    await expect(button).toHaveCSS('color', await inactiveTab.evaluate(element => getComputedStyle(element).color))
    const bounds = await button.boundingBox()
    const header = await root.locator('.sds-app-header').boundingBox()
    expect(header.y + header.height - bounds.y - bounds.height).toBeLessThanOrEqual(1)
    await button.hover()
    await expect.poll(() => button.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)')
    await button.focus()
    await button.press('Enter')
    await expect(root.locator('#documentation-tab-menu')).toBeVisible()
    const menuItem = root.getByRole('menuitem', { name: 'Android', exact: true })
    await expect(menuItem).toHaveCSS('padding', '8px 12px')
    await expect(menuItem).toHaveCSS('font-weight', '400')
    await page.keyboard.press('Escape')
    await expect(root.locator('#documentation-tab-menu')).toBeHidden()
    await expect(button).toBeFocused()
    await button.evaluate(element => element.setAttribute('aria-current', 'page'))
    await expect.poll(() => button.evaluate(element => {
      const style = getComputedStyle(element)
      return style.boxShadow.includes('inset') && style.boxShadow.includes('-2px') && style.boxShadow.includes(style.color)
    })).toBe(true)
    await button.evaluate(element => element.removeAttribute('aria-current'))
  }
  await root.locator('.sds-sidebar > .sds-app-navigation > ul').evaluate(element => {
    element.insertAdjacentHTML('beforeend', `<li><a href="#layouts">Coding reference</a></li>
      <li><sds-dropdown><button class="sds-button" type="button" data-sds-density="compact" data-sds-variant="text" popovertarget="documentation-mobile-tab-menu">Coding Standards</button>
      <menu id="documentation-mobile-tab-menu" class="sds-dropdown-menu" popover><li><a role="menuitem" href="#layouts">Android</a></li></menu></sds-dropdown></li>`)
  })
  await page.setViewportSize({ width: 390, height: 900 })
  await root.getByRole('button', { name: 'Open documentation navigation', exact: true }).click()
  const drawer = root.locator('.sds-sidebar')
  const mobileButton = drawer.getByRole('button', { name: 'Coding Standards', exact: true })
  const reference = drawer.getByRole('link', { name: 'Coding reference', exact: true })
  for (const scheme of ['light', 'dark']) {
    await root.evaluate((element, value) => { element.dataset.sdsColorScheme = value }, scheme)
    await page.mouse.move(0, 0)
    await expect(mobileButton).toHaveCSS('padding', await reference.evaluate(element => getComputedStyle(element).padding))
    await expect(mobileButton).toHaveCSS('font-size', await reference.evaluate(element => getComputedStyle(element).fontSize))
    await expect(mobileButton).toHaveCSS('border-radius', '0px')
    await expect(mobileButton).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(mobileButton).toHaveCSS('color', await reference.evaluate(element => getComputedStyle(element).color))
    const row = await reference.boundingBox()
    const trigger = await mobileButton.boundingBox()
    expect(trigger.x).toBeCloseTo(row.x, 0)
    expect(trigger.width).toBeCloseTo(row.width, 0)
    await mobileButton.hover()
    await expect.poll(() => mobileButton.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)')
    await mobileButton.focus()
    await mobileButton.press('Enter')
    await expect(root.locator('#documentation-mobile-tab-menu')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(root.locator('#documentation-mobile-tab-menu')).toBeHidden()
    await expect(mobileButton).toBeFocused()
    await mobileButton.evaluate(element => element.setAttribute('aria-current', 'page'))
    await expect.poll(() => mobileButton.evaluate(element => {
      const style = getComputedStyle(element)
      return style.borderInlineStartColor === style.color && style.borderInlineStartWidth === '4px'
    })).toBe(true)
    await mobileButton.evaluate(element => element.removeAttribute('aria-current'))
  }
})

test('documentation code blocks match reference colors, typography, and icon controls', async ({ page }) => {
  await page.goto('/#layouts')
  const root = page.locator('[data-copy-layout="Documentation site"]')
  await root.evaluate(element => { element.closest('details').open = true })
  const block = root.locator('.sds-code-block')
  await expect(block.locator('header > strong > svg')).toHaveCSS('width', '20px')
  await expect(block.locator('header > strong')).toHaveCSS('font-weight', '400')
  await expect(block.locator('header')).toHaveCSS('height', '53px')
  await expect(block.locator('pre')).toHaveCSS('padding', '16px')
  await expect(block.locator('pre')).toHaveCSS('margin', '16px 0px')
  await expect(block.locator('pre code')).toHaveCSS('font-size', '16px')
  await expect(block.locator('pre code')).toHaveCSS('line-height', '24px')
  for (const action of await block.locator('button').all()) {
    await expect(action).toHaveAttribute('data-sds-shape', 'icon')
    await expect(action).toHaveCSS('color', 'rgb(89, 90, 92)')
    await expect(action.locator('svg').first()).toHaveCSS('width', '16px')
    await expect(action).not.toHaveText(/\S/)
  }
  await page.evaluate(() => {
    window.__copied = ''
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text } } })
  })
  await block.getByRole('button', { name: 'Copy code', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__copied)).toBe("const response = await fetch('/projects');\nconst projects = await response.json();")
  await expect(block.locator('output')).toHaveText('Code copied.')
  for (const [scheme, background, borders, headers] of [
    ['light', 'rgb(255, 255, 255)', ['rgb(188, 190, 192)', 'rgb(116, 203, 238)', 'rgb(249, 161, 164)'], ['rgb(248, 248, 248)', 'rgb(238, 249, 253)', 'rgb(255, 245, 245)']],
    ['dark', 'rgb(0, 0, 0)', ['rgb(48, 49, 50)', 'rgb(4, 54, 115)', 'rgb(96, 0, 0)'], ['rgb(27, 28, 29)', 'rgb(2, 27, 58)', 'rgb(49, 5, 12)']],
  ]) {
    await page.locator('body').evaluate((element, scheme) => { element.dataset.sdsColorScheme = scheme }, scheme)
    for (const [index, tone] of ['neutral', 'info', 'danger'].entries()) {
      await block.evaluate((element, tone) => { element.dataset.sdsTone = tone }, tone)
      await expect(block).toHaveCSS('border-color', borders[index])
      await expect(block).toHaveCSS('background-color', background)
      await expect(block.locator('header')).toHaveCSS('background-color', headers[index])
    }
  }
  await page.setViewportSize({ width: 390, height: 1000 })
  await expect(block).toBeVisible()
  expect(await block.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  await block.getByRole('button', { name: 'Toggle code fullscreen', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'List projects', exact: true })
  await expect(dialog).toBeVisible()
  await expect(block.locator('[data-sds-action="toggle-code-fullscreen"]')).toHaveAttribute('aria-pressed', 'true')
  await expect(block.locator('[data-sds-action="toggle-code-fullscreen"] > svg').first()).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(block.getByRole('button', { name: 'Toggle code fullscreen', exact: true })).toBeFocused()
  await block.locator('header > strong').evaluate(element => element.remove())
  await expect(block.locator('header')).toHaveCSS('position', 'absolute')
  await expect(block.locator('header')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(block.locator('header')).toHaveCSS('border-bottom-width', '0px')
  await expect(block.getByRole('button', { name: 'Toggle code fullscreen', exact: true })).toBeVisible()
})

test('documentation footer has a centered shield divider and right-aligned public links', async ({ page }) => {
  await page.goto('/#layouts')
  const root = page.locator('[data-copy-layout="Documentation site"]')
  await root.evaluate(element => { element.closest('details').open = true })
  const footer = root.locator(':scope > .sds-app-footer')
  const divider = footer.locator('.sds-app-footer-top')
  const wordmark = footer.locator('.sds-sei-wordmark')
  const links = footer.getByRole('navigation', { name: 'Documentation footer' })
  const legal = footer.locator('.sds-app-footer-legal')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(divider).toHaveAttribute('aria-hidden', 'true')
  await expect(divider.locator('svg')).toHaveCSS('width', '24px')
  await expect(wordmark).toHaveCSS('width', '296px')
  await expect(wordmark).toHaveCSS('height', '50px')
  await expect(links).toHaveCSS('font-size', '14px')
  await expect(links.locator('ul')).toHaveCSS('display', 'flex')
  await expect(links.locator('ul')).toHaveCSS('list-style-type', 'none')
  await expect(links.locator('ul')).toHaveCSS('margin-top', '0px')
  await expect(links.locator('ul')).toHaveCSS('margin-bottom', '0px')
  await expect(links.locator('ul')).toHaveCSS('padding-left', '0px')
  const linkRows = await links.getByRole('link').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top))
  expect(Math.max(...linkRows) - Math.min(...linkRows)).toBeLessThanOrEqual(1)
  await expect(links.getByRole('link').first()).toHaveCSS('color', await divider.locator('svg').evaluate(element => getComputedStyle(element).color))
  await expect(legal).toHaveCSS('text-align', 'end')
  expect(await footer.evaluate(element => {
    const footer = element.getBoundingClientRect()
    const shield = element.querySelector('.sds-app-footer-top svg').getBoundingClientRect()
    const links = element.querySelector('.sds-app-footer-middle').getBoundingClientRect()
    const legal = element.querySelector('.sds-app-footer-legal').getBoundingClientRect()
    return Math.abs(shield.x + shield.width / 2 - footer.x - footer.width / 2) <= 1 &&
      Math.abs(links.right - legal.right) <= 1 && legal.top >= links.bottom
  })).toBe(true)
  expect(await divider.evaluate(element => getComputedStyle(element, '::before').height)).toBe('1px')
  expect(await links.locator('li').nth(1).evaluate(element => getComputedStyle(element, '::before').content)).toContain('\u00b7')
  for (const width of [700, 600, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect(legal).toHaveCSS('text-align', 'start')
    await expect(legal.locator('p').last()).toHaveCSS('text-align', width <= 640 ? 'start' : 'end')
    const alignment = await footer.evaluate(element => {
      const brand = element.querySelector('.sds-app-footer-brand').getBoundingClientRect()
      const links = element.querySelector('.sds-app-footer-middle').getBoundingClientRect()
      const legal = element.querySelector('.sds-app-footer-legal').getBoundingClientRect()
      return { brandLeft: brand.left, linksLeft: links.left, legalLeft: legal.left, legalRight: legal.right, contentRight: element.getBoundingClientRect().right - parseFloat(getComputedStyle(element).paddingRight) }
    })
    expect(alignment.linksLeft).toBeCloseTo(alignment.brandLeft, 0)
    expect(alignment.legalLeft).toBeCloseTo(alignment.brandLeft, 0)
    expect(alignment.legalRight).toBeCloseTo(alignment.contentRight, 0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('documentation sidebars use compact text without header or footer separator borders', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#layouts')
  await page.locator('[data-copy-layout]').evaluateAll(layouts => {
    for (const layout of layouts) layout.closest('details').open = true
  })
  for (const sidebar of await page.locator('[data-copy-layout="Documentation site"] .sds-sidebar').all()) {
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toHaveCSS('font-size', '14px')
    await expect(sidebar.locator(':scope > header')).toHaveCSS('border-bottom-width', '0px')
    await expect(sidebar.locator(':scope > footer')).toHaveCSS('border-top-width', '0px')
    const firstLink = sidebar.getByRole('navigation', { name: 'Documentation pages', exact: true }).getByRole('link').first()
    await expect(firstLink).toHaveCSS('font-size', '14px')
    await expect(firstLink).toHaveCSS('min-height', '32px')
    await expect(firstLink).toHaveCSS('padding-top', '6px')
    await expect(firstLink).toHaveCSS('padding-bottom', '6px')
  }
})

for (const width of [1440, 390]) {
  for (const colorScheme of ['light', 'dark']) {
    test(`application sidebar current items use a subtle background at ${width}px in ${colorScheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await page.goto('/#layouts')
      const root = page.locator('[data-copy-layout="Application"]')
      await root.evaluate(element => { element.closest('details').open = true })
      const sidebar = root.locator('.sds-sidebar')
      if (width <= 1024) {
        await sidebar.evaluate(element => element.showPopover())
      }
      await sidebar.locator('nav').evaluate(nav => {
        nav.innerHTML = `<ul>
          <li><a href="#overview">Inactive</a></li>
          <li><details open><summary>Active group</summary><ul>
            <li><a href="#layouts" aria-current="page">Current</a></li>
          </ul></details></li>
        </ul>`
      })
      const current = sidebar.getByRole('link', { name: 'Current', exact: true })
      const group = sidebar.locator('summary')
      const expected = await sidebar.evaluate(element => {
        const reference = document.createElement('span')
        reference.style.backgroundColor = 'var(--sds-color-surface-subtle)'
        element.append(reference)
        const color = getComputedStyle(reference).backgroundColor
        reference.remove()
        return color
      })
      expect(expected).not.toBe(await sidebar.evaluate(element => getComputedStyle(element).backgroundColor))
      for (const variant of ['application', null]) {
        await root.evaluate((element, variant) => {
          if (variant) element.setAttribute('data-sds-variant', variant)
          else element.removeAttribute('data-sds-variant')
        }, variant)
        for (const value of ['page', 'location']) {
          await sidebar.locator('details').evaluate(element => { element.open = true })
          await current.evaluate((element, value) => element.setAttribute('aria-current', value), value)
          await expect(current).toHaveCSS('background-color', expected)
          await expect(current).toHaveCSS('border-left-width', '4px')
          await expect(group).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
          await expect(sidebar.getByRole('link', { name: 'Inactive', exact: true })).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
          await sidebar.locator('details').evaluate(element => { element.open = false })
          await expect(group).toHaveCSS('background-color', expected)
        }
      }
    })
  }
}

test('application sidebars do not inherit documentation tree styling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/#layouts')
  for (const root of await page.locator('[data-copy-layout="Application"], [data-copy-layout="Documentation site"]').all()) {
    await root.evaluate(element => { element.closest('details').open = true })
  }
  const application = page.locator('[data-copy-layout="Application"] .sds-sidebar')
  await application.locator('nav').evaluate(nav => {
    nav.innerHTML = document.querySelector('[data-copy-layout="Documentation site"] .sds-sidebar > nav[aria-label="Documentation pages"]').innerHTML
  })
  const current = application.getByRole('link', { name: 'Introduction', exact: true })
  await expect(application).toHaveCSS('font-size', '16px')
  await expect(application.locator(':scope > header')).toHaveCSS('border-bottom-width', '1px')
  await expect(application.locator(':scope > footer')).toHaveCSS('border-top-width', '1px')
  await expect(current).toHaveCSS('min-height', '40px')
  await expect(current).toHaveCSS('padding-top', '8px')
  await expect(current).toHaveCSS('border-radius', '0px')
  await expect(current).toHaveCSS('border-left-width', '4px')
  await expect(current).toHaveCSS('font-weight', '600')
  await expect(current).toHaveCSS('color', await application.evaluate(element => getComputedStyle(element).color))
  expect(await current.evaluate(element => getComputedStyle(element, '::before').content)).toBe('none')
  for (const list of await application.locator('details > ul').all()) {
    await expect(list).toHaveCSS('border-left-width', '0px')
    await expect(list).toHaveCSS('margin-left', '0px')
  }
})

for (const width of [1440, 390]) {
  for (const scheme of ['light', 'dark']) {
    test(`standalone and application sidebars have identical presentation at ${width}px in ${scheme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      const content = `<header><strong>Project Atlas</strong></header><nav aria-label="Project"><ul>
        <li><a href="#overview">Overview</a></li>
        <li><button type="button">Action</button></li>
        <li><a href="#disabled" aria-disabled="true">Unavailable</a></li>
        <li><details open><summary>Group</summary><ul><li><a href="#team">Team</a></li></ul></details></li>
        <li><details><summary>Current group</summary><ul><li><a href="#current" aria-current="page">Current</a></li></ul></details></li>
        </ul></nav><footer><p>Project navigation</p></footer>`
      await documentationRuntimeFixture(page, `
        <div class="sds-sidebar-layout"><aside id="standalone" class="sds-sidebar">${content}</aside><main>Content</main></div>
        <div class="sds-app" data-sds-variant="application"><div class="sds-app-layout"><aside id="application" class="sds-sidebar" popover="auto">${content}</aside><main>Content</main></div></div>`, scheme)
      const standalone = page.locator('#standalone')
      const application = page.locator('#application')
      if (width <= 1024) await application.evaluate(element => element.showPopover())
      await expect(standalone).toHaveCSS('padding', '0px')
      await expect(application).toHaveCSS('padding', '0px')
      const styles = async sidebar => sidebar.evaluate(element => {
        const properties = ['display', 'box-sizing', 'font-family', 'font-size', 'font-weight', 'line-height', 'color', 'background-color', 'min-height', 'padding', 'margin', 'border-width', 'border-color', 'border-radius', 'gap', 'align-items', 'text-align', 'text-decoration-line', 'opacity']
        return [...element.querySelectorAll('header, nav, footer, nav a, nav button, nav summary, nav ul')].map(item => {
          const style = getComputedStyle(item)
          const marker = getComputedStyle(item, '::after')
          return {
            style: Object.fromEntries(properties.map(property => [property, style.getPropertyValue(property)])),
            marker: { content: marker.content, transform: marker.transform, color: marker.color },
          }
        })
      })
      for (const density of ['default', 'compact']) {
        for (const sidebar of [standalone, application]) {
          await sidebar.evaluate((element, density) => {
            if (density === 'compact') element.dataset.sdsDensity = density
            else element.removeAttribute('data-sds-density')
          }, density)
          await expect(sidebar).toHaveCSS('font-size', density === 'compact' ? '14px' : '16px')
        }
        for (const current of ['page', 'location']) {
          for (const open of [false, true]) {
            for (const sidebar of [standalone, application]) {
              await sidebar.locator('details').last().evaluate((element, { current, open }) => {
                element.open = open
                element.querySelector('a').setAttribute('aria-current', current)
              }, { current, open })
            }
            await expect.poll(() => styles(standalone)).toEqual(await styles(application))
          }
        }
      }
      if (width > 1024) {
        for (const role of ['link', 'button']) {
          const name = role === 'link' ? 'Overview' : 'Action'
          const left = standalone.getByRole(role, { name, exact: true })
          const right = application.getByRole(role, { name, exact: true })
          await left.hover()
          const hovered = await left.evaluate(element => ({ color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }))
          await right.hover()
          expect(await right.evaluate(element => ({ color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }))).toEqual(hovered)
        }
      }
    })
  }
}

test('standalone and application sidebar items share semibold text without changing editorial variants', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const wrapper = document.createElement('div')
    wrapper.className = 'sds-app'
    wrapper.dataset.sdsVariant = 'application'
    wrapper.innerHTML = ['standalone', 'application', 'default', 'documentation', 'simple', 'brochure'].map(variant => `
      <div class="${variant === 'standalone' ? 'sds-sidebar-layout' : 'sds-app'}" id="sidebar-weight-${variant}" ${['standalone', 'default'].includes(variant) ? '' : `data-sds-variant="${variant}"`}>
        ${variant === 'standalone' ? '' : '<div class="sds-app-layout">'}<aside class="sds-sidebar"><nav><ul>
          <li><a href="#">Unselected</a></li><li><a href="#" aria-current="page">Selected</a></li>
          <li><button type="button">Action</button></li>
          <li><details open><summary>Group</summary><ul><li><a href="#">Nested item</a></li></ul></details></li>
          <li><details><summary>Selected group</summary><ul><li><a href="#" aria-current="page">Selected child</a></li></ul></details></li>
        </ul></nav></aside>${variant === 'standalone' ? '' : '</div>'}
      </div>`).join('')
    document.body.append(wrapper)
  })
  for (const scheme of ['light', 'dark']) {
    await page.locator('body').evaluate((element, value) => { element.dataset.sdsColorScheme = value }, scheme)
    for (const variant of ['standalone', 'application', 'default', 'documentation', 'simple', 'brochure']) {
      const sidebar = page.locator(`#sidebar-weight-${variant} .sds-sidebar`)
      const application = ['standalone', 'application', 'default'].includes(variant)
      const color = await sidebar.evaluate((element, isApplication) => {
        const probe = document.createElement('span')
        probe.style.color = isApplication
          ? 'color-mix(in srgb, var(--sds-color-text-muted) 75%, var(--sds-color-text-default))'
          : 'var(--sds-color-text-muted)'
        element.append(probe)
        const result = getComputedStyle(probe).color
        probe.remove()
        return result
      }, application)
      for (const item of await sidebar.locator('a:not([aria-current]), button, summary').all()) {
        await expect(item).toHaveCSS('font-weight', application ? '600' : '400')
        if (await item.evaluate(element => !element.matches('summary:has(+ ul [aria-current])'))) {
          await expect(item).toHaveCSS('color', color)
        }
      }
      for (const item of await sidebar.locator('a[aria-current]').all()) {
        await expect(item).toHaveCSS('font-weight', variant === 'documentation' ? '400' : '600')
      }
    }
  }
})

test('table density changes body rows without resizing headers or footers', async ({ page }) => {
  await page.goto('/#patterns')
  const table = page.locator('[data-copy-example="dashboard"] .sds-table')
  const heading = table.locator('thead th').first()
  const rowHeading = table.locator('tbody th').first()
  const cell = table.locator('tbody td').first()
  const footer = table.locator('tfoot td')
  for (const [size, padding] of [['sm', '4px'], ['md', '8px'], ['lg', '16px']]) {
    await table.evaluate((element, size) => {
      element.setAttribute('data-sds-size', size)
      element.removeAttribute('data-sds-density')
    }, size)
    await expect(heading).toHaveCSS('padding-top', '8px')
    await expect(footer).toHaveCSS('padding-top', '16px')
    await expect(rowHeading).toHaveCSS('padding-top', padding)
    await expect(cell).toHaveCSS('padding-top', padding)
    await expect(rowHeading).toHaveCSS('background-color', await cell.evaluate((element) => getComputedStyle(element).backgroundColor))
    await expect(rowHeading).toHaveCSS('font-weight', '400')
    await table.evaluate((element) => element.setAttribute('data-sds-density', 'compact'))
    await expect(rowHeading).toHaveCSS('padding-top', '4px')
    await expect(cell).toHaveCSS('padding-top', '4px')
    await expect(heading).toHaveCSS('padding-top', '8px')
    await expect(footer).toHaveCSS('padding-top', '16px')
  }
})

test('embedded captioned tables join caption and body borders without an outer outline', async ({ page }) => {
  await page.goto('/#patterns')
  const table = page.locator('[data-copy-example="dashboard"] .sds-table')
  await table.evaluate(element => element.removeAttribute('data-sds-standalone'))
  await expect(table).toHaveCSS('outline-style', 'none')
  await expect(table).toHaveCSS('border-left-width', '1px')
  await expect(table).toHaveCSS('border-right-width', '1px')
  await expect(table).toHaveCSS('border-bottom-width', '1px')
  await expect(table).toHaveCSS('border-top-width', '0px')
  await expect(table).toHaveCSS('border-top-right-radius', '0px')
  await expect(table.locator('caption')).toHaveCSS('border-top-width', '1px')
  await expect(table.locator('caption')).toHaveCSS('border-right-width', '1px')
  await expect(table.locator('caption')).toHaveCSS('border-top-right-radius', '8px')
})

for (const theme of ['forge', 'plaid']) {
  for (const scheme of ['light', 'dark']) {
    test(`standalone table card frame paints continuous edges in ${theme} ${scheme}`, async ({ page }, testInfo) => {
      test.setTimeout(30_000)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/#content')
      await page.locator('[data-sds-root]').first().evaluate((element, values) => {
        element.dataset.sdsTheme = values.theme
        element.dataset.sdsColorScheme = values.scheme
      }, { theme, scheme })
      await page.locator('table').filter({ has: page.locator('caption', { hasText: 'Current projects' }) }).evaluate(element => { element.id = 'table-frame-regression' })
      const table = page.locator('#table-frame-regression')
      const frame = table.locator('..')
      const card = page.locator('[data-copy-example="directory"] .sds-card').first()
      for (const property of ['border', 'border-radius', 'background-color', 'box-shadow']) {
        await expect(frame).toHaveCSS(property, await card.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property))
      }
      await expect(table).toHaveCSS('border-left-width', '0px')
      await expect(table).toHaveCSS('box-shadow', 'none')
      await expect(table).toHaveCSS('filter', 'none')
      await expect(table.locator('caption')).toHaveCSS('border-top-width', '0px')
      await expect(table.locator('caption')).toHaveCSS('border-bottom-width', '1px')
      for (const width of [1440, 1266, 700, 390, 320]) {
        await page.setViewportSize({ width, height: 900 })
        const screenshot = await frame.screenshot({ animations: 'disabled', scale: 'css', path: testInfo.outputPath(`table-${width}.png`) })
        const edges = await frame.evaluate(async (element, encoded) => {
          const image = new Image()
          image.src = `data:image/png;base64,${encoded}`
          await image.decode()
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          const context = canvas.getContext('2d')
          context.drawImage(image, 0, 0)
          const bounds = element.getBoundingClientRect()
          const heading = element.querySelector('thead').getBoundingClientRect()
          const expected = getComputedStyle(element).borderLeftColor.match(/\d+/g).slice(0, 3).map(Number)
          const top = Math.ceil(heading.top - bounds.top) + 1
          const bottom = Math.floor(heading.bottom - bounds.top) - 1
          return [0, image.width - 1].map(horizontal => {
            const missing = []
            for (let vertical = top; vertical < bottom; vertical += 1) {
              const actual = [...context.getImageData(horizontal, vertical, 1, 1).data].slice(0, 3)
              if (actual.some((channel, index) => Math.abs(channel - expected[index]) > 2)) missing.push({ vertical, actual })
            }
            return { horizontal, missing, expected }
          })
        }, screenshot.toString('base64'))
        for (const edge of edges) expect(edge.missing, JSON.stringify({ width, ...edge })).toEqual([])
        const bounds = await frame.evaluate(element => ({ width: element.getBoundingClientRect().width, viewport: innerWidth }))
        expect(bounds.width).toBeLessThanOrEqual(bounds.viewport)
      }
      await table.locator('caption').evaluate(element => { element.textContent = 'Current projects and their research and operational review status across the organization' })
      await frame.screenshot({ animations: 'disabled', path: testInfo.outputPath('wrapped-caption.png') })
      await table.evaluate(element => { element.style.minWidth = '720px' })
      await frame.evaluate(element => { element.scrollLeft = element.scrollWidth })
      await expect(frame).toHaveCSS('border-left-width', '1px')
      await frame.screenshot({ animations: 'disabled', path: testInfo.outputPath('scrolled-table.png') })
      await table.locator('caption').evaluate(element => element.remove())
      await expect(frame).toHaveCSS('border-radius', theme === 'plaid' ? '0px' : '8px')
      await frame.screenshot({ animations: 'disabled', path: testInfo.outputPath('without-caption.png') })
    })
  }
}

test('application and simple application page headings use matching compact sentence-case styles', async ({ page }) => {
  await page.goto('/#layouts')
  await page.getByText('Application shell preview', { exact: true }).click()
  await page.getByText('Simple application shell preview', { exact: true }).click()
  const application = page.locator('[data-copy-layout="Application"] .sds-page-header').getByRole('heading')
  const simple = page.locator('[data-copy-layout="Simple application"] .sds-page-header').getByRole('heading')
  await expect(application).toHaveText('Project overview')
  await expect(simple).toHaveText('Project settings')
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    for (const title of [application, simple]) {
      await expect(title).toHaveCSS('text-transform', 'none')
      await expect(title).toHaveCSS('font-size', '20px')
      await expect(title).toHaveCSS('line-height', '26px')
    }
    const styles = element => {
      const computed = getComputedStyle(element)
      return Object.fromEntries(['font-family', 'font-size', 'font-weight', 'line-height', 'text-transform', 'color', 'margin-top', 'margin-bottom'].map(property => [property, computed.getPropertyValue(property)]))
    }
    expect(await application.evaluate(styles)).toEqual(await simple.evaluate(styles))
  }
})

test('brochure navigation underlines stay inside the header', async ({ page }) => {
  await page.goto('/#layouts')
  await page.getByText('Brochure site shell preview', { exact: true }).click()
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    if (width === 390) {
      await expect(page.getByRole('navigation', { name: 'Brochure preview', exact: true })).not.toBeVisible()
      await expect(page.getByRole('button', { name: 'Open brochure navigation', exact: true })).toBeVisible()
      continue
    }
    const bounds = await page.locator('[data-copy-layout="Brochure"] > .sds-app-header').evaluate((header) => ({
      bottom: header.getBoundingClientRect().bottom,
      links: [...header.querySelectorAll('nav a')].map((link) => ({
        bottom: link.getBoundingClientRect().bottom,
        rowBottom: link.closest('li').getBoundingClientRect().bottom,
      })),
    }))
    expect(bounds.links.length).toBe(2)
    for (const link of bounds.links) {
      expect(link.bottom).toBeLessThanOrEqual(bounds.bottom)
      expect(link.bottom).toBeLessThanOrEqual(link.rowBottom)
    }
  }
})

test('article pattern eyebrows sit directly above their title', async ({ page }) => {
  await page.goto('/#patterns')
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    const gap = await page.locator('[data-copy-example="article"] header').evaluate((header) =>
      header.querySelector('h3').getBoundingClientRect().top - header.querySelector('.sds-eyebrow').getBoundingClientRect().bottom,
    )
    expect(gap).toBeGreaterThanOrEqual(0)
    expect(gap).toBeLessThanOrEqual(12)
  }
})

test('dashboard tables finish with a native pagination footer', async ({ page }) => {
  await page.goto('/#patterns')
  const table = page.locator('[data-copy-example="dashboard"] .sds-table')
  const footer = table.locator('tfoot td')
  await expect(footer).toHaveAttribute('colspan', '5')
  await expect(footer).toHaveCSS('border-top-width', '1px')
  await expect(table.locator('tbody tr:last-child th')).toHaveCSS('border-bottom-width', '0px')
  const pagination = footer.getByRole('navigation', { name: 'Recent project pages' })
  await expect(pagination.locator('ul > li > a')).toHaveCount(5)
  await expect(pagination.locator('svg')).toHaveCount(2)
  await expect(pagination.locator('.sds-button')).toHaveCount(0)
  await expect(pagination.getByRole('link', { name: 'Page 1', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(footer.locator('.sds-pagination-status')).toHaveText('Showing 1-10 of 24 projects')
  await expect(table.locator('tbody tr')).toHaveCount(10)
  await expect(footer.getByRole('combobox', { name: 'Rows per page' })).toHaveValue('10')
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    const bounds = await table.evaluate((element) => ({
      table: element.getBoundingClientRect().toJSON(),
      footer: element.querySelector('tfoot').getBoundingClientRect().toJSON(),
      navigation: element.querySelector('tfoot nav').getBoundingClientRect().toJSON(),
      layout: element.querySelector('.sds-table-footer').getBoundingClientRect().toJSON(),
      select: element.querySelector('tfoot select').getBoundingClientRect().toJSON(),
      apply: element.querySelector('tfoot button').getBoundingClientRect().toJSON(),
    }))
    expect(bounds.footer.bottom).toBeLessThanOrEqual(bounds.table.bottom)
    expect(bounds.navigation.right).toBeLessThanOrEqual(bounds.table.right)
    expect(Math.abs((bounds.select.top + bounds.select.bottom) / 2 - (bounds.apply.top + bounds.apply.bottom) / 2)).toBeLessThanOrEqual(1)
    expect(bounds.select.right).toBeLessThan(bounds.apply.left)
    if (width === 1440) {
      expect(Math.abs((bounds.navigation.left + bounds.navigation.right) / 2 - (bounds.layout.left + bounds.layout.right) / 2)).toBeLessThanOrEqual(1)
    }
  }
  await footer.getByRole('combobox', { name: 'Rows per page' }).selectOption('25')
  expect(await footer.locator('form').evaluate((form) => ({
    method: form.method,
    page: new FormData(form).get('page'),
    pageSize: new FormData(form).get('pageSize'),
  }))).toEqual({ method: 'get', page: '1', pageSize: '25' })
})

test('patterns use bounded SDS recipes and keep copying outside the previews', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#patterns')
  const directory = page.locator('[data-copy-example="directory"]')
  const search = directory.getByRole('search', { name: 'Project search' })
  await expect(search).toHaveClass('sds-form')
  const bounds = await search.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    previewWidth: element.closest('[data-copy-example]').getBoundingClientRect().width,
  }))
  expect(bounds.width).toBeLessThan(bounds.previewWidth)
  expect(bounds.width).toBeLessThanOrEqual(640)
  for (const pattern of await page.locator('#patterns > [data-pattern]').all()) {
    const preview = pattern.locator('[data-copy-example]')
    await expect(preview.locator('[data-copy-target], [data-example-tools], [data-example-source]')).toHaveCount(0)
    const tools = pattern.locator('[data-example-tools]')
    await expect(tools.locator('[data-copy-target]')).toHaveAttribute('data-sds-density', 'compact')
    await expect(tools.locator('[data-copy-target]')).toHaveAttribute('data-sds-variant', 'outlined')
    expect(await pattern.evaluate((element) => {
      const tools = element.querySelector('[data-example-tools]')
      const source = element.querySelector('[data-example-source]')
      const preview = element.querySelector('[data-copy-example]')
      return Boolean(tools.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(preview.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING)
    })).toBe(true)
  }
  for (const badge of await directory.locator('.sds-card .sds-badge').all()) {
    expect(await badge.evaluate((element) => element.getBoundingClientRect().width < element.closest('.sds-card').getBoundingClientRect().width / 2)).toBe(true)
  }
  await expect(page.locator('[data-copy-example="settings"]')).toHaveClass('sds-form sds-card')
  await expect(directory.locator('.sds-card h4').first()).toHaveCSS('text-transform', 'none')
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await search.evaluate((element) => element.getBoundingClientRect().right <= element.closest('[data-copy-example]').getBoundingClientRect().right)).toBe(true)
})

test('page pattern actions are compact and directory search uses the combobox recipe', async ({ page }) => {
  await page.goto('/#patterns')
  const createActions = page.locator('#patterns').getByRole('link', { name: 'Create project', exact: true })
  await expect(createActions).toHaveCount(2)
  for (const action of await createActions.all()) {
    await expect(action).toHaveAttribute('data-sds-density', 'compact')
  }
  const search = page.getByRole('search', { name: 'Project search' })
  const input = search.getByRole('combobox', { name: 'Search projects' })
  await expect(input).toBeVisible()
  await expect(search.locator('sds-combobox')).toHaveAttribute('filter', 'automatic')
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    const geometry = await search.evaluate((form) => {
      const input = form.querySelector('input').getBoundingClientRect()
      return {
        inputRight: input.right,
        right: form.getBoundingClientRect().right,
        width: form.clientWidth,
        scrollWidth: form.scrollWidth,
      }
    })
    expect(geometry.inputRight).toBeLessThanOrEqual(geometry.right)
    expect(geometry.scrollWidth).toBe(geometry.width)
  }
  await input.fill('Ori')
  await expect(search.getByRole('option', { name: 'Orion', exact: true })).toBeVisible()
  await expect(search.getByRole('option', { name: 'Atlas', exact: true })).not.toBeVisible()
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(input).toHaveValue('Orion')
  await expect(input).toHaveAttribute('aria-expanded', 'false')
  const pagination = page.getByRole('navigation', { name: 'Directory pages' })
  await expect(pagination.locator(':scope > ul > li > a')).toHaveCount(6)
  await expect(pagination.locator('svg')).toHaveCount(2)
  await expect(pagination.locator('.sds-button')).toHaveCount(0)
  await expect(pagination.getByRole('link', { name: 'Page 1', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(pagination.locator('[aria-disabled="true"]')).toHaveAccessibleName('Previous page')
  await expect(pagination.locator('.sds-pagination-status')).toHaveText('Showing 1-2 of 16 projects')
  const canonical = page.getByRole('navigation', { name: 'Project pages', exact: true })
  const iconGeometry = (icons) => icons.map((icon) => ({
    viewBox: icon.getAttribute('viewBox'),
    path: icon.querySelector('path').getAttribute('d'),
  }))
  expect(await pagination.locator('svg').evaluateAll(iconGeometry)).toEqual(
    await canonical.locator('svg').evaluateAll(iconGeometry),
  )
  for (const selector of ['[aria-current="page"]', '[aria-disabled="true"]']) {
    const styles = (element) => {
      const style = getComputedStyle(element)
      return [style.backgroundColor, style.borderColor, style.borderRadius, style.color, style.height, style.minWidth]
    }
    expect(await pagination.locator(selector).evaluate(styles)).toEqual(await canonical.locator(selector).evaluate(styles))
  }
})

test('sidebar marks the section currently visible in the viewport', async ({
  page,
}) => {
  await page.goto('/')

  const currentLink = page.locator(
    'nav[aria-label="Playground sections"] a[aria-current="location"]',
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
  await page.locator('.sds-datapoint[data-sds-size="xl"]').first().evaluate(element => {
    element.style.inlineSize = '600px'
  })

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
    tableLgHeadPadding: '8px',
    tableSmBodyPadding: '4px',
    tableSmHeadPadding: '8px',
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

test('card insets stay fixed while toaster edge spacing scales fluidly', async ({
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
  expect(await spacingAt(800)).toEqual({ card: '24px', toaster: '20px' })
  expect(await spacingAt(1440)).toEqual({ card: '24px', toaster: '24px' })
})

test('datapoints keep long monetary values inside narrow tiles', async ({ page }) => {
  await page.goto('/')
  const datapoint = page.locator('.sds-datapoint').first()
  await datapoint.evaluate(element => {
    element.style.inlineSize = '160px'
    element.style.boxSizing = 'content-box'
    element.querySelector('strong').textContent = '$123,456.78'
  })
  for (const size of ['sm', 'md', 'lg', 'xl']) {
    await datapoint.evaluate((element, size) => { element.dataset.sdsSize = size }, size)
    await expect.poll(() => datapoint.evaluate(element => {
      const value = element.querySelector('strong')
      return value.scrollWidth <= value.clientWidth && element.scrollWidth <= element.clientWidth
    })).toBe(true)
  }
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
    '#callout-variants > [data-example-preview] > .sds-grid > section',
  )
  await expect(calloutToneGroups).toHaveCount(6)
  for (const group of await calloutToneGroups.all()) {
    await expect(group.locator('.sds-callout')).toHaveCount(3)
  }
  const calloutGrid = page.locator('#callout-variants > [data-example-preview] > .sds-grid')
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
  ).toHaveCSS('padding-top', '24px')

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

test('section anchors remain visible below the application navigation', async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/#navigation')

    const headerBottom = await page.locator('body > .sds-app > .sds-app-header')
      .evaluate(element => element.getBoundingClientRect().bottom)
    const heading = await page.locator('#navigation-title').boundingBox()

    expect(heading).not.toBeNull()
    expect(heading.y).toBeGreaterThanOrEqual(headerBottom)
  }
})

test('mobile application navigation stays pinned while page titles scroll away at every viewport', async ({ page }) => {
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const shellHeader = page.locator('body > .sds-app > .sds-app-header')
    const menu = shellHeader.getByRole('button', { name: 'Open navigation', exact: true })
    const pageHeader = page.locator('main#top > .sds-page-header')
    await page.evaluate(() => window.scrollTo(0, 1000))
    await expect.poll(() => pageHeader.evaluate(element => element.getBoundingClientRect().bottom))
      .toBeLessThan(0)
    if (width > 1024) {
      await expect(shellHeader).toBeHidden()
      continue
    }
    await expect.poll(() => shellHeader.evaluate(element => element.getBoundingClientRect().top))
      .toBeCloseTo(0, 1)
    await expect(menu).toBeInViewport()
    await menu.focus()
    await menu.press('Enter')
    const sidebar = page.locator('#catalog-sidebar')
    await expect(sidebar).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sidebar).toBeHidden()
    await expect(menu).toBeFocused()
    await expect(menu).toBeInViewport()
  }
})

test('section anchors scroll the page without moving the desktop sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const sidebar = page.locator('#catalog-sidebar')
  await expect(sidebar).toBeVisible()
  expect((await sidebar.boundingBox())?.y).toBe(0)

  await page.getByRole('link', { name: 'Loading', exact: true }).click()

  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  expect((await sidebar.boundingBox())?.y).toBe(0)
})
