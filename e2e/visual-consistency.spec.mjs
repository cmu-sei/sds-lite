import { expect, test } from '@playwright/test'

async function styledContent(page, markup) {
  await page.setContent(`<main data-sds-root>${markup}</main>`)
  await page.addStyleTag({ path: 'dist/sds.css' })
}

for (const theme of ['forge', 'plaid']) {
  test(`shipped overlay titles share the compact title role (${theme})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.locator('[data-sds-root], [data-sds-theme]').evaluateAll((roots, theme) => {
      for (const root of roots) root.dataset.sdsTheme = theme
    }, theme)

    const titles = page.locator('dialog[aria-labelledby]').locator('.sds-text-title')
    expect(await titles.count()).toBe(12)
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const title of await titles.all()) {
        await expect(title).toHaveCSS('font-size', '20px')
        await expect(title).toHaveCSS('line-height', '28px')
        await expect(title).toHaveCSS('font-weight', theme === 'forge' ? '500' : '400')
        await expect(title).toHaveCSS('font-family', theme === 'forge' ? /Open Sans/ : /Source Serif/)
        await expect(title).toHaveCSS('text-transform', 'none')
        await expect(title).toHaveCSS('margin', '0px')
      }
      const popoverTitles = page.locator('.sds-popover-content .sds-text-title')
      await expect(popoverTitles).toHaveCount(3)
      for (const title of await popoverTitles.all()) {
        await expect(title).toHaveCSS('font-size', '20px')
        await expect(title).toHaveCSS('font-weight', theme === 'forge' ? '500' : '400')
      }
    }
    await expect(page.locator('#task-details-title')).toHaveJSProperty('tagName', 'H3')
    await expect(page.locator('#dialog-title')).toHaveJSProperty('tagName', 'H2')
  })

  for (const scheme of ['light', 'dark']) {
    test(`floating surfaces share theme-aware corners and elevation (${theme} ${scheme})`, async ({ page }) => {
      await styledContent(page, `
        <div class="sds-card" id="card">Card</div>
        <menu class="sds-dropdown-menu" id="menu"><li>Action</li></menu>
        <section class="sds-popover-content" id="popover">Details</section>
        <sds-combobox><input class="sds-input"><ul class="sds-combobox-list" id="combo"><li>Choice</li></ul><output id="output">No choices</output></sds-combobox>
        <sds-toast id="toast" open><strong>Saved</strong></sds-toast>
        <span class="sds-tooltip-content" id="tooltip">Help</span>
        <dialog class="sds-dialog" id="dialog"></dialog>
        <dialog class="sds-panel" id="panel"></dialog>
      `)
      await page.locator('main').evaluate((root, { theme, scheme }) => {
        root.dataset.sdsTheme = theme
        root.dataset.sdsColorScheme = scheme
      }, { theme, scheme })
      const surfaces = ['#menu', '#popover', '#combo', '#output', '#toast']
      const shadow = await page.locator('#menu').evaluate(element => getComputedStyle(element).boxShadow)
      expect(shadow).not.toBe('none')
      const border = await page.locator('#card').evaluate(element => getComputedStyle(element).borderColor)
      for (const selector of surfaces) {
        await expect(page.locator(selector)).toHaveCSS('border-radius', theme === 'forge' ? '8px' : '0px')
        await expect(page.locator(selector)).toHaveCSS('box-shadow', shadow)
        await expect(page.locator(selector)).toHaveCSS('border-color', border)
      }
      await expect(page.locator('#tooltip')).toHaveCSS('border-radius', theme === 'forge' ? '4px' : '0px')
      const modalShadow = await page.locator('#dialog').evaluate(element => getComputedStyle(element).boxShadow)
      await expect(page.locator('#panel')).toHaveCSS('box-shadow', modalShadow)
      expect(modalShadow).not.toBe(shadow)
      const raisedShadow = await page.locator('#card').evaluate(element => getComputedStyle(element).boxShadow)
      await expect(page.locator('#tooltip')).toHaveCSS('box-shadow', raisedShadow)
      expect(raisedShadow).not.toBe(shadow)

      await page.locator('main').evaluate(root => {
        root.style.setProperty('--sds-radius-floating', '3px')
        root.style.setProperty('--sds-shadow-floating', '0 2px 4px rgb(0 0 0 / 20%)')
      })
      for (const selector of surfaces) {
        await expect(page.locator(selector)).toHaveCSS('border-radius', '3px')
        await expect(page.locator(selector)).toHaveCSS('box-shadow', 'rgba(0, 0, 0, 0.2) 0px 2px 4px 0px')
      }
    })
  }
}

for (const size of ['sm', 'md', 'lg']) {
  test(`comfortable single-line controls align at ${size} and grow with root text size`, async ({ page }) => {
    await styledContent(page, `
      <section class="sds-stack">
        <button class="sds-button" data-metric>Save</button>
        <button class="sds-button" data-sds-variant="outlined" data-metric>Cancel</button>
        <a class="sds-button" href="#next" data-metric>Next</a>
        ${['text', 'search', 'number', 'date', 'time', 'month', 'week', 'datetime-local'].map(type => `<input class="sds-input" type="${type}" aria-label="${type}" data-metric>`).join('')}
        <select class="sds-select" aria-label="Choice" data-metric><option>Choice</option></select>
        <div class="sds-input-group" data-metric-group><span class="sds-input-addon">$</span><input class="sds-input" aria-label="Amount"></div>
        <div class="sds-input-group" data-metric-group><span class="sds-input-addon">Choice</span><select class="sds-select" aria-label="Group choice"><option>Choice</option></select></div>
        <div class="sds-input-group" data-metric data-wrapper><input class="sds-input" aria-label="Query"><button class="sds-button" type="button">Go</button></div>
        ${['date', 'time', 'month', 'week', 'datetime-local'].map(type => `<div class="sds-input-group" data-metric data-native-wrapper><input class="sds-input" type="${type}" aria-label="Wrapped ${type}"><button class="sds-button" type="button">Go</button></div>`).join('')}
        <textarea class="sds-input" aria-label="Notes" rows="4"></textarea>
      </section>
    `)
    await page.locator('[data-metric], [data-metric-group], textarea').evaluateAll((elements, size) => {
      for (const element of elements) element.dataset.sdsSize = size
    }, size)
    // Group size, rather than a repeated child attribute, must size its controls.
    await page.locator('.sds-input-group > :is(input, select)').evaluateAll(elements => {
      for (const element of elements) element.removeAttribute('data-sds-size')
    })
    for (const rootSize of [16, 20]) {
      await page.locator('html').evaluate((element, size) => element.style.fontSize = `${size}px`, rootSize)
      const expected = { sm: 2, md: 2.5, lg: 3 }[size] * rootSize
      const heights = await page.locator('[data-metric], [data-metric-group]').evaluateAll(elements =>
        elements.map(element => ({ tag: element.tagName, type: element.getAttribute('type') ?? element.querySelector('input')?.getAttribute('type'), height: element.getBoundingClientRect().height })),
      )
      for (const result of heights) expect(result.height, `${result.tag} ${result.type ?? ''}`).toBeCloseTo(expected, 1)
      await expect(page.locator('textarea')).toHaveCSS('line-height', `${{ sm: 1.25, md: 1.5, lg: 1.75 }[size] * rootSize}px`)
      expect((await page.locator('textarea').boundingBox()).height).toBeGreaterThan(expected)
    }
    for (const wrapper of await page.locator('[data-wrapper], [data-native-wrapper]').all()) {
      await wrapper.evaluate(element => {
        element.dataset.sdsSize = 'sm'
        element.querySelector('input').dataset.sdsSize = 'lg'
      })
      expect((await wrapper.boundingBox()).height).toBeCloseTo(40, 1)
      await expect(wrapper.locator('input')).toHaveCSS('font-size', '17.5px')
      await wrapper.evaluate(element => element.removeAttribute('data-sds-size'))
      expect((await wrapper.boundingBox()).height).toBeCloseTo(60, 1)
    }
  })
}

test('overlay spacing is owned by layout gaps instead of native paragraph margins', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const dialog = page.locator('#catalog-dialog')
    await dialog.evaluate(element => element.showModal())
    const description = dialog.locator('#dialog-description')
    await expect(description).toHaveCSS('margin-top', '8px')
    await expect(description).toHaveCSS('margin-bottom', '0px')
    await expect(description).toHaveCSS('font-size', '14px')
    await expect(description).toHaveCSS('line-height', '20px')
    await expect.poll(() => dialog.evaluate(element => {
      const header = element.querySelector('.sds-dialog-header').getBoundingClientRect()
      const content = element.querySelector('.sds-callout').getBoundingClientRect()
      return content.top - header.bottom
    })).toBeCloseTo(24, 1)
    await dialog.evaluate(element => element.close())
  }
  await expect(page.locator('#dialog-sm > p')).toHaveCSS('margin', '0px')
  await expect(page.locator('#panel-right-md > section > p')).toHaveCSS('margin', '0px')
})

test('surface insets stay stable across viewports and accept tokens and spacing overrides', async ({ page }) => {
  await styledContent(page, `
    <div class="sds-card" id="card">Card</div>
    <div class="sds-card" data-sds-padding="lg" id="compact">Compact card</div>
    <dialog class="sds-dialog" id="dialog"></dialog>
    <dialog class="sds-panel"><header id="header">Panel</header><section id="body">Content</section><footer id="footer">Actions</footer></dialog>
  `)
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const selector of ['#card', '#dialog', '#header', '#footer']) {
      await expect(page.locator(selector)).toHaveCSS('padding', '24px')
    }
    await expect(page.locator('#body')).toHaveCSS('padding-inline', '24px')
    await expect(page.locator('#compact')).toHaveCSS('padding', '16px')
  }
  await page.locator('main').evaluate(root => root.style.setProperty('--sds-surface-inset', '2rem'))
  for (const selector of ['#card', '#dialog', '#header', '#footer']) {
    await expect(page.locator(selector)).toHaveCSS('padding', '32px')
  }
  await expect(page.locator('#compact')).toHaveCSS('padding', '16px')
})

test('supporting UI text is normal while editorial captions retain italics', async ({ page }) => {
  await styledContent(page, `
    <div class="sds-field"><label for="field">Name <small>Optional</small></label><input id="field" class="sds-input" placeholder="Name"><small>Help text</small></div>
    <div class="sds-input-group"><input class="sds-input" placeholder="Search" aria-label="Search"></div>
    <p class="sds-text-caption1">Editorial caption</p><small class="sds-text-caption2">Supporting caption</small>
  `)
  const placeholders = await page.locator('input').evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element, '::placeholder')
    return { fontStyle: style.fontStyle, color: style.color }
  }))
  expect(placeholders[0]).toEqual(placeholders[1])
  expect(placeholders[0].fontStyle).toBe('normal')
  for (const help of await page.locator('.sds-field small').all()) await expect(help).toHaveCSS('font-style', 'normal')
  for (const caption of await page.locator('.sds-text-caption1, .sds-text-caption2').all()) await expect(caption).toHaveCSS('font-style', 'italic')
})

test('shared typography metrics preserve prose flow and explicit utility overrides', async ({ page }) => {
  await styledContent(page, `
    <article class="sds-prose"><p>Introduction.</p><h2 id="prose">Article heading</h2></article>
    <h2 class="sds-text-h2" data-sds-size="lg" id="utility">Explicit heading</h2>
    <h3 class="sds-text-title" id="title">UI title</h3>
    <div class="sds-dialog-header"><h4 id="fallback">Fallback title</h4></div>
  `)
  await page.locator('main').evaluate(root => {
    root.style.setProperty('--sds-type-h2-size', '2rem')
    root.style.setProperty('--sds-type-h2-leading', '2.5rem')
    root.style.setProperty('--sds-type-title-size', '1.125rem')
    root.style.setProperty('--sds-type-title-leading', '1.5rem')
  })
  for (const selector of ['#prose', '#utility']) {
    await expect(page.locator(selector)).toHaveCSS('font-size', '32px')
    await expect(page.locator(selector)).toHaveCSS('line-height', '40px')
  }
  await expect(page.locator('#prose')).toHaveCSS('margin-top', '48px')
  await expect(page.locator('#utility')).toHaveCSS('margin', '0px')
  for (const selector of ['#title', '#fallback']) {
    await expect(page.locator(selector)).toHaveCSS('font-size', '18px')
    await expect(page.locator(selector)).toHaveCSS('line-height', '24px')
    await expect(page.locator(selector)).toHaveCSS('text-transform', 'none')
  }
})

test('layout gaps share mappings without leaking into nested layouts or host markup', async ({ page }) => {
  await styledContent(page, `
    <div class="sds-stack" data-sds-gap="4xl"><div class="sds-stack" id="nested">Nested</div></div>
    <div class="sds-stack" id="stack">Stack</div>
    <div class="sds-cluster" id="cluster">Cluster</div>
    <div class="sds-grid" data-sds-columns="2" id="grid"><span>One</span><span>Two</span></div>
    <div data-sds-gap="4xl" id="host">Host</div>
  `)
  const values = { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 }
  for (const [value, expected] of Object.entries(values)) {
    for (const selector of ['#stack', '#cluster', '#grid']) {
      await page.locator(selector).evaluate((element, value) => element.dataset.sdsGap = value, value)
      await expect(page.locator(selector)).toHaveCSS('gap', `${expected}px`)
    }
  }
  await expect(page.locator('#nested')).toHaveCSS('gap', '16px')
  await expect(page.locator('#host')).toHaveCSS('gap', 'normal')
})
