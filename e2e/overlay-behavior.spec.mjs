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

test('popover opens after hover delay, stays open over content, and closes after leaving', async ({
  page,
}) => {
  const popover = page.locator('sds-popover').first()
  const trigger = popover.locator(':scope > button')
  const content = popover.locator(':scope > .sds-popover-content')

  await trigger.hover()
  await page.waitForTimeout(100)
  await expect(content).not.toBeVisible()
  await expect(content).toBeVisible({ timeout: 700 })

  await content.hover()
  await page.waitForTimeout(400)
  await expect(content).toBeVisible()

  await page.mouse.move(0, 0)
  await expect(content).not.toBeVisible({ timeout: 700 })
})

test('tooltip opens after its hover delay', async ({ page }) => {
  const tooltip = page.locator('sds-tooltip').first()
  const trigger = tooltip.locator(':scope > :first-child')
  const content = tooltip.locator(':scope > :nth-child(2)')

  await trigger.hover()
  await page.waitForTimeout(100)
  await expect(content).not.toBeVisible()
  await expect(content).toBeVisible({ timeout: 700 })
})

for (const elementName of ['sds-tooltip', 'sds-popover']) {
  test(`${elementName} arrow points into its trigger`, async ({ page }) => {
    const host = page.locator(elementName).first()
    const trigger = host.locator(':scope > :first-child')
    const surface = host.locator(':scope > :nth-child(2)')

    await trigger.hover()
    await expect(surface).toBeVisible({ timeout: 700 })

    const geometry = await surface.evaluate((element) => {
      const surfaceRect = element.getBoundingClientRect()
      const triggerRect =
        element.previousElementSibling.getBoundingClientRect()
      const style = getComputedStyle(element)
      const arrowStyle = getComputedStyle(element, '::before')
      const side = element.dataset.side
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
        triggerBottom: triggerRect.bottom,
        triggerLeft: triggerRect.left,
        triggerRight: triggerRect.right,
        triggerTop: triggerRect.top,
      }
    })

    expect(geometry.arrowContent).not.toBe('none')
    expect(geometry.arrowWidth).toBeGreaterThan(0)
    expect(geometry.arrowHeight).toBeGreaterThan(0)
    if (geometry.side === 'top' || geometry.side === 'bottom') {
      expect(geometry.arrowX).toBeGreaterThanOrEqual(geometry.triggerLeft)
      expect(geometry.arrowX).toBeLessThanOrEqual(geometry.triggerRight)
    } else {
      expect(geometry.arrowY).toBeGreaterThanOrEqual(geometry.triggerTop)
      expect(geometry.arrowY).toBeLessThanOrEqual(geometry.triggerBottom)
    }
  })
}
