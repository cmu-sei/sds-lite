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
      tabTextTop: textTop(tab),
      peerTextTop: textTop(peerTab),
      verticalScrollRange: tabList.scrollHeight - tabList.clientHeight,
    }
  })
  expect(layout.listBackgroundImage).not.toBe('none')
  expect(layout.listBorderBottomWidth).toBe('0px')
  expect(layout.overflowY).not.toBe('hidden')
  expect(layout.tabBorderBottomWidth).toBe('1px')
  expect(layout.tabBoxShadow).not.toBe('none')
  expect(layout.verticalScrollRange).toBe(0)
  expect(layout.scrollTop).toBe(0)
  expect(layout.tabBottom).toBe(layout.listBottom)
  expect(layout.tabTextTop).toBe(layout.peerTextTop)
})
