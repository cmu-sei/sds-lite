import { expect, test } from '@playwright/test'

const themes = ['forge', 'plaid']
const schemes = ['light', 'dark']
const tones = ['neutral', 'accent', 'info', 'success', 'warning', 'danger']

function rgbChannels(color) {
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number)
  expect(channels, `Expected an RGB color, received ${color}`).toHaveLength(3)
  return channels
}

function luminance(color) {
  const channels = rgbChannels(color).map((channel) => {
    const value = channel / 255
    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(first, second) {
  const lighter = Math.max(luminance(first), luminance(second))
  const darker = Math.min(luminance(first), luminance(second))
  return (lighter + 0.05) / (darker + 0.05)
}

test('form-control boundaries meet non-text contrast in every theme and scheme', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const selectors = [
    '#text-input',
    '#select-input',
    '#textarea-input',
    '.sds-choice input[type="checkbox"]:not(:checked):not(:disabled)',
    '.sds-choice input[type="radio"]:not(:checked):not(:disabled)',
    '.sds-file-upload',
  ]

  for (const theme of themes) {
    for (const scheme of schemes) {
      await page.locator('[data-sds-root]').evaluate(
        (root, settings) => {
          root.setAttribute('data-sds-theme', settings.theme)
          root.setAttribute('data-sds-color-scheme', settings.scheme)
        },
        { theme, scheme },
      )

      for (const selector of selectors) {
        const colors = await page.locator(selector).first().evaluate((element) => {
          const style = getComputedStyle(element)
          return {
            border: style.borderTopColor,
            background: style.backgroundColor,
          }
        })
        expect(
          contrast(colors.border, colors.background),
          `${theme} ${scheme}: ${selector}`,
        ).toBeGreaterThanOrEqual(3)
      }
    }
  }
})

test('focus keeps the blue ring and adds a contrasting control boundary', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const input = page.locator('#text-input')

  for (const theme of themes) {
    for (const scheme of schemes) {
      await page.locator('[data-sds-root]').evaluate(
        (root, settings) => {
          root.setAttribute('data-sds-theme', settings.theme)
          root.setAttribute('data-sds-color-scheme', settings.scheme)
        },
        { theme, scheme },
      )
      await input.focus()
      await page.waitForTimeout(50)

      const styles = await input.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          background: style.backgroundColor,
          borderColor: style.borderColor,
          borderWidth: style.borderWidth,
          boxShadow: style.boxShadow,
          focusRing: style.getPropertyValue('--sds-color-focus-ring').trim(),
        }
      })
      const shadowColors = styles.boxShadow.match(/rgba?\([^)]+\)/g) ?? []

      expect(shadowColors, `${theme} ${scheme}: ${styles.boxShadow}`).toHaveLength(1)
      expect(styles.boxShadow).toContain('0px 0px 0px 2px')
      expect(contrast(styles.borderColor, styles.background)).toBeGreaterThanOrEqual(3)
      expect(contrast(styles.borderColor, shadowColors[0])).toBeGreaterThanOrEqual(3)
      expect(styles.borderWidth).toBe('1px')
      expect(shadowColors[0].replaceAll(/\s/g, '')).toBe(
        scheme === 'light' ? 'rgb(46,177,230)' : 'rgb(3,79,141)',
      )
    }
  }
})

test('checked switch thumbs meet non-text contrast for every tone', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-sds-root]').evaluate((root, tones) => {
    root.insertAdjacentHTML(
      'afterbegin',
      tones
        .map(
          (tone) =>
            `<label class="sds-switch" data-sds-tone="${tone}"><input data-switch-tone="${tone}" type="checkbox" role="switch" checked>${tone}</label>`,
        )
        .join(''),
    )
  }, tones)

  for (const theme of themes) {
    for (const scheme of schemes) {
      await page.locator('[data-sds-root]').evaluate(
        (root, settings) => {
          root.setAttribute('data-sds-theme', settings.theme)
          root.setAttribute('data-sds-color-scheme', settings.scheme)
        },
        { theme, scheme },
      )
      await page.waitForTimeout(200)

      for (const tone of tones) {
        const colors = await page
          .locator(`[data-switch-tone="${tone}"]`)
          .evaluate((element) => {
            const style = getComputedStyle(element)
            return {
              track: style.backgroundColor,
              thumb: style.backgroundImage.match(/rgba?\([^)]+\)/)?.[0],
            }
          })
        expect(colors.thumb, `${theme} ${scheme}: ${tone} thumb`).toBeTruthy()
        expect(
          contrast(colors.thumb, colors.track),
          `${theme} ${scheme}: ${tone} (${colors.thumb} on ${colors.track})`,
        ).toBeGreaterThanOrEqual(3)
      }
    }
  }
})