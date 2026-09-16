const CHANGE_EVENT = 'sds-change'
const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as typeof HTMLElement)
    : HTMLElement

export class SdsTabsElement extends HTMLElementBase {
  private tabs: HTMLElement[] = []
  private panels = new Map<HTMLElement, HTMLElement>()
  private controller: AbortController | null = null

  connectedCallback(): void {
    this.controller?.abort()
    this.controller = new AbortController()

    const tabList = this.querySelector<HTMLElement>(
      '.sds-tab-list[role="tablist"]',
    )
    this.tabs = Array.from(
      this.querySelectorAll<HTMLElement>('.sds-tab[role="tab"]'),
    )
    this.panels.clear()

    for (const tab of this.tabs) {
      const panelId = tab.getAttribute('aria-controls')
      const panel = panelId
        ? this.querySelector<HTMLElement>(`#${CSS.escape(panelId)}`)
        : null

      if (
        !tab.id ||
        !panel ||
        panel.getAttribute('role') !== 'tabpanel' ||
        panel.getAttribute('aria-labelledby') !== tab.id
      ) {
        console.warn(
          '<sds-tabs> requires authored tab ids, aria-controls, tabpanel ids, and aria-labelledby.',
          this,
        )
        return
      }
      this.panels.set(tab, panel)
    }

    if (!tabList || this.tabs.length === 0) {
      console.warn(
        '<sds-tabs> requires a .sds-tab-list[role="tablist"] and tabs with role="tab".',
        this,
      )
      return
    }

    tabList.addEventListener('click', this.handleClick, {
      signal: this.controller.signal,
    })
    tabList.addEventListener('keydown', this.handleKeydown, {
      signal: this.controller.signal,
    })
  }

  disconnectedCallback(): void {
    this.controller?.abort()
  }

  private isDisabled(tab: HTMLElement): boolean {
    return (
      (tab instanceof HTMLButtonElement && tab.disabled) ||
      tab.getAttribute('aria-disabled') === 'true'
    )
  }

  private select(index: number, focus = false, notify = true): void {
    const selectedTab = this.tabs[index]
    const selectedPanel = this.panels.get(selectedTab)
    if (!selectedTab || !selectedPanel || this.isDisabled(selectedTab)) return

    this.tabs.forEach((tab) => {
      const selected = tab === selectedTab
      tab.setAttribute('aria-selected', String(selected))
      tab.tabIndex = selected ? 0 : -1
      const panel = this.panels.get(tab)
      if (panel) panel.hidden = !selected
    })

    if (focus) selectedTab.focus()
    if (notify) {
      this.dispatchEvent(
        new CustomEvent(CHANGE_EVENT, {
          bubbles: true,
          composed: true,
          detail: {
            index,
            value: selectedTab.dataset.value ?? selectedTab.id,
          },
        }),
      )
    }
  }

  private handleClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Element)) return
    const tab = event.target.closest<HTMLElement>('.sds-tab[role="tab"]')
    const index = tab ? this.tabs.indexOf(tab) : -1
    if (index < 0 || tab instanceof HTMLAnchorElement) return
    this.select(index)
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (!(document.activeElement instanceof HTMLElement)) return
    const currentIndex = this.tabs.indexOf(document.activeElement)
    if (currentIndex < 0) return

    const vertical =
      this.dataset.orientation === 'vertical' ||
      event.currentTarget instanceof HTMLElement &&
        event.currentTarget.getAttribute('aria-orientation') === 'vertical'
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight'
    const previousKey = vertical ? 'ArrowUp' : 'ArrowLeft'
    const enabledTabs = this.tabs.filter((tab) => !this.isDisabled(tab))
    if (enabledTabs.length === 0) return

    const enabledIndex = enabledTabs.indexOf(this.tabs[currentIndex])
    let nextTab: HTMLElement | null = null
    if (event.key === nextKey) {
      nextTab = enabledTabs[(enabledIndex + 1) % enabledTabs.length]
    } else if (event.key === previousKey) {
      nextTab =
        enabledTabs[
          (enabledIndex - 1 + enabledTabs.length) % enabledTabs.length
        ]
    } else if (event.key === 'Home') {
      nextTab = enabledTabs[0]
    } else if (event.key === 'End') {
      nextTab = enabledTabs[enabledTabs.length - 1]
    }

    if (!nextTab) return
    event.preventDefault()
    const nextIndex = this.tabs.indexOf(nextTab)
    if (
      this.dataset.activation === 'manual' ||
      nextTab instanceof HTMLAnchorElement
    ) {
      nextTab.focus()
    } else {
      this.select(nextIndex, true)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sds-tabs': SdsTabsElement
  }
}

export function registerSdsTabs(): void {
  if (
    typeof customElements !== 'undefined' &&
    !customElements.get('sds-tabs')
  ) {
    customElements.define('sds-tabs', SdsTabsElement)
  }
}

registerSdsTabs()
