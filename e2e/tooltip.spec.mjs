import { expect, test } from '@playwright/test'

for (const neighbor of ['Search', 'GitHub']) {
  test(`activated theme tooltip does not linger while hovering ${neighbor}`, async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      document.body.insertAdjacentHTML('afterbegin', `
        <div id="tooltip-neighbors" class="sds-cluster">
          <sds-tooltip>
            <button type="button" tabindex="0" data-sds-action="toggle-color-scheme">Theme</button>
            <span>Theme tooltip</span>
          </sds-tooltip>
          <sds-tooltip><button type="button" tabindex="0">Search</button><span>Search tooltip</span></sds-tooltip>
          <sds-tooltip><a href="#structure" tabindex="0">GitHub</a><span>GitHub tooltip</span></sds-tooltip>
        </div>`)
    })
    const fixture = page.locator('#tooltip-neighbors')
    const theme = fixture.locator('[data-sds-action="toggle-color-scheme"]')
    const themeTooltip = theme.locator('..').locator('[role="tooltip"]')
    const other = fixture.getByRole(neighbor === 'GitHub' ? 'link' : 'button', { name: neighbor, exact: true })
    const otherTooltip = other.locator('..').locator('[role="tooltip"]')
    await theme.focus()
    await theme.hover()
    await theme.click()
    await expect(themeTooltip).toBeHidden()
    const box = await theme.boundingBox()
    await page.mouse.move(box.x + box.width / 2 + 2, box.y + box.height / 2)
    await expect(themeTooltip).toBeHidden()
    await other.hover({ steps: 8 })
    await expect(otherTooltip).toBeVisible()
    await expect(fixture.locator('[role="tooltip"]:popover-open')).toHaveCount(1)
    await expect(theme).toBeFocused()

    await theme.hover({ steps: 8 })
    await expect(themeTooltip).toBeVisible()
    await expect(otherTooltip).toBeHidden()
    await other.hover({ steps: 8 })
    await expect(themeTooltip).toBeHidden()
    await expect(otherTooltip).toBeVisible()
    await expect(fixture.locator('[role="tooltip"]:popover-open')).toHaveCount(1)
  })
}

for (const scenario of ['Escape away from trigger', 'Escape over trigger', 'close button after keyboard navigation']) {
  test(`tooltip dismissal survives dialog focus restoration via ${scenario}`, async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="tooltip-focus-fixture">
          <button type="button" tabindex="0">Before search</button>
          <sds-tooltip>
            <button type="button" tabindex="0" commandfor="tooltip-search-dialog" command="show-modal">Open search</button>
            <span>Search documentation</span>
          </sds-tooltip>
          <button type="button" tabindex="0">After search</button>
          <dialog id="tooltip-search-dialog" class="sds-dialog" aria-label="Search">
            <input aria-label="Search query" autofocus>
            <button type="button" tabindex="0" commandfor="tooltip-search-dialog" command="close">Close search</button>
          </dialog>
        </div>`)
    })
    const fixture = page.locator('#tooltip-focus-fixture')
    const trigger = fixture.getByRole('button', { name: 'Open search', exact: true })
    const content = fixture.locator('[role="tooltip"]')
    const dialog = fixture.getByRole('dialog')
    await trigger.focus()
    await expect(content).toBeVisible()
    if (scenario.startsWith('Escape')) {
      await trigger.hover()
      await trigger.click()
    } else await trigger.press('Enter')
    await expect(dialog).toBeVisible()
    await expect(content).toBeHidden()
    if (scenario === 'close button after keyboard navigation') {
      await page.keyboard.press('Tab')
      await expect(dialog.getByRole('button', { name: 'Close search' })).toBeFocused()
      await dialog.getByRole('button', { name: 'Close search' }).click()
    } else {
      if (scenario === 'Escape away from trigger') await page.mouse.move(0, 0)
      await page.keyboard.press('Escape')
    }
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect(content).toBeHidden()
    if (scenario === 'Escape over trigger') {
      await page.mouse.move(0, 0)
      await trigger.hover()
    } else {
      await page.keyboard.press('Tab')
      await expect(fixture.getByRole('button', { name: 'After search' })).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await expect(trigger).toBeFocused()
    }
    await expect(content).toBeVisible()
  })
}

test('tooltip text stays centered at every size regardless of inherited alignment', async ({ page }) => {
  await page.goto('/')
  const tooltip = page.locator('#structure sds-tooltip').first()
  const content = tooltip.locator('.sds-tooltip-content')
  await content.evaluate(element => {
    element.textContent = 'A longer tooltip description that wraps across multiple lines.'
  })
  await tooltip.locator('button').focus()

  for (const alignment of ['left', 'right']) {
    await tooltip.evaluate((element, value) => {
      element.style.textAlign = value
    }, alignment)
    for (const size of ['sm', 'md', 'lg', 'xl', 'auto']) {
      await tooltip.evaluate((element, value) => {
        element.setAttribute('size', value)
      }, size)
      await expect(content).toBeVisible()
      await expect(content).toHaveCSS('text-align', 'center')
    }
  }
})

for (const activation of ['pointer', 'Enter', 'Space']) {
  test(`tooltips dismiss on ${activation} activation without moving focus`, async ({ page }) => {
    await page.goto('/')
    const tooltip = page.locator('#structure sds-tooltip').first()
    const trigger = tooltip.locator('button')
    const content = tooltip.locator('.sds-tooltip-content')
    await trigger.evaluate(element => { element.tabIndex = 0 })
    await trigger.focus()
    if (activation === 'pointer') await trigger.hover()
    await expect(content).toBeVisible()

    let focusedAtActivation = true
    if (activation === 'pointer') {
      await page.mouse.down()
      focusedAtActivation = await trigger.evaluate(element => element === document.activeElement)
      await page.mouse.up()
    } else await trigger.press(activation)
    await expect(content).toBeHidden()
    expect(await trigger.evaluate(element => element === document.activeElement)).toBe(focusedAtActivation)

    await page.mouse.move(0, 0)
    await expect(content).toBeHidden()
    if (activation === 'pointer') await trigger.hover()
    else {
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
    }
    await expect(content).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(content).toBeHidden()
    expect(await trigger.evaluate(element => element === document.activeElement)).toBe(focusedAtActivation)
  })
}

test('Escape cancels delayed popover opening and preserves Escape for its modal', async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'))
  await page.evaluate(() => {
    const dialog = document.createElement('dialog')
    dialog.id = 'delayed-popover-dialog'
    dialog.className = 'sds-dialog'
    dialog.setAttribute('aria-label', 'Delayed popover')
    dialog.innerHTML = '<sds-popover><button type="button">Delayed details</button><section>Project details</section></sds-popover>'
    document.body.append(dialog)
    dialog.showModal()
  })
  const dialog = page.locator('#delayed-popover-dialog')
  const trigger = dialog.getByRole('button', { name: 'Delayed details', exact: true })
  await expect(trigger).toBeFocused()
  await page.clock.fastForward(499)
  expect(await dialog.locator('section').evaluate(element => element.matches(':popover-open'))).toBe(false)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.clock.fastForward(650)
  expect(await dialog.locator('section').evaluate(element => element.matches(':popover-open'))).toBe(false)
})

test('Escape cancels a pending popover while its trigger remains focused', async ({ page }) => {
  await page.goto('/')
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'))
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<sds-popover id="pending-popover"><button type="button">Pending details</button><section>Details</section></sds-popover>')
  })
  const popover = page.locator('#pending-popover')
  const trigger = popover.getByRole('button', { name: 'Pending details', exact: true })
  await trigger.focus()
  await trigger.press('Escape')
  await expect(trigger).toBeFocused()
  await page.clock.fastForward(650)
  expect(await popover.locator('section').evaluate(element => element.matches(':popover-open'))).toBe(false)
  await trigger.evaluate(element => element.blur())
  await trigger.focus()
  await page.clock.fastForward(500)
  await expect(popover.locator('section')).toBeVisible()
})
test('tooltip sizes match the SEI Design System defaults', async ({ page }) => {
  await page.goto('/')

  const tooltip = page.locator('#structure sds-tooltip').first()
  const content = tooltip.locator('.sds-tooltip-content')

  await expect(tooltip).toHaveJSProperty('size', 'sm')

  for (const [size, width] of [
    ['sm', '128px'],
    ['md', '192px'],
    ['lg', '224px'],
    ['xl', '288px'],
  ]) {
    await tooltip.evaluate((element, value) => {
      element.setAttribute('size', value)
    }, size)
    await expect(content).toHaveCSS('width', width)
  }
})

test('dark tooltips remain readable in both color schemes', async ({ page }) => {
  await page.goto('/')

  const tooltip = page.locator('#structure sds-tooltip').first()
  const content = tooltip.locator('.sds-tooltip-content')
  await tooltip.locator('button').hover()

  for (const scheme of ['light', 'dark']) {
    await page.locator('[data-sds-root]').evaluate((root, scheme) => {
      root.setAttribute('data-sds-color-scheme', scheme)
    }, scheme)
    await expect(content).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    await expect(content).toHaveCSS('color', 'rgb(240, 241, 241)')
    await expect(content).toHaveCSS('border-top-color', 'rgb(48, 49, 50)')
  }
})