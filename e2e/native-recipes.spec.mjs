import { expect, test } from '@playwright/test'

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
    '<button data-sds-variant="tonal" data-sds-tone="danger">',
  )
})
