import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

for (const order of ['sds-first', 'host-first']) {
  test(`shared Tailwind layer order preserves recipes and utilities (${order})`, async ({ page }) => {
    const stylesheet = await readFile('dist/sds.css', 'utf8')
    const hostStyles = `
      @layer theme, base, components, utilities;
      @layer base {
        *, ::before, ::after { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; }
        button, input { font: inherit; color: inherit; border-radius: 0; background-color: transparent; }
      }
      @layer utilities { .p-2 { padding: 0.5rem; } }
    `
    await page.setContent(`
      <main data-sds-root>
        <button class="sds-button p-2">Action</button>
        <input class="sds-input"><input class="sds-input" disabled>
        <button id="host-button">Host action</button>
      </main>
    `)
    await page.addStyleTag({ content: '@layer theme, base, sds, components, utilities;' })
    for (const content of order === 'sds-first' ? [stylesheet, hostStyles] : [hostStyles, stylesheet]) {
      await page.addStyleTag({ content })
    }
    await expect(page.locator('.sds-button')).toHaveCSS('padding', '8px')
    await expect(page.locator('.sds-button')).toHaveCSS('border-radius', '4px')
    await expect(page.locator('.sds-input').first()).toHaveCSS('padding', '8px 12px')
    await expect(page.locator('.sds-input').first()).toHaveCSS('border-top-width', '1px')
    await expect(page.locator('[disabled]')).toHaveCSS('background-color', 'rgb(225, 226, 227)')
    await expect(page.locator('#host-button')).toHaveCSS('padding', '0px')
    await page.locator('.sds-button').focus()
    await expect(page.locator('.sds-button')).toHaveCSS('box-shadow', 'rgb(46, 177, 230) 0px 0px 0px 2px')
  })

  test(`layered Bootstrap reset leaves SDS rounding intact (${order})`, async ({ page }) => {
    const stylesheet = await readFile('dist/sds.css', 'utf8')
    const hostStyles = '@layer vendor { button { border-radius: 0; } button, input { margin: 0; font-family: inherit; font-size: inherit; line-height: inherit; } }'
    await page.setContent('<main data-sds-root><button class="sds-button">SDS action</button><button id="host-button">Host action</button></main>')
    await page.addStyleTag({ content: '@layer vendor, sds, app;' })
    for (const content of order === 'sds-first' ? [stylesheet, hostStyles] : [hostStyles, stylesheet]) {
      await page.addStyleTag({ content })
    }
    await expect(page.locator('.sds-button')).toHaveCSS('border-radius', '4px')
    await expect(page.locator('#host-button')).toHaveCSS('border-radius', '0px')
    await page.addStyleTag({ content: '@layer app { .sds-button { border-radius: 8px; } }' })
    await expect(page.locator('.sds-button')).toHaveCSS('border-radius', '8px')
  })
}

test('host shadow DOM stays isolated while semantic tokens can be shared', async ({ page }) => {
  await page.setContent('<main data-sds-root><div id="host-component"></div><button class="sds-button">SDS action</button></main>')
  await page.locator('#host-component').evaluate((element) => {
    const shadow = element.attachShadow({ mode: 'open' })
    shadow.innerHTML = '<style>button { padding: 7px; border-radius: 19px; color: white; background: var(--md-sys-color-primary, rgb(0, 128, 0)); }</style><button class="sds-button">Host action</button>'
  })
  await page.addStyleTag({ path: 'dist/sds.css' })
  const hostButton = page.locator('#host-component button')
  await expect(hostButton).toHaveCSS('padding', '7px')
  await expect(hostButton).toHaveCSS('border-radius', '19px')
  await expect(hostButton).toHaveCSS('background-color', 'rgb(0, 128, 0)')
  await page.addStyleTag({ content: '[data-sds-root] { --md-sys-color-primary: var(--sds-color-action-primary); }' })
  await expect(hostButton).toHaveCSS('background-color', 'rgb(2, 102, 161)')
  await expect(page.locator('main > .sds-button')).toHaveCSS('border-radius', '4px')
})

test('SDS tokens preserve the host color scheme outside explicit roots', async ({ page }) => {
  await page.setContent(`
    <style>@layer host { :root { color-scheme: light dark; } }</style>
    <input id="host-input">
    <main data-sds-root><input id="sds-input"></main>
    <main data-sds-root data-sds-color-scheme="dark"><input id="dark-input"></main>
  `)
  await page.addStyleTag({ path: 'src/css/tokens.css' })
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light dark')
  await expect(page.locator('#host-input')).toHaveCSS('color-scheme', 'light dark')
  await expect(page.locator('#sds-input')).toHaveCSS('color-scheme', 'light')
  await expect(page.locator('#dark-input')).toHaveCSS('color-scheme', 'dark')
})

test('nested typography themes use the nearest theme boundary', async ({ page }) => {
  await page.setContent(`
    <main data-sds-root data-sds-theme="plaid">
      <h2 id="plaid-heading" class="sds-text-h3">Plaid</h2>
      <section data-sds-root data-sds-theme="forge">
        <h2 id="forge-heading" class="sds-text-h3">Forge</h2>
        <section data-sds-theme="plaid">
          <h2 id="nested-plaid-heading" class="sds-text-h3">Plaid again</h2>
        </section>
      </section>
      <section data-sds-root>
        <h2 id="default-heading" class="sds-text-h3">Default Forge</h2>
      </section>
    </main>
  `)
  await page.addStyleTag({ path: 'src/css/tokens.css' })
  await page.addStyleTag({ path: 'src/css/components/typography.css' })
  for (const selector of ['#plaid-heading', '#nested-plaid-heading']) {
    await expect(page.locator(selector)).toHaveCSS('font-weight', '400')
  }
  for (const selector of ['#forge-heading', '#default-heading']) {
    await expect(page.locator(selector)).toHaveCSS('font-weight', '600')
  }
})

test('theme roots leave unmarked native elements and their states unchanged', async ({ page }) => {
  await page.setContent(`
    <main data-sds-root>
      <h1>Semantic heading</h1><h3>Another heading</h3><p>Plain text</p>
      <a href="#target">Plain link</a><button>Plain button</button>
      <input placeholder="Plain placeholder"><input disabled><input readonly>
      <input aria-invalid="true"><input type="checkbox" checked>
      <input type="radio" checked><input type="range"><input type="file">
      <select><option>Plain option</option></select><textarea>Plain textarea</textarea>
      <fieldset><legend>Plain group</legend></fieldset>
      <progress value="1" max="2"></progress><meter value="0.5"></meter>
    </main>
  `)
  await page.locator('input').first().focus()
  const snapshot = () => page.locator('main, main *').evaluateAll((elements) => {
    const properties = [
      'display', 'box-sizing', 'color', 'background-color', 'font-family',
      'font-size', 'font-weight', 'line-height', 'margin', 'padding',
      'border', 'border-radius', 'appearance', 'box-shadow', 'outline',
      'text-decoration', 'width', 'height', 'pointer-events',
    ]
    return elements.map((element) => {
      const style = getComputedStyle(element)
      const result = Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]))
      if (element.matches('input:not([type])')) {
        result.placeholder = getComputedStyle(element, '::placeholder').color
        result.placeholderFont = getComputedStyle(element, '::placeholder').fontStyle
      }
      if (element.matches('input[type="file"]')) {
        result.fileButton = getComputedStyle(element, '::file-selector-button').backgroundColor
      }
      return result
    })
  })
  const before = await snapshot()
  await page.addStyleTag({ path: 'dist/sds.css' })
  expect(await snapshot()).toEqual(before)
})

test('explicit recipes style controls and heading size is independent of semantic level', async ({ page }) => {
  await page.setContent(`
    <main data-sds-root>
      <h1 class="sds-text-h6">Small top-level heading</h1>
      <h3 class="sds-text-h1">Large subsection heading</h3>
      <button class="sds-button">Save</button>
      <input class="sds-input" aria-invalid="true">
      <input class="sds-input" disabled>
      <input class="sds-checkbox" type="checkbox" checked>
      <input class="sds-range" type="range">
      <progress class="sds-progress" value="1" max="2"></progress>
    </main>
  `)
  await page.addStyleTag({ path: 'dist/sds.css' })
  await expect(page.locator('h1')).toHaveCSS('font-size', '14px')
  await expect(page.locator('h3')).toHaveCSS('font-size', '36px')
  await expect(page.locator('button')).toHaveCSS('display', 'inline-flex')
  await expect(page.locator('[aria-invalid]')).toHaveCSS('border-top-color', 'rgb(224, 42, 58)')
  await expect(page.locator('[disabled]')).toHaveCSS('background-color', 'rgb(225, 226, 227)')
  await expect(page.locator('[type="checkbox"]')).toHaveCSS('appearance', 'none')
  await expect(page.locator('[type="range"]')).toHaveCSS('appearance', 'none')
  await expect(page.locator('progress')).toHaveCSS('display', 'block')
  await page.locator('button').focus()
  await expect(page.locator('button')).toHaveCSS('outline-style', 'none')
  await expect(page.locator('button')).toHaveCSS('box-shadow', 'rgb(46, 177, 230) 0px 0px 0px 2px')
  await page.addStyleTag({ content: '@layer utilities { .host-small { font-size: 12px; } }' })
  await page.locator('h3').evaluate((element) => element.classList.add('host-small'))
  await expect(page.locator('h3')).toHaveCSS('font-size', '12px')
})

test('explicit typography matches the SEI small and large scales independently of heading semantics', async ({ page }) => {
  await page.setContent(`
    <main data-sds-root>
      <h1 class="sds-text-h6">Compact top-level heading</h1>
      <h3 class="sds-text-h1">Display heading</h3>
      <div class="sds-prose"><h2 class="sds-text-h3">Explicit prose heading</h2></div>
      <p class="sds-text-h2">Heading two appearance</p>
      <p class="sds-text-h4">Heading four appearance</p>
      <p class="sds-text-h5">Heading five appearance</p>
      <p class="sds-text-lead">Lead</p><p class="sds-text-body">Body</p>
      <p class="sds-text-caption1">Caption one</p><p class="sds-text-caption2">Caption two</p>
    </main>
  `)
  await page.addStyleTag({ path: 'dist/sds.css' })
  const roles = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'lead', 'body', 'caption1', 'caption2']
  for (const [width, sizes, heights] of [
    [767, [30, 24, 20, 18, 12, 12, 20, 14, 18, 12], [38, 28, 26, 20, 20, 20, 24, 20, 24, 20]],
    [768, [36, 30, 24, 20, 14, 14, 24, 16, 20, 14], [42, 36, 32, 28, 20, 20, 32, 24, 24, 20]],
  ]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [index, role] of roles.entries()) {
      await expect(page.locator(`.sds-text-${role}`)).toHaveCSS('font-size', `${sizes[index]}px`)
      await expect(page.locator(`.sds-text-${role}`)).toHaveCSS('line-height', `${heights[index]}px`)
    }
  }
  await page.locator('main').evaluate((element) => element.dataset.sdsTheme = 'plaid')
  await expect(page.locator('.sds-text-h1')).toHaveCSS('font-weight', '400')
  await expect(page.locator('.sds-text-h5')).toHaveCSS('font-weight', '600')
  await expect(page.locator('.sds-text-caption1')).toHaveCSS('font-style', 'italic')
})

test('explicit typography can keep the small or large SEI scale at any viewport', async ({ page }) => {
  await page.setContent(`
    <main data-sds-root>
      <h2 class="sds-text-h1" data-sds-size="sm">Fixed small heading</h2>
      <p class="sds-text-body" data-sds-size="lg">Fixed large body</p>
    </main>
  `)
  await page.addStyleTag({ path: 'dist/sds.css' })
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.locator('h2')).toHaveCSS('font-size', '30px')
    await expect(page.locator('h2')).toHaveCSS('line-height', '38px')
    await expect(page.locator('p')).toHaveCSS('font-size', '16px')
    await expect(page.locator('p')).toHaveCSS('line-height', '24px')
  }
})

test('foundations recognize every HTML class separator and class order', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setContent('<!doctype html><main data-sds-root></main>')
  await page.addStyleTag({ path: 'dist/sds.css' })
  await page.addStyleTag({ content: '.motion-probe::before, .motion-probe::after { content: ""; transition: opacity 1s; animation-duration: 1s; }' })
  const results = await page.evaluate(() => {
    const main = document.querySelector('main')
    const results = []
    for (const separator of [' ', '\t', '\n', '\r', '\f']) {
      for (const order of ['sds-first', 'host-first', 'leading-space']) {
        const classes = (recipe) => order === 'sds-first'
          ? `${recipe}${separator}host-control`
          : `${order === 'leading-space' ? separator : ''}host-control${separator}${recipe}`
        const container = document.createElement('div')
        container.style.width = '240px'
        const input = document.createElement('input')
        input.className = classes('sds-input')
        const panel = document.createElement('div')
        panel.className = classes('sds-stack')
        panel.hidden = true
        panel.textContent = 'Hidden content'
        const searchable = panel.cloneNode(true)
        searchable.setAttribute('hidden', 'until-found')
        const motion = document.createElement('div')
        motion.className = `${classes('sds-stack')} motion-probe`
        motion.style.cssText = 'transition: opacity 1s; animation-duration: 1s; animation-iteration-count: 3; scroll-behavior: smooth'
        container.append(input, panel, searchable, motion)
        main.append(container)
        const motionStyles = [getComputedStyle(motion), getComputedStyle(motion, '::before'), getComputedStyle(motion, '::after')]
        results.push({
          separator, order,
          inputSizing: getComputedStyle(input).boxSizing,
          inputWidth: input.getBoundingClientRect().width,
          hiddenDisplay: getComputedStyle(panel).display,
          searchableDisplay: getComputedStyle(searchable).display,
          motion: motionStyles.map((style) => ({
            boxSizing: style.boxSizing,
            transitionDuration: style.transitionDuration,
            animationDuration: style.animationDuration,
          })),
          iterations: motionStyles[0].animationIterationCount,
          scrolling: motionStyles[0].scrollBehavior,
        })
      }
    }
    return results
  })
  for (const result of results) {
    const message = JSON.stringify({ separator: result.separator, order: result.order })
    expect(result.inputSizing, message).toBe('border-box')
    expect(result.inputWidth, message).toBe(240)
    expect(result.hiddenDisplay, message).toBe('none')
    expect(result.searchableDisplay, message).toBe('flex')
    for (const style of result.motion) {
      expect(style.boxSizing, message).toBe('border-box')
      expect(parseFloat(style.transitionDuration), message).toBeLessThanOrEqual(0.00001)
      expect(parseFloat(style.animationDuration), message).toBeLessThanOrEqual(0.00001)
    }
    expect(result.iterations, message).toBe('1')
    expect(result.scrolling, message).toBe('auto')
  }
})

test('reduced motion applies to explicit recipes without changing host controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setContent(`
    <main data-sds-root>
      <button class="host-control" style="transition: opacity 1s">Host action</button>
      <button class="sds-button">SDS action</button>
      <sds-toast sds-ready open><strong>Saved</strong></sds-toast>
    </main>
  `)
  await page.addStyleTag({ path: 'dist/sds.css' })
  await expect(page.locator('.host-control')).toHaveCSS('transition-duration', '1s')
  for (const selector of ['.sds-button', 'sds-toast']) {
    const durations = await page.locator(selector).evaluate((element) =>
      getComputedStyle(element).transitionDuration.split(',').map((value) => parseFloat(value)),
    )
    expect(durations.every((duration) => duration <= 0.00001)).toBe(true)
  }
})

test('composed navigation recipes own sizing, typography, and link presentation', async ({ page }) => {
  await page.setContent(`
    <main data-sds-root style="font-family: Georgia; line-height: 1.5">
      <aside class="sds-sidebar" style="width: 288px; height: 320px">
        <header><strong>Project Atlas</strong></header>
        <nav><ul><li><a href="#reviews">Reviews</a></li></ul></nav>
        <footer><p>Updated a moment ago</p></footer>
      </aside>
      <nav class="sds-breadcrumb"><ol><li><a href="#home">Home</a></li></ol></nav>
      <nav class="sds-pagination"><ul><li><a href="#page">1</a></li></ul></nav>
      <sds-tabs variant="block"><div class="sds-tab-list"><button class="sds-tab">First</button></div><section class="sds-tab-panel"><p>Content</p></section></sds-tabs>
      <div class="sds-stack"><p>Stack content</p></div>
      <details class="sds-disclosure"><summary>Preview</summary></details>
    </main>
  `)
  await page.addStyleTag({ path: 'dist/sds.css' })
  await page.addStyleTag({ path: 'dist/brand.css' })
  await expect(page.locator('.sds-sidebar nav a')).toHaveCSS('box-sizing', 'border-box')
  await expect(page.locator('.sds-sidebar nav a')).toHaveCSS('height', '40px')
  await expect(page.locator('.sds-sidebar footer p')).toHaveCSS('margin-block-start', '0px')
  await expect(page.locator('.sds-pagination a')).toHaveCSS('width', '34px')
  await expect(page.locator('.sds-pagination a')).toHaveCSS('height', '34px')
  await expect(page.locator('.sds-breadcrumb a')).toHaveCSS('color', 'rgb(89, 90, 92)')
  await expect(page.locator('.sds-breadcrumb a')).toHaveCSS('text-decoration-line', 'none')
  await expect(page.locator('.sds-tab')).toHaveCSS('font-family', 'Georgia')
  await expect(page.locator('.sds-tab-panel p')).toHaveCSS('margin-block-start', '0px')
  await expect(page.locator('.sds-stack p')).toHaveCSS('margin-block-start', '0px')
  await expect(page.locator('.sds-disclosure summary')).toHaveCSS('box-sizing', 'border-box')
})

test('the playground chooses heading sizes explicitly', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.sds-page-header h1')).toHaveCSS('font-size', '24px')
  await expect(page.locator('#intro-title')).toHaveCSS('font-size', '36px')
  await expect(page.locator('#actions-title')).toHaveCSS('font-size', '24px')
})

test('native recipes render and preserve platform behavior', async ({
  browserName,
  page,
}) => {
  await page.goto('/')

  const switchInput = page.getByRole('switch', {
    name: 'Automatic updates',
  })
  await expect(switchInput).toBeChecked()
  await switchInput.click()
  await expect(switchInput).not.toBeChecked()
  await expect(switchInput).toHaveCSS('appearance', 'none')

  const fileInput = page.locator('#file-input')
  await expect(fileInput).toHaveAttribute('type', 'file')
  const fileUpload = page.locator('.sds-file-upload')
  await expect(fileUpload).toHaveCSS('border-top-style', 'dashed')
  await expect(fileUpload.locator('..')).toHaveCSS('grid-column-end', '-1')
  await expect(fileInput).toHaveCSS('position', 'absolute')
  await expect(fileInput).toHaveCSS('opacity', '0')
  await expect(fileUpload.locator('.sds-file-upload-action')).toHaveText(
    'Upload files',
  )

  const avatarGroup = page.locator('.sds-avatar-group')
  const avatars = avatarGroup.locator('.sds-avatar')
  const firstAvatar = await avatars.nth(0).boundingBox()
  const secondAvatar = await avatars.nth(1).boundingBox()
  expect(firstAvatar).not.toBeNull()
  expect(secondAvatar).not.toBeNull()
  expect(secondAvatar.x).toBeLessThan(firstAvatar.x + firstAvatar.width)
  const firstAvatarItem = avatarGroup.locator(':scope > li').first()
  const restingZIndex = await firstAvatarItem.evaluate(
    (item) => getComputedStyle(item).zIndex,
  )
  await firstAvatarItem.hover()
  await expect(firstAvatarItem).toHaveCSS('z-index', restingZIndex)
  const avatarDropdown = avatarGroup.locator('sds-dropdown')
  await expect(avatarDropdown).toHaveCount(1)
  const caretDisplay = await avatarDropdown
    .locator(':scope > button')
    .evaluate(
      (button) => getComputedStyle(button, '::after').display,
    )
  expect(caretDisplay).toBe('none')

  const pagination = page.getByRole('navigation', { name: 'Project pages' })
  const currentPage = pagination.locator('[aria-current="page"]')
  await expect(currentPage).toHaveText('1')
  await expect(currentPage).toHaveCSS(
    'background-color',
    'rgb(220, 242, 251)',
  )
  await expect(currentPage).toHaveCSS('border-top-color', 'rgb(2, 102, 161)')
  await expect(
    pagination.locator('a[aria-label="Previous page"]'),
  ).not.toHaveAttribute('href')

  const inputGroup = page.locator('.sds-input-group')
  await expect(inputGroup).toHaveCSS('display', 'flex')
  await expect(inputGroup.locator('.sds-input-addon').first()).toHaveCSS(
    'white-space',
    'nowrap',
  )
  await expect(inputGroup.locator('input')).toHaveCSS(
    'border-top-left-radius',
    '0px',
  )

  const range = page.locator('#range-input')
  await range.evaluate((element) => {
    element.dataset.sdsTone = 'success'
    element.dataset.sdsSize = 'lg'
  })
  const rangeStyles = await range.evaluate((element) => {
    const expected = document.createElement('span')
    expected.style.color = 'var(--sds-color-success-strong)'
    element.after(expected)
    const styles = getComputedStyle(element)
    const result = {
      appearance: styles.appearance,
      color: styles.color,
      expectedColor: getComputedStyle(expected).color,
      height: styles.height,
      thumbSize: styles.getPropertyValue('--sds-range-thumb-size').trim(),
      trackSize: styles.getPropertyValue('--sds-range-track-size').trim(),
    }
    expected.remove()
    return result
  })
  expect(rangeStyles).toEqual({
    appearance: 'none',
    color: rangeStyles.expectedColor,
    expectedColor: rangeStyles.expectedColor,
    height: '32px',
    thumbSize: '1.25rem',
    trackSize: '0.5rem',
  })

  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(breadcrumb.locator('ol')).toHaveCSS('display', 'flex')
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveCSS(
    'font-weight',
    '600',
  )

  const progress = page.getByRole('progressbar', { name: 'Upload progress' })
  await progress.evaluate((element) => {
    element.dataset.sdsTone = 'danger'
    element.dataset.sdsSize = 'lg'
  })
  await expect(progress).toHaveCSS('display', 'block')
  await expect(progress).toHaveCSS('height', '16px')
  await expect(progress).toHaveCSS('border-top-left-radius', '999px')
  const progressColors = await progress.evaluate((element) => {
    const expected = document.createElement('span')
    expected.style.color = 'var(--sds-color-danger-strong)'
    element.after(expected)
    const colors = {
      actual: getComputedStyle(element).color,
      expected: getComputedStyle(expected).color,
    }
    expected.remove()
    return colors
  })
  expect(progressColors.actual).toBe(progressColors.expected)

  const indeterminateProgress = await progress.evaluate((element) => {
    const clone = element.cloneNode()
    clone.id = 'indeterminate-progress'
    clone.removeAttribute('value')
    clone.setAttribute('aria-label', 'Indeterminate progress')
    element.after(clone)
    return clone.id
  })
  const indeterminate = page.locator(`#${indeterminateProgress}`)
  await expect(indeterminate).toHaveCSS(
    'animation-name',
    'sds-progress-indeterminate',
  )
  await expect(indeterminate).not.toHaveCSS('background-image', 'none')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(indeterminate).toHaveCSS('animation-name', 'none')
  await expect(indeterminate).toHaveCSS('background-position', '50% 0px')
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  if (browserName === 'chromium') {
    await page.emulateMedia({ forcedColors: 'active' })
    await expect(indeterminate).toHaveCSS('appearance', 'none')
    await expect(indeterminate).toHaveCSS('animation-name', 'none')
    await expect(indeterminate).toHaveCSS('forced-color-adjust', 'none')
    await expect(indeterminate).not.toHaveCSS('background-image', 'none')
    await expect(indeterminate).toHaveCSS('border-top-style', 'solid')
    await page.emulateMedia({ forcedColors: 'none' })
  }

  if (browserName === 'firefox') {
    const meter = page.locator('#catalog-meter')
    const meterColors = await meter.evaluate((element) => {
      element.min = 0
      element.max = 100
      element.low = 30
      element.high = 70
      element.optimum = 90
      const expected = document.createElement('span')
      element.after(expected)
      const colorAt = (value, token) => {
        element.value = value
        expected.style.color = `var(${token})`
        return {
          actual: getComputedStyle(element, '::-moz-meter-bar').backgroundColor,
          expected: getComputedStyle(expected).color,
        }
      }
      const colors = {
        optimum: colorAt(90, '--sds-color-success-strong'),
        suboptimal: colorAt(50, '--sds-color-warning-strong'),
        worst: colorAt(10, '--sds-color-danger-strong'),
      }
      expected.remove()
      return colors
    })
    expect(meterColors.optimum.actual).toBe(meterColors.optimum.expected)
    expect(meterColors.suboptimal.actual).toBe(
      meterColors.suboptimal.expected,
    )
    expect(meterColors.worst.actual).toBe(meterColors.worst.expected)
  }

  const skipLink = page.getByRole('link', { name: 'Skip to main content' })
  await skipLink.focus()
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toHaveCSS('font-size', '14px')
  await expect(skipLink).toHaveCSS('line-height', '20px')
  await expect(skipLink).toHaveCSS('text-decoration-line', 'none')
  await expect(skipLink).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
})

test('API disclosures copy their example markup and announce success', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.copiedMarkup = value
        },
      },
    })
  })

  const disclosure = page.locator('#actions > details.sds-card.sds-disclosure')
  await disclosure.locator('summary').click()
  const copyButton = disclosure.locator(
    '[data-copy-target="copy-button-markup"]',
  )
  await expect(copyButton).toHaveAccessibleName('Copy button markup')
  await copyButton.click()

  await expect(copyButton).toHaveText('Copied')
  await expect(page.locator('#copy-status')).toHaveText(
    'Example copied to clipboard.',
  )
  expect(await page.evaluate(() => window.copiedMarkup)).toContain(
    '<button class="sds-button" data-sds-variant="tonal" data-sds-tone="danger">',
  )
})
