import { expect, test } from '@playwright/test'

test('tabs synchronize orientation through attributes, properties, and resets', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const fixture = document.createElement('div')
    fixture.innerHTML = `
      <sds-tabs id="api-tabs" orientation="horizontal">
        <div aria-label="API orientation">
          <button type="button" value="one">One</button>
          <button type="button" value="two">Two</button>
        </div>
        <section>First panel</section>
        <section>Second panel</section>
      </sds-tabs>
    `
    document.body.append(fixture)
  })
  const tabs = page.locator('#api-tabs')
  const list = tabs.getByRole('tablist')
  const first = tabs.getByRole('tab', { name: 'One', exact: true })
  await expect(list).toHaveAttribute('aria-orientation', 'horizontal')

  await tabs.evaluate(element => element.setAttribute('orientation', 'vertical'))
  await expect(list).toHaveAttribute('aria-orientation', 'vertical')
  await first.focus()
  await page.keyboard.press('ArrowDown')
  await expect(tabs).toHaveAttribute('value', 'two')

  await tabs.evaluate(element => { element.orientation = 'horizontal'; element.value = 'one' })
  await expect(list).toHaveAttribute('aria-orientation', 'horizontal')
  await first.focus()
  await page.keyboard.press('ArrowDown')
  await expect(tabs).toHaveAttribute('value', 'one')
  await page.keyboard.press('ArrowRight')
  await expect(tabs).toHaveAttribute('value', 'two')

  await tabs.evaluate(element => { element.orientation = 'vertical'; element.value = 'one' })
  await tabs.evaluate(element => element.setAttribute('orientation', 'horizontal'))
  await expect(list).toHaveAttribute('aria-orientation', 'horizontal')
  await first.focus()
  await page.keyboard.press('ArrowDown')
  await expect(tabs).toHaveAttribute('value', 'one')

  await tabs.evaluate(element => { element.orientation = 'vertical'; element.removeAttribute('orientation') })
  await expect(list).toHaveAttribute('aria-orientation', 'horizontal')
  expect(await tabs.evaluate(element => element.orientation)).toBe('horizontal')
  await page.keyboard.press('ArrowRight')
  await expect(tabs).toHaveAttribute('value', 'two')
})

test('detached tabs reset orientation without overriding authored tablist orientation', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    const fixture = document.createElement('div')
    fixture.innerHTML = `
      <sds-tabs id="reset-tabs" orientation="vertical">
        <div aria-label="Reset orientation">
          <button type="button" value="one">One</button>
          <button type="button" value="two">Two</button>
        </div>
        <section>First panel</section>
        <section>Second panel</section>
      </sds-tabs>
      <sds-tabs id="authored-tabs">
        <div aria-label="Authored orientation" aria-orientation="vertical">
          <button type="button" value="one">One</button>
          <button type="button" value="two">Two</button>
        </div>
        <section>First panel</section>
        <section>Second panel</section>
      </sds-tabs>
    `
    document.body.append(fixture)
  })
  const tabs = page.locator('#reset-tabs')
  await expect(tabs.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical')
  await tabs.evaluate(element => {
    const parent = element.parentElement
    element.remove()
    element.removeAttribute('orientation')
    parent.append(element)
  })
  expect(await tabs.evaluate(element => element.orientation)).toBe('horizontal')
  await expect(tabs.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal')
  await tabs.getByRole('tab', { name: 'One', exact: true }).focus()
  await page.keyboard.press('ArrowDown')
  await expect(tabs).toHaveAttribute('value', 'one')
  await page.keyboard.press('ArrowRight')
  await expect(tabs).toHaveAttribute('value', 'two')

  const authored = page.locator('#authored-tabs')
  await authored.evaluate(element => {
    const parent = element.parentElement
    element.remove()
    parent.append(element)
  })
  await expect(authored.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical')
  await authored.getByRole('tab', { name: 'One', exact: true }).focus()
  await page.keyboard.press('ArrowDown')
  await expect(authored).toHaveAttribute('value', 'two')
})

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
    await expect(underline).toHaveCSS('color', 'rgb(2, 102, 161)')
    await expect(underline).toHaveCSS(
      'border-block-end-color',
      'rgb(2, 102, 161)',
    )

    const block = page.locator(
      'sds-tabs[variant="block"][tone="accent"] .sds-tab[aria-selected="true"]',
    )
    await expect(block).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(block).toHaveCSS('background-color', 'rgb(153, 46, 116)')
  })
