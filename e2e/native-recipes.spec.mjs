import { expect, test } from '@playwright/test'

test('native recipes render and preserve platform behavior', async ({ page }) => {
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
})
