import { expect, test } from '@playwright/test'

const values = {
  none: '0px',
  '2xs': '2px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
}

const utilities = {
  'data-sds-padding': ['paddingBlockStart', 'paddingBlockEnd', 'paddingInlineStart', 'paddingInlineEnd'],
  'data-sds-padding-block': ['paddingBlockStart', 'paddingBlockEnd'],
  'data-sds-padding-inline': ['paddingInlineStart', 'paddingInlineEnd'],
  'data-sds-padding-block-start': ['paddingBlockStart'],
  'data-sds-padding-block-end': ['paddingBlockEnd'],
  'data-sds-padding-inline-start': ['paddingInlineStart'],
  'data-sds-padding-inline-end': ['paddingInlineEnd'],
  'data-sds-margin': ['marginBlockStart', 'marginBlockEnd', 'marginInlineStart', 'marginInlineEnd'],
  'data-sds-margin-block': ['marginBlockStart', 'marginBlockEnd'],
  'data-sds-margin-inline': ['marginInlineStart', 'marginInlineEnd'],
  'data-sds-margin-block-start': ['marginBlockStart'],
  'data-sds-margin-block-end': ['marginBlockEnd'],
  'data-sds-margin-inline-start': ['marginInlineStart'],
  'data-sds-margin-inline-end': ['marginInlineEnd'],
}

test('spacing utilities cover every logical direction and token', async ({ page }) => {
  await page.goto('/')

  const results = await page.evaluate(({ utilities, values }) => {
    const element = document.createElement('div')
    document.body.append(element)
    const mismatches = []

    for (const [attribute, properties] of Object.entries(utilities)) {
      for (const [value, expected] of Object.entries(values)) {
        element.setAttribute(attribute, value)
        const style = getComputedStyle(element)
        for (const property of properties) {
          if (style[property] !== expected) {
            mismatches.push({
              attribute,
              value,
              property,
              expected,
              actual: style[property],
            })
          }
        }
        element.removeAttribute(attribute)
      }
    }

    element.remove()
    return mismatches
  }, { utilities, values })

  expect(results).toEqual([])
})

test('specific spacing utilities override axis and all-side utilities', async ({ page }) => {
  await page.goto('/')

  const styles = await page.evaluate(() => {
    const element = document.createElement('div')
    element.setAttribute('data-sds-padding', 'lg')
    element.setAttribute('data-sds-padding-block', 'sm')
    element.setAttribute('data-sds-padding-block-start', 'xs')
    element.setAttribute('data-sds-margin', '2xl')
    element.setAttribute('data-sds-margin-inline', 'xl')
    element.setAttribute('data-sds-margin-inline-end', 'md')
    document.body.append(element)

    const style = getComputedStyle(element)
    const result = {
      paddingBlockStart: style.paddingBlockStart,
      paddingBlockEnd: style.paddingBlockEnd,
      paddingInlineStart: style.paddingInlineStart,
      paddingInlineEnd: style.paddingInlineEnd,
      marginBlockStart: style.marginBlockStart,
      marginBlockEnd: style.marginBlockEnd,
      marginInlineStart: style.marginInlineStart,
      marginInlineEnd: style.marginInlineEnd,
    }
    element.remove()
    return result
  })

  expect(styles).toEqual({
    paddingBlockStart: '4px',
    paddingBlockEnd: '8px',
    paddingInlineStart: '16px',
    paddingInlineEnd: '16px',
    marginBlockStart: '32px',
    marginBlockEnd: '32px',
    marginInlineStart: '24px',
    marginInlineEnd: '12px',
  })
})
