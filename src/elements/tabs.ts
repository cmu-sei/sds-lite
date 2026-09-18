import {
  defineCustomElement,
  directElementChildren,
  ElementConnection,
  ensureId,
  reflectStringAttribute,
} from './internals.js'
import type {
  SdsOrientation,
  SdsTabsActivation,
  SdsTabsSize,
  SdsTabsVariant,
  SdsTone,
} from '../generated/interface.js'

const CHANGE_EVENT = 'sds-change'
const HTMLElementBase: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as typeof HTMLElement)
    : HTMLElement

export interface SdsTabsChangeDetail {
  index: number
  value: string
}

export class SdsTabsElement extends HTMLElementBase {
  static observedAttributes = ['value']

  private tabs: HTMLElement[] = []
  private panels = new Map<HTMLElement, HTMLElement>()
  private connection = new ElementConnection()
  private reflectingValue = false

  get value(): string {
    return this.getAttribute('value') ?? ''
  }

  set value(value: string) {
    if (
      this.isConnected &&
      !this.tabs.some(
        (tab) => this.tabValue(tab) === value && !this.isDisabled(tab),
      )
    ) {
      throw new RangeError(`<sds-tabs> has no enabled tab with value "${value}".`)
    }
    reflectStringAttribute(this, 'value', value)
  }

  get activation(): SdsTabsActivation {
    return (this.getAttribute('activation') ??
      'automatic') as SdsTabsActivation
  }

  set activation(value: SdsTabsActivation) {
    reflectStringAttribute(this, 'activation', value)
  }

  get orientation(): SdsOrientation {
    return (this.getAttribute('orientation') ??
      'horizontal') as SdsOrientation
  }

  set orientation(value: SdsOrientation) {
    reflectStringAttribute(this, 'orientation', value)
    this.syncOrientation()
  }

  get size(): SdsTabsSize {
    return (this.getAttribute('size') ?? 'md') as SdsTabsSize
  }

  set size(value: SdsTabsSize) {
    reflectStringAttribute(this, 'size', value)
  }

  get tone(): SdsTone {
    return (this.getAttribute('tone') ?? 'accent') as SdsTone
  }

  set tone(value: SdsTone) {
    reflectStringAttribute(this, 'tone', value)
  }

  get variant(): SdsTabsVariant {
    return (this.getAttribute('variant') ?? 'folder') as SdsTabsVariant
  }

  set variant(value: SdsTabsVariant) {
    reflectStringAttribute(this, 'variant', value)
  }

  connectedCallback(): void {
    const signal = this.connection.connect(
      this,
      () => this.connectedCallback(),
      { childList: true, subtree: true },
    )

    const children = directElementChildren(this)
    const tabList =
      children.find((child) =>
        child.matches('.sds-tab-list, [role="tablist"]'),
      ) ??
      children[0] ??
      null
    this.tabs = tabList
      ? directElementChildren(tabList).filter(
          (tab) =>
            tab instanceof HTMLButtonElement ||
            tab instanceof HTMLAnchorElement,
        )
      : []
    this.panels.clear()

    if (!tabList || this.tabs.length === 0) {
      console.warn(
        '<sds-tabs> requires a tab-list container with button or link children.',
      )
      return
    }

    const availablePanels = children.filter((child) => child !== tabList)
    if (availablePanels.length < this.tabs.length) {
      console.warn(
        '<sds-tabs> requires one panel for every tab.',
      )
      return
    }

    tabList.classList.add('sds-tab-list')
    tabList.setAttribute('role', 'tablist')
    this.syncOrientation(tabList)
    if (
      !tabList.hasAttribute('aria-label') &&
      !tabList.hasAttribute('aria-labelledby')
    ) {
      console.warn(
        '<sds-tabs> requires an accessible name on its tab list.',
      )
    }

    const unassignedPanels = new Set(availablePanels)
    for (const [index, tab] of this.tabs.entries()) {
      const requestedPanelId = tab.getAttribute('aria-controls')
      const requestedPanel =
        availablePanels.find((candidate) => candidate.id === requestedPanelId) ??
        null
      const panel =
        requestedPanel && unassignedPanels.has(requestedPanel)
          ? requestedPanel
          : availablePanels[index] &&
              unassignedPanels.has(availablePanels[index])
            ? availablePanels[index]
            : unassignedPanels.values().next().value

      if (!panel) continue
      unassignedPanels.delete(panel)

      const tabId = ensureId(tab, 'sds-tab')
      const panelId = ensureId(panel, 'sds-tab-panel')
      tab.classList.add('sds-tab')
      tab.setAttribute('role', 'tab')
      tab.setAttribute('aria-controls', panelId)
      panel.classList.add('sds-tab-panel')
      panel.setAttribute('role', 'tabpanel')
      panel.setAttribute('aria-labelledby', tabId)
      this.panels.set(tab, panel)
    }

    const requestedTab = this.value
      ? this.tabs.find(
          (tab) => this.tabValue(tab) === this.value && !this.isDisabled(tab),
        )
      : null
    if (this.value && !requestedTab) {
      console.warn(
        `<sds-tabs> has no enabled tab with value "${this.value}".`,
      )
    }
    const selectedTab =
      requestedTab ??
      this.tabs.find(
        (tab) =>
          tab.getAttribute('aria-selected') === 'true' &&
          !this.isDisabled(tab),
      ) ??
      this.tabs.find((tab) => !this.isDisabled(tab)) ??
      null

    for (const tab of this.tabs) {
      const selected = tab === selectedTab
      tab.setAttribute('aria-selected', String(selected))
      tab.tabIndex = selected ? 0 : -1
      const panel = this.panels.get(tab)
      if (panel) panel.hidden = !selected
    }
    if (selectedTab) this.reflectValue(this.tabValue(selectedTab))

    tabList.addEventListener('click', this.handleClick, {
      signal,
    })
    tabList.addEventListener('keydown', this.handleKeydown, {
      signal,
    })
  }

  disconnectedCallback(): void {
    this.connection.disconnect()
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (
      name !== 'value' ||
      oldValue === newValue ||
      this.reflectingValue ||
      !this.isConnected ||
      newValue === null
    ) {
      return
    }

    const index = this.tabs.findIndex(
      (tab) => this.tabValue(tab) === newValue && !this.isDisabled(tab),
    )
    if (index >= 0) {
      this.select(index, false, false)
      return
    }

    console.warn(
      `<sds-tabs> has no enabled tab with value "${newValue}".`,
    )
    const selected = this.tabs.find(
      (tab) => tab.getAttribute('aria-selected') === 'true',
    )
    if (selected) this.reflectValue(this.tabValue(selected))
  }

  private isDisabled(tab: HTMLElement): boolean {
    return (
      (tab instanceof HTMLButtonElement && tab.disabled) ||
      tab.getAttribute('aria-disabled') === 'true'
    )
  }

  private syncOrientation(tabList?: HTMLElement): void {
    if (!this.hasAttribute('orientation')) return

    const target =
      tabList ??
      directElementChildren(this).find((child) =>
        child.matches('.sds-tab-list, [role="tablist"]'),
      )
    target?.setAttribute('aria-orientation', this.orientation)
  }

  private tabValue(tab: HTMLElement): string {
    return tab.getAttribute('value') ?? tab.id
  }

  private reflectValue(value: string): void {
    this.reflectingValue = true
    reflectStringAttribute(this, 'value', value)
    this.reflectingValue = false
  }

  private select(index: number, focus = false, notify = true): void {
    const selectedTab = this.tabs[index]
    const selectedPanel = this.panels.get(selectedTab)
    if (!selectedTab || !selectedPanel || this.isDisabled(selectedTab)) return

    const previousIndex = this.tabs.findIndex(
      (tab) => tab.getAttribute('aria-selected') === 'true',
    )
    this.tabs.forEach((tab) => {
      const selected = tab === selectedTab
      tab.setAttribute('aria-selected', String(selected))
      tab.tabIndex = selected ? 0 : -1
      const panel = this.panels.get(tab)
      if (panel) panel.hidden = !selected
    })
    this.reflectValue(this.tabValue(selectedTab))

    if (focus) selectedTab.focus()
    if (notify && previousIndex !== index) {
      this.dispatchEvent(
        new CustomEvent(CHANGE_EVENT, {
          bubbles: true,
          composed: true,
          detail: {
            index,
            value: this.tabValue(selectedTab),
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
      this.orientation === 'vertical' ||
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
      this.activation === 'manual' ||
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

  interface HTMLElementEventMap {
    'sds-change': CustomEvent<SdsTabsChangeDetail>
  }
}

export function registerSdsTabs(): void {
  defineCustomElement('sds-tabs', SdsTabsElement)
}
