import { expect, test } from '@playwright/test'

test('standalone date range compares calendar values rather than year string widths', async ({ page }) => {
  await page.goto('/docs/examples/date-range.html')
  const form = page.locator('#date-range-example')
  const start = form.locator('[name="start"]')
  const end = form.locator('[name="end"]')
  await form.evaluate(element => {
    element.elements.start.value = '9999-12-31'
    element.elements.end.value = '10000-01-01'
    element.elements.start.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(end).toHaveAttribute('min', '9999-12-31')
  await expect(end).toHaveAttribute('aria-invalid', 'false')
  expect(await form.evaluate(element => element.checkValidity())).toBe(true)
  await form.evaluate(element => {
    element.elements.start.value = '10000-01-01'
    element.elements.end.value = '9999-12-31'
    element.elements.end.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(end).toHaveAttribute('aria-invalid', 'true')
  expect(await end.evaluate(element => element.validity.customError)).toBe(true)
  await form.getByRole('button', { name: 'Reset dates', exact: true }).click()
  await expect(start).toHaveValue('')
  await expect(end).toHaveValue('')
  await expect(end).toHaveAttribute('aria-invalid', 'false')
  expect(await end.evaluate(element => element.validity.customError)).toBe(false)
})
