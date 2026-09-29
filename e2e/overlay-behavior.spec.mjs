import { expect, test } from '@playwright/test'

async function sampleSurface(page, selector, action) {
  return page.locator(selector).first().evaluate(async (surface, requestedAction) => {
    const samples = []
    const record = () => {
      const rect = surface.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return false
      const backdrop = getComputedStyle(surface, '::backdrop')
      samples.push({
        backdrop: backdrop.backgroundColor,
        backdropOpacity: Number.parseFloat(backdrop.opacity),
        children: Array.from(surface.children, (child) => ({
          height: child.offsetHeight,
          left: child.offsetLeft,
          top: child.offsetTop,
          width: child.offsetWidth,
        })),
        height: surface.offsetHeight,
        left: rect.left,
        top: rect.top,
        visualWidth: rect.width,
        width: surface.offsetWidth,
      })
      return true
    }

    record()
    if (requestedAction === 'open') surface.showModal()
    else surface.close()
    record()
    for (let frame = 0; frame < 20; frame += 1) {
      await new Promise(requestAnimationFrame)
      if (!record()) break
    }
    return samples
  }, action)
}

function expectStable(values, tolerance = 0.5) {
  expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(
    tolerance,
  )
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(50)
})

for (const selector of [
  'dialog.sds-dialog',
  '#panel-left-sm',
  '#panel-right-md',
  '#panel-bottom',
]) {
  test(`${selector} preserves content layout while the surface moves`, async ({
    page,
  }) => {
    const opening = await sampleSurface(page, selector, 'open')
    expect(opening.length).toBeGreaterThan(1)
    expect(new Set(opening.map((sample) => JSON.stringify(sample.children))).size)
      .toBe(1)
    expectStable(opening.map((sample) => sample.width))
    expectStable(opening.map((sample) => sample.height))
    if (selector === 'dialog.sds-dialog') {
      expect(
        Math.max(...opening.map((sample) => sample.visualWidth)) -
          Math.min(...opening.map((sample) => sample.visualWidth)),
      ).toBeGreaterThan(1)
    } else {
      const axis = selector === '#panel-bottom' ? 'top' : 'left'
      expect(
        Math.max(...opening.map((sample) => sample[axis])) -
          Math.min(...opening.map((sample) => sample[axis])),
      ).toBeGreaterThan(1)
    }

    const closing = await sampleSurface(page, selector, 'close')
    if (closing.length > 1) {
      expect(
        new Set(closing.map((sample) => JSON.stringify(sample.children))).size,
      ).toBe(1)
      expectStable(closing.map((sample) => sample.width))
      expectStable(closing.map((sample) => sample.height))
    }
  })

  test(`${selector} backdrop fades without changing color`, async ({ page }) => {
    const samples = await sampleSurface(page, selector, 'open')
    const opacities = samples.map((sample) => sample.backdropOpacity)

    expect(new Set(samples.map((sample) => sample.backdrop))).toEqual(
      new Set(['rgba(0, 0, 0, 0.5)']),
    )
    expect(opacities.at(-1)).toBe(1)
    for (let index = 1; index < opacities.length; index += 1) {
      expect(opacities[index]).toBeGreaterThanOrEqual(opacities[index - 1])
    }
  })
}

for (const [selector, axis, direction] of [
  ['#panel-left-sm', 'x', -1],
  ['#panel-right-md', 'x', 1],
  ['#panel-bottom', 'y', 1],
]) {
  test(`${selector} can be dragged closed from its pill handle`, async ({
    page,
  }) => {
    const panel = page.locator(selector)
    await panel.evaluate((element) => element.showModal())

    const handle = panel.locator(':scope > ._sds-panel-handle')
    await expect(handle).toHaveAttribute('aria-hidden', 'true')
    await page.waitForTimeout(200)
    const handleBox = await handle.boundingBox()
    const panelBox = await panel.boundingBox()
    expect(handleBox).not.toBeNull()
    expect(panelBox).not.toBeNull()

    const startX = handleBox.x + handleBox.width / 2
    const startY = handleBox.y + handleBox.height / 2
    const travel =
      (axis === 'x' ? panelBox.width : panelBox.height) * 0.6 * direction

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(
      startX + (axis === 'x' ? travel : 0),
      startY + (axis === 'y' ? travel : 0),
      { steps: 5 },
    )
    await page.mouse.up()

    await expect(panel).not.toBeVisible()
    await expect(panel).not.toHaveAttribute('open')
  })
}

test('preventing a dragged panel cancel returns it to the open position', async ({
  page,
}) => {
  const panel = page.locator('#panel-bottom')
  await panel.evaluate((element) => {
    element.addEventListener('cancel', (event) => event.preventDefault(), {
      once: true,
    })
    element.showModal()
  })
  await page.waitForTimeout(200)

  const handleBox = await panel
    .locator(':scope > ._sds-panel-handle')
    .boundingBox()
  const panelBox = await panel.boundingBox()
  expect(handleBox).not.toBeNull()
  expect(panelBox).not.toBeNull()

  const startX = handleBox.x + handleBox.width / 2
  const startY = handleBox.y + handleBox.height / 2
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX, startY + panelBox.height * 0.6, { steps: 5 })
  await page.mouse.up()

  await expect(panel).toHaveAttribute('open')
  await expect
    .poll(() => panel.evaluate((element) => element.style.transform))
    .toBe('')
})

test('a short deliberate panel drag settles back open', async ({ page }) => {
  const panel = page.locator('#panel-bottom')
  await panel.evaluate((element) => element.showModal())
  await page.waitForTimeout(200)

  const handleBox = await panel
    .locator(':scope > ._sds-panel-handle')
    .boundingBox()
  expect(handleBox).not.toBeNull()

  const startX = handleBox.x + handleBox.width / 2
  const startY = handleBox.y + handleBox.height / 2
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX, startY + 24, { steps: 3 })
  await page.waitForTimeout(100)
  await page.mouse.up()
  await expect(panel).toHaveAttribute('open')
  await expect(panel).toHaveAttribute('open')
  await expect
    .poll(() => panel.evaluate((element) => element.style.transform))
    .toBe('')
})

test('popover opens after hover delay, stays open over content, and closes after leaving', async ({
  page,
}) => {
  const popover = page.locator('sds-popover').first()
  const trigger = popover.locator(':scope > button')
  const content = popover.locator(':scope > .sds-popover-content')

  await trigger.scrollIntoViewIfNeeded()
  await trigger.dispatchEvent('pointerenter')
  await page.waitForTimeout(350)
  await expect(content).not.toBeVisible()
  await expect(content).toBeVisible({ timeout: 500 })

  await content.hover()
  await page.waitForTimeout(400)
  await expect(content).toBeVisible()

  await page.mouse.move(0, 0)
  await expect(content).not.toBeVisible({ timeout: 1200 })
})

for (const elementName of ['sds-dropdown', 'sds-popover']) {
  test(`${elementName} exposes reflected host state and methods`, async ({
    page,
  }) => {
    const host = page.locator(elementName).first()
    const surface = host.locator(':scope > :nth-child(2)')

    await host.scrollIntoViewIfNeeded()
    await host.evaluate((element) => element.show())
    await expect(host).toHaveAttribute('open', '')
    await expect(surface).toBeVisible()

    await host.evaluate((element) => element.hide())
    await expect(host).not.toHaveAttribute('open')
    await expect(surface).not.toBeVisible()
  })
}

test('disabled dropdown items remain in the keyboard sequence', async ({
  page,
}) => {
  await page.evaluate(() => {
    const dropdown = document.createElement('sds-dropdown')
    dropdown.id = 'disabled-menu-test'
    dropdown.innerHTML = `
      <button type="button">Actions</button>
      <menu>
        <li><button type="button">First</button></li>
        <li><button type="button" aria-disabled="true">Unavailable</button></li>
        <li><button type="button">Last</button></li>
      </menu>
    `
    document.body.append(dropdown)
  })

  const trigger = page.getByRole('button', { name: 'Actions', exact: true })
  await trigger.focus()
  await trigger.press('ArrowDown')
  await expect(page.getByRole('menuitem', { name: 'First' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(
    page.getByRole('menuitem', { name: 'Unavailable' }),
  ).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#disabled-menu-test > menu')).toBeVisible()
})

test('tooltip opens immediately on hover', async ({ page }) => {
  const tooltip = page.locator('sds-tooltip').first()
  const trigger = tooltip.locator(':scope > :first-child')
  const content = tooltip.locator(':scope > :nth-child(2)')

  await trigger.scrollIntoViewIfNeeded()
  await trigger.dispatchEvent('pointerenter')
  await expect(content).toBeVisible()
})

for (const elementName of ['sds-tooltip', 'sds-popover']) {
  test(`${elementName} arrow points into its trigger`, async ({ page }) => {
    const host = page.locator(elementName).first()
    const trigger = host.locator(':scope > :first-child')
    const surface = host.locator(':scope > :nth-child(2)')

    await trigger.scrollIntoViewIfNeeded()
    await trigger.dispatchEvent('pointerenter')
    await expect(surface).toBeVisible({ timeout: 3000 })

    const geometry = await surface.evaluate((element) => {
      const surfaceRect = element.getBoundingClientRect()
      const triggerRect =
        element.previousElementSibling.getBoundingClientRect()
      const style = getComputedStyle(element)
      const arrowStyle = getComputedStyle(element, '::before')
      const side = element.dataset.sdsSide
      const arrowX =
        surfaceRect.left + Number.parseFloat(style.getPropertyValue('--sds-floating-arrow-x'))
      const arrowY =
        surfaceRect.top + Number.parseFloat(style.getPropertyValue('--sds-floating-arrow-y'))

      return {
        arrowContent: arrowStyle.content,
        arrowHeight: Number.parseFloat(arrowStyle.height),
        arrowWidth: Number.parseFloat(arrowStyle.width),
        arrowX,
        arrowY,
        side,
        surfaceBottom: surfaceRect.bottom,
        surfaceLeft: surfaceRect.left,
        surfaceOverflow: style.overflow,
        surfaceRight: surfaceRect.right,
        surfaceTop: surfaceRect.top,
        triggerBottom: triggerRect.bottom,
        triggerLeft: triggerRect.left,
        triggerRight: triggerRect.right,
        triggerTop: triggerRect.top,
      }
    })

    expect(geometry.arrowContent).not.toBe('none')
    expect(geometry.arrowWidth).toBeGreaterThan(0)
    expect(geometry.arrowHeight).toBeGreaterThan(0)
    expect(geometry.surfaceOverflow).toBe('visible')

    const arrowProjection = geometry.arrowWidth / Math.sqrt(2)
    let gap
    if (geometry.side === 'top' || geometry.side === 'bottom') {
      expect(geometry.arrowX).toBeGreaterThanOrEqual(geometry.triggerLeft)
      expect(geometry.arrowX).toBeLessThanOrEqual(geometry.triggerRight)
      gap =
        geometry.side === 'top'
          ? geometry.triggerTop -
            (geometry.surfaceBottom + arrowProjection)
          : geometry.surfaceTop -
            (geometry.triggerBottom + arrowProjection)
    } else {
      expect(geometry.arrowY).toBeGreaterThanOrEqual(geometry.triggerTop)
      expect(geometry.arrowY).toBeLessThanOrEqual(geometry.triggerBottom)
      gap =
        geometry.side === 'left'
          ? geometry.triggerLeft -
            (geometry.surfaceRight + arrowProjection)
          : geometry.surfaceLeft -
            (geometry.triggerRight + arrowProjection)
    }
    expect(Math.abs(gap)).toBeLessThanOrEqual(1)
  })
}
