import { expect, test } from '@playwright/test'

test('the selected folder tab covers the divider without vertical scrolling', async ({
  page,
}) => {
  await page.goto('/')

  const selectedTab = page.getByRole('tab', {
    name: 'Large folder',
    selected: true,
  })

  const layout = await selectedTab.evaluate((tab) => {
    const tabRect = tab.getBoundingClientRect()
    const tabList = tab.parentElement
    const listRect = tabList.getBoundingClientRect()
    const listStyle = getComputedStyle(tabList)
    const tabStyle = getComputedStyle(tab)
    tabList.scrollTop = 1
    return {
      listBackgroundImage: listStyle.backgroundImage,
      listBorderBottomWidth: listStyle.borderBottomWidth,
      listBottom: listRect.bottom,
      overflowY: listStyle.overflowY,
      tabBorderBottomWidth: tabStyle.borderBottomWidth,
      tabBoxShadow: tabStyle.boxShadow,
      scrollTop: tabList.scrollTop,
      tabBottom: tabRect.bottom,
      verticalScrollRange: tabList.scrollHeight - tabList.clientHeight,
    }
  })
  expect(layout.listBackgroundImage).not.toBe('none')
  expect(layout.listBorderBottomWidth).toBe('0px')
  expect(layout.overflowY).not.toBe('hidden')
  expect(layout.tabBorderBottomWidth).toBe('0px')
  expect(layout.tabBoxShadow).not.toBe('none')
  expect(layout.verticalScrollRange).toBe(0)
  expect(layout.scrollTop).toBe(0)
  expect(layout.tabBottom).toBe(layout.listBottom)
})
