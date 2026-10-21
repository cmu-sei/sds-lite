import { expect, test } from '@playwright/test'

async function setPointerTimestamps(page, timestamps) {
  await page.evaluate(times => {
    let index = 0
    for (const type of ['pointerdown', 'pointermove', 'pointerup']) {
      document.addEventListener(type, event => {
        const time = times[index++]
        if (time === undefined) throw new Error('Unexpected pointer event in gesture')
        Object.defineProperty(event, 'timeStamp', { value: time })
      }, { capture: true })
    }
  }, timestamps)
}

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

test('modal and panel shared styling preserves their distinct surfaces', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 800 })
    for (const selector of ['#catalog-dialog', '#panel-right-md']) {
      const surface = page.locator(selector)
      await surface.evaluate(element => element.showModal())
      await expect(surface).toBeVisible()
      await expect(surface).toHaveCSS('border-top-width', '1px')
      await expect(surface).toHaveCSS('overflow', 'auto')
      await expect(surface).toHaveCSS('display', selector === '#catalog-dialog' ? 'grid' : 'flex')
      const heading = surface.locator('.sds-dialog-header h2, :scope > header h2')
      await expect(heading).toHaveClass('sds-text-title')
      await expect(heading).toHaveCSS('font-size', '20px')
      await expect(heading).toHaveCSS('font-weight', '500')
      await expect(heading).toHaveCSS('line-height', '28px')
      await heading.evaluate(element => element.className = '')
      await expect(heading).toHaveCSS('font-size', '20px')
      await expect(heading).toHaveCSS('font-weight', '500')
      await expect(heading).toHaveCSS('line-height', '28px')
      await heading.evaluate(element => element.className = 'sds-text-title')
      const footer = surface.locator('.sds-dialog-footer, :scope > footer')
      await expect(footer).toHaveCSS('display', 'flex')
      await expect(footer).toHaveCSS('justify-content', 'flex-end')
      for (const action of await footer.locator('.sds-button').all()) {
        await expect(action).toHaveCSS('order', '0')
      }
      await surface.evaluate(element => element.close())
      await expect(surface).toBeHidden()
    }
  }
})

for (const selector of [
  '#catalog-dialog',
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
    if (selector === '#catalog-dialog') {
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
    await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
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

  test(`${selector} can be grabbed again while a short drag settles open`, async ({ page }) => {
    const panel = page.locator(selector)
    await panel.evaluate(element => {
      element.style.setProperty('--sds-duration-normal', '1s')
      element.showModal()
    })
    await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
    const handle = panel.locator(':scope > ._sds-panel-handle')
    const drag = async (distance, hold = 0) => {
      const box = await handle.boundingBox()
      expect(box).not.toBeNull()
      const x = box.x + box.width / 2
      const y = box.y + box.height / 2
      await page.mouse.move(x, y)
      await page.mouse.down()
      if (hold) {
        const grabbed = await panel.boundingBox()
        await page.waitForTimeout(hold)
        const held = await panel.boundingBox()
        expect(held.x).toBeCloseTo(grabbed.x, 0)
        expect(held.y).toBeCloseTo(grabbed.y, 0)
      }
      await page.mouse.move(
        x + (axis === 'x' ? distance * direction : 0),
        y + (axis === 'y' ? distance * direction : 0),
        { steps: 3 },
      )
    }
    await drag(24)
    await page.waitForTimeout(100)
    await page.mouse.up()
    await drag(100, 300)
    await page.mouse.up()
    await expect(panel).not.toHaveAttribute('open')
  })

  for (const [name, distances, closes] of [
    ['keeps dismissal committed after retreating to 13px', [48, 13], true],
    ['cancels committed dismissal when returning to 12px', [48, 12], false],
    ['cancels committed dismissal when returning to the start', [48, 0], false],
    ['recommits dismissal after canceling and crossing 48px again', [48, 12, 48, 13], true],
  ]) {
    test(`${selector} ${name}`, async ({ page }) => {
      const panel = page.locator(selector)
      await panel.evaluate(element => element.showModal())
      const handle = panel.locator(':scope > ._sds-panel-handle')
      await handle.hover()
      const box = await handle.boundingBox()
      expect(box).not.toBeNull()
      const x = box.x + box.width / 2
      const y = box.y + box.height / 2
      await page.mouse.down()
      for (const distance of distances) {
        await page.mouse.move(
          x + (axis === 'x' ? distance * direction : 0),
          y + (axis === 'y' ? distance * direction : 0),
        )
      }
      // The commitment must survive a pause, without velocity projection.
      await page.waitForTimeout(100)
      await page.mouse.up()
      if (closes) {
        await expect(panel).not.toBeVisible()
        await expect(panel).not.toHaveAttribute('open')
      } else {
        await expect(panel).toHaveAttribute('open')
        await expect.poll(() => panel.evaluate(element => element.style.transform)).toBe('')
      }
    })
  }

  test(`${selector} does not revive canceled dismissal through velocity projection`, async ({ page }) => {
    const panel = page.locator(selector)
    await panel.evaluate(element => element.showModal())
    const handle = panel.locator(':scope > ._sds-panel-handle')
    await handle.hover()
    const box = await handle.boundingBox()
    expect(box).not.toBeNull()
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await setPointerTimestamps(page, [1000, 1010, 1020, 1200, 1210])
    await page.mouse.down()
    for (const distance of [48, 12, 28]) {
      await page.mouse.move(
        x + (axis === 'x' ? distance * direction : 0),
        y + (axis === 'y' ? distance * direction : 0),
      )
    }
    await page.mouse.up()
    await expect(panel).toHaveAttribute('open')
    await expect.poll(() => panel.evaluate(element => element.style.transform)).toBe('')
  })

  for (const width of [1440, 390]) {
    test(`${selector} uses a fixed 48px drag-dismiss threshold at every size at ${width}px`, async ({
      page,
    }) => {
      test.setTimeout(30_000)
      const panel = page.locator(selector)
      await page.setViewportSize({ width, height: 900 })
      for (const size of ['sm', 'md', 'lg', 'xl']) {
        await panel.evaluate((element, size) => { element.dataset.sdsWidth = size }, size)
        for (const distance of [47, 48]) {
          await panel.evaluate(element => element.showModal())
          await expect(panel).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
          const handle = panel.locator(':scope > ._sds-panel-handle')
          await handle.hover()
          const handleBox = await handle.boundingBox()
          expect(handleBox).not.toBeNull()

          const startX = handleBox.x + handleBox.width / 2
          const startY = handleBox.y + handleBox.height / 2
          const travel = distance * direction
          await page.mouse.move(startX, startY)
          await page.mouse.down()
          await page.mouse.move(
            startX + (axis === 'x' ? travel : 0),
            startY + (axis === 'y' ? travel : 0),
            { steps: 5 },
          )
          await expect.poll(() => panel.evaluate(element => element.style.transform)).not.toBe('')
          // Pause so velocity projection cannot hide the distance threshold.
          await page.waitForTimeout(100)
          await page.mouse.up()

          if (distance < 48) {
            await expect(panel).toHaveAttribute('open')
            await expect.poll(() => panel.evaluate(element => element.style.transform)).toBe('')
            await panel.evaluate(element => element.close())
          }
          await expect(panel, `${selector}: ${width}px viewport, ${size} size, ${distance}px drag`).not.toBeVisible()
          await expect(panel).not.toHaveAttribute('open')
        }
      }
    })
  }
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

test('a quick outward flick dismisses a panel even after holding its handle', async ({ page }) => {
  const panel = page.locator('#panel-bottom')
  await panel.evaluate(element => element.showModal())
  await page.waitForTimeout(200)
  const handle = panel.locator(':scope > ._sds-panel-handle')
  await handle.hover()
  const handleBox = await handle.boundingBox()
  expect(handleBox).not.toBeNull()
  const startX = handleBox.x + handleBox.width / 2
  const startY = handleBox.y + handleBox.height / 2
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.waitForTimeout(500)
  await page.mouse.move(startX, startY + 8)
  await page.waitForTimeout(60)
  await page.mouse.move(startX, startY + 28)
  await page.mouse.up()
  await expect(panel).not.toBeVisible()
  await expect(panel).not.toHaveAttribute('open')
})

for (const eventType of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  test(`${eventType} respects the final pointer position and cancellation`, async ({ page }) => {
    const panel = page.locator('#panel-bottom')
    await panel.evaluate(element => element.showModal())
    const handle = panel.locator(':scope > ._sds-panel-handle')
    await handle.hover()
    const handleBox = await handle.boundingBox()
    const panelBox = await panel.boundingBox()
    expect(handleBox).not.toBeNull()
    expect(panelBox).not.toBeNull()
    const startX = handleBox.x + handleBox.width / 2
    const startY = handleBox.y + handleBox.height / 2
    await handle.evaluate(element => {
      element.addEventListener('pointerdown', event => {
        element.dataset.pointerId = String(event.pointerId)
      }, { once: true })
    })
    await page.mouse.down()
    await page.mouse.move(startX, startY + (eventType === 'pointerup' ? 20 : 48))
    await page.waitForTimeout(100)
    await handle.dispatchEvent(eventType, {
      pointerId: Number(await handle.getAttribute('data-pointer-id')),
      pointerType: 'mouse',
      isPrimary: true,
      clientX: startX,
      clientY: startY + panelBox.height * 0.3,
    })
    await page.mouse.up()

    if (eventType !== 'pointerup') {
      await expect(panel).toHaveAttribute('open')
      await expect.poll(() => panel.evaluate(element => element.style.transform)).toBe('')
    } else {
      await expect(panel).not.toBeVisible()
      await expect(panel).not.toHaveAttribute('open')
    }
  })
}

test('a quick flick with equal pointer timestamps does not bounce back', async ({ page }) => {
  const panel = page.locator('#panel-bottom')
  await panel.evaluate(element => element.showModal())
  const handle = panel.locator(':scope > ._sds-panel-handle')
  await handle.hover()
  const box = await handle.boundingBox()
  expect(box).not.toBeNull()
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await setPointerTimestamps(page, Array(5).fill(1000))
  await page.mouse.down()
  await page.mouse.move(x, y + 28, { steps: 3 })
  await page.mouse.up()
  await expect(panel).not.toBeVisible()
  await expect(panel).not.toHaveAttribute('open')
})

for (const [name, timestamps] of [
  ['a quick outward flick tolerates a one-pixel release wobble', [1000, 1010, 1020, 1030, 1040]],
  ['a flick retains movement spanning the sampling-window boundary', [1000, 1010, 1040, 1110, 1120]],
]) {
  test(name, async ({ page }) => {
    const panel = page.locator('#panel-bottom')
    await panel.evaluate(element => element.showModal())
    const handle = panel.locator(':scope > ._sds-panel-handle')
    await handle.hover()
    const box = await handle.boundingBox()
    expect(box).not.toBeNull()
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await setPointerTimestamps(page, timestamps)
    await page.mouse.down()
    await page.mouse.move(x, y + 8)
    await page.mouse.move(x, y + 36)
    await page.mouse.move(x, y + 35)
    await page.mouse.up()
    await expect(panel).not.toBeVisible()
    await expect(panel).not.toHaveAttribute('open')
  })
}

test('a deliberate inward reversal cancels flick projection', async ({ page }) => {
  const panel = page.locator('#panel-bottom')
  await panel.evaluate(element => element.showModal())
  const handle = panel.locator(':scope > ._sds-panel-handle')
  await handle.hover()
  const box = await handle.boundingBox()
  expect(box).not.toBeNull()
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await setPointerTimestamps(page, [1000, 1010, 1020, 1030, 1040])
  await page.mouse.down()
  await page.mouse.move(x, y + 8)
  await page.mouse.move(x, y + 36)
  await page.mouse.move(x, y + 20)
  await page.mouse.up()
  await expect(panel).toHaveAttribute('open')
  await expect.poll(() => panel.evaluate(element => element.style.transform)).toBe('')
})

test('popover opens after hover delay, stays open over content, and closes after leaving', async ({
  page,
}) => {
  await page.clock.install()
  await page.clock.pauseAt(new Date())
  const popover = page.locator('sds-popover').first()
  const trigger = popover.locator(':scope > button')
  const content = popover.locator(':scope > .sds-popover-content')

  await trigger.scrollIntoViewIfNeeded()
  await trigger.dispatchEvent('pointerenter')
  await page.clock.fastForward(499)
  await expect(content).not.toBeVisible()
  await page.clock.fastForward(1)
  await expect(content).toBeVisible()

  await content.hover()
  await page.clock.fastForward(500)
  await expect(content).toBeVisible()

  await page.mouse.move(0, 0)
  await page.clock.fastForward(119)
  await expect(content).toBeVisible()
  await page.clock.fastForward(1)
  await expect(content).not.toBeVisible()
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
      <button class="sds-button" type="button">Actions</button>
      <menu>
        <li><button class="sds-button" type="button">First</button></li>
        <li><button class="sds-button" type="button" aria-disabled="true">Unavailable</button></li>
        <li><button class="sds-button" type="button">Last</button></li>
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
