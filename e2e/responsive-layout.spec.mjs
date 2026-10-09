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
        expect(await shell.locator('.sds-sidebar').evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(headerBottom, 0)
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
          expect(await shell.locator('.sds-sidebar').evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(headerBottom, 0)
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
          const body = document.createElement('div')
          body.className = 'sds-app-body'
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
    const restingShadow = await card.evaluate(element => getComputedStyle(element).boxShadow)
    await card.hover({ position: { x: 12, y: 12 } })
    await expect(card).not.toHaveCSS('box-shadow', restingShadow)
    expect(await card.evaluate(element => {
      const rect = element.getBoundingClientRect()
      return document.elementFromPoint(rect.left + 12, rect.top + 12) === element.querySelector('.sds-card-link')
    })).toBe(true)
    await card.getByRole('button', { name: 'Archive project' }).click()
    await expect(card).toHaveAttribute('data-archive-clicks', '1')
    await card.getByRole('link', { name: 'Project activity', exact: true }).click()
    await expect(card).toHaveAttribute('data-activity-clicks', '1')
    await card.getByText('Notify owner', { exact: true }).click()
    await expect(card.getByRole('checkbox', { name: 'Notify owner' })).toBeChecked()
    await page.keyboard.press('Tab')
    await primary.focus()
    await expect(primary).toBeFocused()
    await expect(card).toHaveCSS('outline-style', 'solid')
    await expect(card).toHaveCSS('outline-width', '2px')
    await expect(primary).toHaveCSS('box-shadow', 'none')
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
          expect(inset).toBeCloseTo(8, 0)
          await link.evaluate(element => { element.setAttribute('aria-current', 'location') })
          const marker = await link.evaluate(element => {
            const style = getComputedStyle(element, '::before')
            return { width: style.width, left: element.getBoundingClientRect().left + parseFloat(style.left), guideLeft: element.closest('ul').getBoundingClientRect().left }
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

test('persistent sidebar example keeps content inset from its navigation', async ({ page }) => {
  await page.goto('/#composition')
  const layout = page.getByRole('heading', { name: 'Persistent sidebar', exact: true }).locator('..').locator('.sds-sidebar-layout')
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
  const groups = sidebar.locator('details')
  const parent = groups.first()
  const child = groups.nth(1)
  const summary = child.locator(':scope > summary')
  const installation = child.getByRole('link', { name: 'Installation' })
  const current = sidebar.getByRole('link', { name: 'Introduction', exact: true })
  await expect(parent.locator(':scope > ul')).toHaveCSS('border-left-width', '2px')
  await expect(child.locator(':scope > ul')).toHaveCSS('border-left-width', '0px')
  for (const list of await sidebar.locator('details > ul').all()) {
    await expect(list).toHaveCSS('margin-left', '16px')
  }
  await expect(sidebar.locator(':scope > .sds-app-navigation')).not.toBeVisible()
  const headingGap = await sidebar.evaluate(element => {
    const heading = element.querySelector('header strong').getBoundingClientRect()
    const firstRow = element.querySelector('nav[aria-label="Documentation pages"] > ul > li > details > summary').getBoundingClientRect()
    return firstRow.top - heading.bottom
  })
  expect(headingGap).toBeCloseTo(4, 0)
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
    await expect(current).toHaveCSS('border-bottom-width', '2px')
    await expect(current).toHaveCSS('border-bottom-color', await current.evaluate(element => getComputedStyle(element).color))
    await expect(current).toHaveCSS('font-size', '14px')
    await expect(current).toHaveCSS('padding-top', '16px')
    await expect(inactive).toHaveCSS('border-bottom-color', 'rgba(0, 0, 0, 0)')
    await expect(brand).toHaveText('Documentation Site')
    await expect(brand).toHaveCSS('font-size', width > 1024 ? '18px' : '16px')
    await expect(brand).toHaveCSS('font-weight', '600')
    await expect(brand.locator('svg')).toHaveCSS('width', '16px')
    await expect(brand.locator('svg')).toHaveAttribute('aria-hidden', 'true')
    for (const action of await root.locator('.sds-app-masthead .sds-button').all()) {
      await expect(action).toHaveCSS('font-size', '20px')
      await expect(action.locator('svg')).toHaveCSS('width', '20px')
      await expect(action).toHaveAttribute('data-sds-size', 'sm')
      await expect(action).toHaveAttribute('data-sds-density', 'compact')
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
    await expect(firstLink).toHaveCSS('padding-top', '4px')
    await expect(firstLink).toHaveCSS('padding-bottom', '4px')
  }
})

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
      return Boolean(tools.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING) &&
        Boolean(source.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING)
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
