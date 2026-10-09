import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const state of ['closed', 'open']) {
  test(`the playground has no detectable accessibility violations with toasts ${state}`, async ({ page }) => {
    test.setTimeout(20_000)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const toast = page.locator('#toast-success')
    if (state === 'open') {
      await toast.evaluate(element => element.setAttribute('persistent', ''))
      await page.getByRole('button', { name: 'Show success' }).click()
      await expect(toast).toBeVisible()
    } else {
      await expect(toast).toBeHidden()
    }

    const { violations } = await new AxeBuilder({ page })
      .withTags([
        'best-practice',
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
        'wcag22aa',
      ])
      .analyze()

    await expect(toast)[state === 'open' ? 'toBeVisible' : 'toBeHidden']()
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
}
