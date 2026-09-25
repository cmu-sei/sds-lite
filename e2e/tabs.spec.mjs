import { expect, test } from '@playwright/test'

test('the selected folder tab covers the divider without vertical scrolling', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.waitForTimeout(20)

  const selectedTab = page.getByRole('tab', {
    name: 'Large folder',
    selected: true,
  })

  const layout = await selectedTab.evaluate((tab) => {
    const textTop = (element) => {
      const range = document.createRange()
      range.selectNodeContents(element)
      return range.getBoundingClientRect().top
    }
    const tabRect = tab.getBoundingClientRect()
    const tabList = tab.parentElement
    const peerTab = tabList.querySelector(
      '.sds-tab[aria-selected="false"]:not(:disabled)',
    )
    const listRect = tabList.getBoundingClientRect()
    const listStyle = getComputedStyle(tabList)
    const peerStyle = getComputedStyle(peerTab)
    const tabStyle = getComputedStyle(tab)
    tabList.scrollTop = 1
    return {
      listBackgroundImage: listStyle.backgroundImage,
      listBorderBottomWidth: listStyle.borderBottomWidth,
      listBottom: listRect.bottom,
      overflowY: listStyle.overflowY,
      tabBorderBottomWidth: tabStyle.borderBottomWidth,
      tabBorderBottomColor: tabStyle.borderBottomColor,
      tabBackground: tabStyle.backgroundColor,
      tabBoxShadow: tabStyle.boxShadow,
      scrollTop: tabList.scrollTop,
      tabBottom: tabRect.bottom,
      tabTextTop: textTop(tab),
      peerTextTop: textTop(peerTab),
      peerBorderBottomColor: peerStyle.borderBottomColor,
      peerBackground: peerStyle.backgroundColor,
      verticalScrollRange: tabList.scrollHeight - tabList.clientHeight,
    }
  })
  expect(layout.listBackgroundImage).not.toBe('none')
  expect(layout.listBorderBottomWidth).toBe('0px')
  expect(layout.overflowY).not.toBe('hidden')
  expect(layout.tabBorderBottomWidth).toBe('1px')
  expect(layout.tabBorderBottomColor).toBe('rgba(0, 0, 0, 0)')
  expect(layout.tabBackground).toBe('rgb(255, 255, 255)')
  expect(layout.tabBoxShadow).not.toBe('none')
  expect(layout.tabBoxShadow).toContain('rgba(0, 0, 0, 0.1)')
  expect(layout.verticalScrollRange).toBe(0)
  expect(layout.scrollTop).toBe(0)
  expect(layout.tabBottom).toBe(layout.listBottom)
  expect(layout.tabTextTop).toBe(layout.peerTextTop)
  expect(layout.peerBorderBottomColor).not.toBe('rgba(0, 0, 0, 0)')
  expect(layout.peerBackground).toBe('rgb(248, 248, 248)')
})

  test('underline and block tabs use semantic tone colors', async ({ page }) => {
    await page.goto('/')

    const underline = page.locator(
      'sds-tabs[variant="underline"][tone="info"] .sds-tab[aria-selected="true"]',
    )
    await expect(underline).toHaveCSS('color', 'rgb(0, 107, 109)')
    await expect(underline).toHaveCSS(
      'border-block-end-color',
      'rgb(0, 107, 109)',
    )

    const block = page.locator(
      'sds-tabs[variant="block"][tone="accent"] .sds-tab[aria-selected="true"]',
    )
    await expect(block).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(block).toHaveCSS('background-color', 'rgb(2, 102, 161)')
  })
