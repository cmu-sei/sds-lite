import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('the playground has no detectable accessibility violations', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.waitForTimeout(50)

  const analyze = () =>
    new AxeBuilder({ page })
      .withTags([
        'best-practice',
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
        'wcag22aa',
      ])
      .analyze()

  const closedResults = await analyze()
  await page.getByRole('button', { name: 'Show success' }).click()
  await page.waitForTimeout(50)
  const openResults = await analyze()
  const violations = [...closedResults.violations, ...openResults.violations]

  expect(
    violations,
    violations
      .map(
        (violation) =>
          `${violation.id}: ${violation.nodes
            .map((node) => node.target.join(' '))
            .join(', ')}`,
      )
      .join('\n'),
  ).toEqual([])
})
